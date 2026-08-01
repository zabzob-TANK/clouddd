/**
 * Modification d'un reçu, section par section.
 *
 * Couvre : R-49 à R-55.
 *
 * Une seule section est modifiable à la fois, le motif est toujours obligatoire,
 * et chaque changement est consigné champ par champ. Le rabatteur et les
 * montants des versements ne sont jamais modifiables.
 */

import { NATURE_ESPECES } from '../constants'
import { dateFrValide } from '../dates'
import { chiffresTelephone } from '../format'
import { centimesEnTexteDevise, dirhamsSaisisEnCentimes } from '../money'
import { natureNormalisee } from '../payment-method'
import type { ChangementChamp, Recu, SectionModifiable, Tarif } from '../types'
import {
  erreurs,
  montantPourMessage,
  ok,
  type ErreurValidation,
  type Resultat,
} from './errors'
import { totalPaye } from './receipt'
import {
  construireGrille,
  montantConvenu,
  reductionAtteintLeTarif,
  reductionDepasseLePlafond,
} from './tarif'

/** R-49 — Sections modifiables, et elles seules. */
export const SECTIONS_MODIFIABLES: readonly SectionModifiable[] = [
  'identity',
  'contact',
  'program',
  'group',
  'note',
  'firstPayment',
] as const

/**
 * Libellés français des sections.
 * Traduction des libellés arabes de `editSectionName()`.
 */
export const LIBELLES_SECTIONS: Record<SectionModifiable, string> = {
  identity: 'Identité',
  contact: 'Téléphone',
  program: 'Programme et prix',
  group: 'Groupe / famille',
  note: 'Note',
  firstPayment: 'Méthode du premier versement',
}

/** Noms de champs consignés dans l'historique, en français. */
const CHAMPS = {
  prenom: 'Prénom',
  nom: 'Nom',
  telephone: 'Téléphone',
  hotel: 'Hôtel',
  vol: 'Vol',
  chambre: 'Chambre',
  tarif: "Prix d'origine",
  reduction: 'Réduction',
  convenu: 'Montant convenu',
  groupe: 'Groupe',
  note: 'Note',
  nature: 'Méthode de paiement',
  reference: 'Numéro / référence',
  dateInstrument: "Date de l'opération",
  banque: 'Banque',
  payeur: 'Payeur',
  montantOperation: "Montant de l'opération",
} as const

export interface SaisieModification {
  section: SectionModifiable | ''
  motif: string
  // Identité
  prenom: string
  nom: string
  // Contact
  telephone: string
  // Programme
  hotel: string
  vol: string
  chambre: string
  /** Réduction saisie en dirhams. */
  reduction: string
  // Groupe
  groupeCoche: boolean
  groupe: string
  // Note
  note: string
  // Premier versement — méthode et instrument uniquement, jamais le montant
  nature: string
  reference: string
  dateInstrument: string
  banque: string
  operationPartagee: boolean
  payeur: string
  /** Montant total de l'opération, saisi en dirhams. */
  montantOperation: string
}

export interface ResultatModification {
  section: SectionModifiable
  sectionLibelle: string
  motif: string
  changements: ChangementChamp[]
  /** Champs du reçu à mettre à jour. */
  champsModifies: Partial<Recu>
}

export interface ContexteModification {
  tarifs: readonly Tarif[]
  reductionMaxCentimes: number
}

/**
 * Compare deux valeurs comme le fait `same()` du fichier de référence :
 * conversion en chaîne, `null` et `undefined` valant la chaîne vide.
 */
export function memeValeur(a: unknown, b: unknown): boolean {
  return String(a ?? '') === String(b ?? '')
}

/**
 * R-51 — Consigne un changement, seulement s'il y en a un.
 * Reproduit `pushChange()`.
 */
export function consignerChangement(
  liste: ChangementChamp[],
  champ: string,
  ancienne: unknown,
  nouvelle: unknown,
): void {
  if (!memeValeur(ancienne, nouvelle)) {
    liste.push({
      champ,
      ancienne: String(ancienne ?? ''),
      nouvelle: String(nouvelle ?? ''),
    })
  }
}

/**
 * R-53 — Une opération partagée ne se modifie pas depuis le reçu.
 *
 * Reproduit le refus de `editFirstPayment()` : les données d'une opération
 * mutualisée appartiennent au registre des paiements, pas à un reçu particulier.
 */
export function premierVersementModifiable(recu: Recu): boolean {
  const premier = recu.versements[0]
  if (!premier) return true
  return !(premier.portee === 'shared' || premier.operationPartageeId)
}

/**
 * R-49 à R-55 — Valide et prépare une modification.
 *
 * L'ordre reproduit `saveEdit()` : le motif est contrôlé en premier, puis les
 * champs de la section choisie, toutes les erreurs étant cumulées.
 */
export function preparerModification(
  saisie: SaisieModification,
  recu: Recu,
  contexte: ContexteModification,
): Resultat<ResultatModification> {
  // R-49
  if (!saisie.section) return erreurs([{ champ: 'section', code: 'section-obligatoire' }])
  const section = saisie.section

  const liste: ErreurValidation[] = []
  const changements: ChangementChamp[] = []
  const champsModifies: Partial<Recu> = {}

  // R-50 — le motif est contrôlé avant tout le reste.
  if (!saisie.motif.trim()) {
    liste.push({ champ: 'motif', code: 'motif-modification-obligatoire' })
  }

  if (section === 'identity') {
    if (!saisie.prenom.trim()) liste.push({ champ: 'prenom', code: 'prenom-obligatoire' })
    if (!saisie.nom.trim()) liste.push({ champ: 'nom', code: 'nom-obligatoire' })
    consignerChangement(changements, CHAMPS.prenom, recu.prenom, saisie.prenom.trim())
    consignerChangement(changements, CHAMPS.nom, recu.nom, saisie.nom.trim())
    champsModifies.prenom = saisie.prenom.trim()
    champsModifies.nom = saisie.nom.trim()
  }

  if (section === 'contact') {
    if (!saisie.telephone.trim()) {
      liste.push({ champ: 'telephone', code: 'telephone-obligatoire' })
    } else if (chiffresTelephone(saisie.telephone) !== 10) {
      liste.push({ champ: 'telephone', code: 'telephone-dix-chiffres' })
    }
    consignerChangement(changements, CHAMPS.telephone, recu.telephone, saisie.telephone)
    champsModifies.telephone = saisie.telephone
  }

  if (section === 'program') {
    if (!saisie.hotel) liste.push({ champ: 'hotel', code: 'hotel-obligatoire' })
    if (!saisie.vol) liste.push({ champ: 'vol', code: 'vol-obligatoire' })
    if (!saisie.chambre) liste.push({ champ: 'chambre', code: 'chambre-obligatoire' })

    const grille = construireGrille(contexte.tarifs)
    const nouveauTarif = grille.tarifPour(saisie.hotel, saisie.vol, saisie.chambre)
    const nouvelleReduction = dirhamsSaisisEnCentimes(saisie.reduction)
    let nouveauConvenu = recu.convenuCentimes

    // R-52
    if (nouveauTarif === null) {
      liste.push({ champ: 'hotel', code: 'tarif-introuvable' })
    } else {
      if (reductionDepasseLePlafond(nouvelleReduction, contexte.reductionMaxCentimes)) {
        liste.push({
          champ: 'reduction',
          code: 'reduction-superieure-au-plafond',
          parametres: { plafond: montantPourMessage(contexte.reductionMaxCentimes) },
        })
      }
      if (reductionAtteintLeTarif(nouvelleReduction, nouveauTarif)) {
        liste.push({ champ: 'reduction', code: 'reduction-superieure-ou-egale-au-tarif' })
      }
      nouveauConvenu = montantConvenu(nouveauTarif, nouvelleReduction)

      // Le nouveau convenu ne peut pas passer sous le montant déjà encaissé.
      const paye = totalPaye(recu)
      if (nouveauConvenu < paye) {
        liste.push({
          champ: 'reduction',
          code: 'convenu-inferieur-au-paye',
          parametres: { paye: montantPourMessage(paye) },
        })
      }

      champsModifies.tarifCentimes = nouveauTarif
      champsModifies.reductionCentimes = nouvelleReduction
      champsModifies.convenuCentimes = nouveauConvenu
      champsModifies.hotel = saisie.hotel
      champsModifies.vol = saisie.vol
      champsModifies.chambre = saisie.chambre
    }

    consignerChangement(changements, CHAMPS.hotel, recu.hotel, saisie.hotel)
    consignerChangement(changements, CHAMPS.vol, recu.vol, saisie.vol)
    consignerChangement(changements, CHAMPS.chambre, recu.chambre, saisie.chambre)
    consignerChangement(
      changements,
      CHAMPS.tarif,
      centimesEnTexteDevise(recu.tarifCentimes),
      nouveauTarif === null ? '—' : centimesEnTexteDevise(nouveauTarif),
    )
    consignerChangement(
      changements,
      CHAMPS.reduction,
      centimesEnTexteDevise(recu.reductionCentimes),
      centimesEnTexteDevise(nouvelleReduction),
    )
    consignerChangement(
      changements,
      CHAMPS.convenu,
      centimesEnTexteDevise(recu.convenuCentimes),
      nouveauTarif === null ? '—' : centimesEnTexteDevise(nouveauConvenu),
    )
  }

  if (section === 'group') {
    if (saisie.groupeCoche && !saisie.groupe.trim()) {
      liste.push({ champ: 'groupe', code: 'groupe-obligatoire' })
    }
    const nouveauGroupe = saisie.groupeCoche ? saisie.groupe.trim() : ''
    consignerChangement(changements, CHAMPS.groupe, recu.groupe || '', nouveauGroupe)
    champsModifies.groupe = nouveauGroupe
  }

  if (section === 'note') {
    consignerChangement(changements, CHAMPS.note, recu.note || '', saisie.note || '')
    champsModifies.note = saisie.note || ''
  }

  if (section === 'firstPayment') {
    const premier = recu.versements[0]
    if (!premier) {
      liste.push({ champ: 'nature', code: 'premier-versement-absent' })
    }

    const espece = natureNormalisee(saisie.nature) === NATURE_ESPECES
    if (!espece) {
      if (!saisie.reference.trim()) {
        liste.push({ champ: 'reference', code: 'reference-instrument-obligatoire' })
      }
      if (!saisie.dateInstrument.trim()) {
        liste.push({ champ: 'dateInstrument', code: 'date-instrument-obligatoire' })
      } else if (!dateFrValide(saisie.dateInstrument)) {
        liste.push({ champ: 'dateInstrument', code: 'date-instrument-invalide' })
      }
      if (!saisie.banque.trim()) liste.push({ champ: 'banque', code: 'banque-obligatoire' })
      if (saisie.operationPartagee) {
        if (!saisie.payeur.trim()) liste.push({ champ: 'payeur', code: 'payeur-obligatoire' })
        if (!saisie.montantOperation.trim()) {
          liste.push({ champ: 'montantOperation', code: 'montant-operation-obligatoire' })
        }
      }
    }

    if (premier) {
      // R-53 — seuls la méthode et les données d'instrument changent.
      // Le montant du versement n'est jamais touché.
      const reference = espece ? '' : saisie.reference.trim()
      const dateInstrument = espece ? '' : saisie.dateInstrument.trim()
      const banque = espece ? '' : saisie.banque.trim()
      const payeur = espece || !saisie.operationPartagee ? '' : saisie.payeur.trim()
      const montantOperation =
        espece || !saisie.operationPartagee ? 0 : dirhamsSaisisEnCentimes(saisie.montantOperation)

      consignerChangement(changements, CHAMPS.nature, premier.nature, saisie.nature)
      consignerChangement(changements, CHAMPS.reference, premier.referenceInstrument, reference)
      consignerChangement(
        changements,
        CHAMPS.dateInstrument,
        premier.dateInstrument,
        dateInstrument,
      )
      consignerChangement(changements, CHAMPS.banque, premier.banque, banque)
      consignerChangement(changements, CHAMPS.payeur, premier.payeur, payeur)
      consignerChangement(
        changements,
        CHAMPS.montantOperation,
        centimesEnTexteDevise(premier.montantOperationCentimes),
        centimesEnTexteDevise(montantOperation),
      )
    }
  }

  if (liste.length) return erreurs(liste)

  return ok({
    section,
    sectionLibelle: LIBELLES_SECTIONS[section],
    motif: saisie.motif.trim(),
    changements,
    champsModifies,
  })
}

/**
 * R-54, R-55 — Champs et versements jamais modifiables.
 *
 * Rendus explicites pour être testables et pour que l'interface les grise sans
 * dupliquer la règle.
 */
export const CHAMPS_NON_MODIFIABLES = [
  'numero',
  'date',
  'rabatteur',
  'montantPremierVersement',
] as const

/** R-55 — Seul le premier versement est concerné par une modification. */
export function versementModifiable(rang: number): boolean {
  return rang === 1
}
