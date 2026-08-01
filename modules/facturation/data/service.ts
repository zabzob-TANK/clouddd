/**
 * Service applicatif — orchestre les règles du domaine et les ports.
 *
 * C'est ici que se rencontrent le noyau métier (pur) et la persistance
 * (adaptateur). Aucune règle n'y est réécrite : le service se contente
 * d'appeler les fonctions de `domain/rules/`, puis d'enregistrer le résultat.
 *
 * Ces fonctions sont appelées depuis des Server Actions. Elles ne dépendent ni
 * de React ni de Next.js et restent transférables telles quelles.
 */

import {
  cleJour,
  cleJourDepuisDateFr,
  dateDuJour,
  dateFrDepuisCleJour,
  dateFrDepuisHorodatage,
  decalerCleJour,
  heureCourante,
  heureDepuisHorodatage,
  horodatage,
} from '../domain/dates'
import { NATURE_CHEQUE, NATURE_ESPECES, NATURE_VIREMENT } from '../domain/constants'
import { centimesEnTexte } from '../domain/money'
import { natureNormalisee } from '../domain/payment-method'
import {
  anomaliesCandidates,
  anomaliesEnAttente,
  annulationsDeLaPeriode,
  badgeVersement,
  bornesWeekEnd,
  codeImpression,
  codeMode,
  collecterMouvements,
  dansLaPeriode,
  etatImpression,
  etatVeille,
  nombreDePages,
  peutImprimer,
  totalAnnuleCentimes,
  totauxFinance,
  trierMouvements,
  type PeriodeFinance,
  type TotauxFinance,
} from '../domain/rules/finance-day'
import type {
  ContexteCreation,
  ResultatCreation,
  SaisieNouveauRecu,
} from '../domain/rules/create-receipt'
import { preparerCreationRecu } from '../domain/rules/create-receipt'
import type { Resultat } from '../domain/rules/errors'
import { ok } from '../domain/rules/errors'
import type { SaisieVersement } from '../domain/rules/payment'
import { preparerVersement } from '../domain/rules/payment'
import type { SaisieAnnulation } from '../domain/rules/cancellation'
import { preparerAnnulation } from '../domain/rules/cancellation'
import type { SaisieModification } from '../domain/rules/edit-sections'
import { preparerModification } from '../domain/rules/edit-sections'
import { centimesEnTexteDevise } from '../domain/money'
import type {
  Chambre,
  EntreeAudit,
  Hotel,
  Modification,
  OperationPartagee,
  Rabatteur,
  Recu,
  Saison,
  Tarif,
  Utilisateur,
  Vol,
} from '../domain/types'
import { modeDemonstration, sourceDonnees } from './index'
import type { SourceDonnees } from './ports'

/** Instantané complet servi à l'interface. */
export interface EtatFacturation {
  utilisateur: Utilisateur | null
  estAdministrateur: boolean
  saison: Saison
  hotels: Hotel[]
  vols: Vol[]
  chambres: Chambre[]
  rabatteurs: Rabatteur[]
  tarifs: Tarif[]
  recus: Recu[]
  operations: OperationPartagee[]
  audit: EntreeAudit[]
  modeDemonstration: boolean
}

async function tracer(
  source: SourceDonnees,
  action: string,
  detail: string,
  utilisateur: Utilisateur | null,
): Promise<void> {
  // R-86 — chaque action laisse une trace, la plus récente en tête.
  await source.audit.enregistrer({
    id: source.identifiants.nouvelId('audit'),
    horodatage: horodatage(source.horloge.maintenant()),
    action,
    detail,
    utilisateur: utilisateur?.nom ?? '—',
  })
}

/**
 * Écran de connexion du fichier de référence.
 * Renvoie `null` lorsque le couple identifiant / mot de passe est refusé.
 */
export async function connecter(
  identifiant: string,
  motDePasse: string,
): Promise<Utilisateur | null> {
  const source = sourceDonnees()
  const utilisateur = await source.session.connecter(identifiant, motDePasse)
  if (utilisateur) await tracer(source, 'دخول', 'اتصال بالنظام', utilisateur)
  return utilisateur
}

/** Trace la déconnexion, comme `logout()` du fichier de référence. */
export async function deconnecter(): Promise<void> {
  const source = sourceDonnees()
  const utilisateur = await source.session.utilisateurCourant()
  await tracer(source, 'خروج', 'قطع الاتصال', utilisateur)
}

/** Charge tout ce dont l'interface a besoin, en une fois. */
export async function chargerEtat(): Promise<EtatFacturation> {
  const source = sourceDonnees()
  const utilisateur = await source.session.utilisateurCourant()
  const saison = await source.referentiels.saisonActive()

  const [hotels, vols, chambres, rabatteurs, tarifs, recus, operations, audit] = await Promise.all([
    source.referentiels.hotels(),
    source.referentiels.vols(),
    source.referentiels.chambres(),
    source.referentiels.rabatteurs(),
    source.referentiels.tarifs(saison.id),
    source.recus.lister({ inclureAnnules: true }),
    source.operationsPartagees.lister(),
    source.audit.lister(200),
  ])

  return {
    utilisateur,
    estAdministrateur: utilisateur ? source.session.estAdministrateur(utilisateur) : false,
    saison,
    hotels,
    vols,
    chambres,
    rabatteurs,
    tarifs,
    recus,
    operations,
    audit,
    modeDemonstration: modeDemonstration(),
  }
}

async function contexteCommun(source: SourceDonnees) {
  const maintenant = source.horloge.maintenant()
  const utilisateur = await source.session.utilisateurCourant()
  const saison = await source.referentiels.saisonActive()
  return {
    maintenant,
    utilisateur,
    saison,
    tarifs: await source.referentiels.tarifs(saison.id),
    operations: await source.operationsPartagees.lister(),
    recus: await source.recus.lister({ inclureAnnules: true }),
    horodatage: horodatage(maintenant),
    date: dateDuJour(maintenant),
    heure: heureCourante(maintenant),
    employe: utilisateur?.nom ?? '—',
  }
}

/** R-01 à R-14 — Crée un reçu après validation par le noyau métier. */
export async function creerRecu(
  saisie: SaisieNouveauRecu,
  depassementConfirme = false,
): Promise<Resultat<{ recuId: string; numero: number }>> {
  const source = sourceDonnees()
  const base = await contexteCommun(source)

  // R-11 — le numéro est réservé sur la séquence avant validation, comme dans
  // le fichier de référence où `prochainNumero` est lu puis incrémenté.
  const numero = await source.recus.reserverNumero()
  const clientId = source.identifiants.nouvelId('client')

  const contexte: ContexteCreation = {
    operations: base.operations,
    recus: base.recus,
    nouvelIdOperation: () => source.identifiants.nouvelId('SOP'),
    horodatage: base.horodatage,
    employe: base.employe,
    tarifs: base.tarifs,
    reductionMaxCentimes: base.saison.reductionMaxCentimes,
    numero,
    clientId,
    idVersement: source.identifiants.nouvelId('versement'),
    date: base.date,
    heure: base.heure,
    depassementConfirme,
  }

  const resultat = preparerCreationRecu(saisie, contexte)
  if (resultat.statut !== 'ok') return resultat

  const { donnees, nouvelleOperation } = resultat.valeur as ResultatCreation
  if (nouvelleOperation) await source.operationsPartagees.creer(nouvelleOperation)

  // R-13 — le client est créé et rattaché au reçu.
  await source.clients.creer({
    id: clientId,
    nom: donnees.nom,
    prenom: donnees.prenom,
    photoUrl: '',
    passeport: donnees.passeport,
    creeLe: base.horodatage,
    creePar: base.employe,
    recuIds: [],
  })

  const recu = await source.recus.creer(donnees)
  await source.clients.rattacherRecu(clientId, recu.id)

  await tracer(
    source,
    'إنشاء',
    `وصل ${recu.numero} — ${donnees.prenom} ${donnees.nom} — ` +
      centimesEnTexteDevise(donnees.premierVersement.montantCentimes),
    base.utilisateur,
  )

  return ok({ recuId: recu.id, numero: recu.numero })
}

/** R-15 à R-22 — Ajoute un versement à un reçu existant. */
export async function ajouterVersement(
  saisie: SaisieVersement,
  depassementConfirme = false,
): Promise<Resultat<{ recuId: string }>> {
  const source = sourceDonnees()
  const base = await contexteCommun(source)

  const numero = Number(saisie.numeroRecu)
  const recu = Number.isFinite(numero) ? await source.recus.parNumero(numero) : null

  const resultat = preparerVersement(saisie, recu, {
    operations: base.operations,
    recus: base.recus,
    nouvelIdOperation: () => source.identifiants.nouvelId('SOP'),
    horodatage: base.horodatage,
    employe: base.employe,
    idVersement: source.identifiants.nouvelId('versement'),
    date: base.date,
    heure: base.heure,
    depassementConfirme,
  })
  if (resultat.statut !== 'ok') return resultat

  const { versement, nouvelleOperation } = resultat.valeur
  if (nouvelleOperation) await source.operationsPartagees.creer(nouvelleOperation)

  const cible = recu as Recu
  await source.recus.ajouterVersement(cible.id, versement)

  await tracer(
    source,
    'دفعة',
    `وصل ${cible.numero} — دفعة ${versement.rang} — ` +
      centimesEnTexteDevise(versement.montantCentimes),
    base.utilisateur,
  )

  return ok({ recuId: cible.id })
}

/** R-43 à R-47 — Annule un reçu sans jamais le supprimer. */
export async function annulerRecu(
  recuId: string,
  saisie: SaisieAnnulation,
): Promise<Resultat<null>> {
  const source = sourceDonnees()
  const base = await contexteCommun(source)
  const recu = await source.recus.parId(recuId)
  if (!recu) return { statut: 'erreurs', erreurs: [{ champ: 'motif', code: 'numero-recu-introuvable' }] }

  // R-44 — la vérification du mot de passe est déléguée : aucun secret ne
  // traverse le domaine.
  const identiteVerifiee = saisie.motDePasse
    ? await source.session.verifierIdentite(saisie.motDePasse)
    : false

  const resultat = preparerAnnulation(saisie, recu, {
    employe: base.employe,
    horodatage: base.horodatage,
    date: base.date,
    heure: base.heure,
    jour: cleJour(base.maintenant),
    idMouvement: source.identifiants.nouvelId('mouvement'),
    identiteVerifiee,
  })
  if (resultat.statut !== 'ok') return resultat

  const { donnees, mouvementCaisse } = resultat.valeur
  await source.recus.annuler(recuId, donnees)
  if (mouvementCaisse) await source.mouvementsCaisse.creer(mouvementCaisse)

  await tracer(
    source,
    'إلغاء',
    `وصل ${recu.numero} — ${donnees.motif} — ` +
      (donnees.modeRemboursement === 'cash' ? 'من الصندوق' : 'خارج الصندوق'),
    base.utilisateur,
  )

  return ok(null)
}

/** R-49 à R-55 — Modifie une seule section d'un reçu. */
export async function modifierRecu(
  recuId: string,
  saisie: SaisieModification,
): Promise<Resultat<null>> {
  const source = sourceDonnees()
  const base = await contexteCommun(source)
  const recu = await source.recus.parId(recuId)
  if (!recu) return { statut: 'erreurs', erreurs: [{ champ: 'section', code: 'numero-recu-introuvable' }] }

  const resultat = preparerModification(saisie, recu, {
    tarifs: base.tarifs,
    reductionMaxCentimes: base.saison.reductionMaxCentimes,
  })
  if (resultat.statut !== 'ok') return resultat

  const { section, sectionLibelle, motif, changements, champsModifies } = resultat.valeur

  const modification: Modification = {
    id: source.identifiants.nouvelId('modification'),
    section,
    sectionLibelle,
    changements,
    motif,
    employe: base.employe,
    dateHeure: base.horodatage,
  }

  await source.recus.appliquerModification(recuId, champsModifies, modification)

  const resume = changements
    .map((c) => `${c.champ} : ${c.ancienne || '—'} → ${c.nouvelle || '—'}`)
    .join(' · ')
  await tracer(
    source,
    'تعديل',
    `وصل ${recu.numero} — ${sectionLibelle} — ${resume} — السبب: ${motif}`,
    base.utilisateur,
  )

  return ok(null)
}

/** R-84 — Comptabilise une impression du reçu. */
export async function enregistrerImpressionRecu(recuId: string): Promise<Resultat<null>> {
  const source = sourceDonnees()
  const utilisateur = await source.session.utilisateurCourant()
  const recu = await source.recus.parId(recuId)
  if (!recu) return { statut: 'erreurs', erreurs: [{ champ: 'recu', code: 'numero-recu-introuvable' }] }

  const total = await source.recus.incrementerImpressions(recuId)
  await tracer(source, 'طباعة', `وصل ${recu.numero} — طباعة رقم ${total}`, utilisateur)
  return ok(null)
}

// ---------------------------------------------------------------------------
// Journal financier — lot L4
// ---------------------------------------------------------------------------

/** Une ligne du journal, prête à être affichée. */
export interface LigneJournal {
  id: string
  recuId: string
  heure: string
  date: string
  numeroRecu: number
  badge: string
  premierVersement: boolean
  client: string
  especes: string
  banque: string
  codeMode: string
  valeurReelle: string
  infosInstrument: string
  employe: string
  rabatteur: string
  hotel: string
  chambre: string
  vol: string
  convenu: string
  restant: string
  statut: string
  /** R-63 — la ligne est apparue après la dernière impression. */
  anomalie: boolean
}

/** Une ligne d'annulation, présentée séparément (R-60). */
export interface LigneAnnulation {
  id: string
  heure: string
  date: string
  numeroRecu: number
  client: string
  especes: string
  banque: string
  codeMode: string
  valeurReelle: string
  infosInstrument: string
  employe: string
  rabatteur: string
  hotel: string
  chambre: string
  vol: string
  convenu: string
}

export interface JournalFinancier {
  periode: PeriodeFinance
  libellePeriode: string
  jourSelectionne: string | null
  lignes: LigneJournal[]
  annulations: LigneAnnulation[]
  totaux: TotauxFinance
  nouveauxClients: number
  dernierRecu: string
  chequesSansImage: number
  modifications: number
  nombreAnnulations: number
  totalAnnule: string
  /** R-62 */
  nombreImpressions: number
  codeImpression: string
  /** R-63, R-65 */
  anomaliesEnAttente: string[]
  /** R-66 */
  etatVeille: string
  symboleEtat: string
  couleurEtat: string
  /** R-61 */
  peutImprimer: boolean
  /** R-67 */
  nombrePages: number
  estAdministrateur: boolean
}

function libellePeriode(periode: PeriodeFinance, maintenant: Date): string {
  if (periode.filtre === 'day') {
    return dateFrDepuisCleJour(periode.jour || cleJour(maintenant))
  }
  if (periode.filtre === 'weekend') {
    const { debut, fin } = bornesWeekEnd(maintenant)
    return `${dateFrDepuisCleJour(debut)} إلى ${dateFrDepuisCleJour(fin)}`
  }
  if (periode.filtre === 'custom') {
    if (!periode.du && !periode.au) return 'اختر فترة'
    return `${dateFrDepuisCleJour(periode.du || periode.au!)} إلى ${dateFrDepuisCleJour(periode.au || periode.du!)}`
  }
  return 'كل الفترات'
}

/** Construit le journal financier pour une période. */
export async function journalFinancier(periode: PeriodeFinance): Promise<JournalFinancier> {
  const source = sourceDonnees()
  const maintenant = source.horloge.maintenant()
  const utilisateur = await source.session.utilisateurCourant()
  const estAdministrateur = utilisateur ? source.session.estAdministrateur(utilisateur) : false

  const recus = await source.recus.lister({ inclureAnnules: true })
  const mouvementsCaisse = await source.mouvementsCaisse.lister()
  const operations = await source.operationsPartagees.lister()

  const tous = collecterMouvements(recus)
  const retenus = trierMouvements(tous.filter((m) => dansLaPeriode(m.jour, periode, maintenant)))

  const remboursements = mouvementsCaisse.filter(
    (m) => m.type === 'refund_cash' && dansLaPeriode(m.jour, periode, maintenant),
  )

  const jourSelectionne = periode.filtre === 'day' ? periode.jour || cleJour(maintenant) : null

  // R-63, R-64, R-65
  let anomalies: string[] = []
  let nombreImpressions = 0
  if (jourSelectionne) {
    const impressions = await source.impressionsFinance.listerParJour(jourSelectionne)
    nombreImpressions = impressions.length
    const idsDuJour = [
      ...tous.filter((m) => m.jour === jourSelectionne).map((m) => m.id),
      ...mouvementsCaisse.filter((m) => m.jour === jourSelectionne).map((m) => m.id),
    ].sort()
    const acquittement = await source.acquittementsAnomalie.parJour(jourSelectionne)
    anomalies = anomaliesEnAttente(anomaliesCandidates(impressions, idsDuJour), acquittement)
  }

  const anomaliePendante = estAdministrateur && anomalies.length > 0

  // R-66 — état de la veille.
  let etatDeLaVeille = '✓'
  if (jourSelectionne) {
    const veille = decalerCleJour(jourSelectionne, -1)
    const impressionsVeille = await source.impressionsFinance.listerParJour(veille)
    const idsVeille = [
      ...tous.filter((m) => m.jour === veille).map((m) => m.id),
      ...mouvementsCaisse.filter((m) => m.jour === veille).map((m) => m.id),
    ].sort()
    const acquittementVeille = await source.acquittementsAnomalie.parJour(veille)
    etatDeLaVeille = etatVeille(
      anomaliesEnAttente(anomaliesCandidates(impressionsVeille, idsVeille), acquittementVeille),
    )
  }

  const lignes: LigneJournal[] = retenus.map((mouvement) => {
    const { recu, versement, index, nature } = mouvement
    const instantane = versement.instantane
    const estBancaire = nature === NATURE_CHEQUE || nature === NATURE_VIREMENT
    return {
      id: mouvement.id,
      recuId: recu.id,
      heure: mouvement.heure,
      date: versement.date || '—',
      numeroRecu: recu.numero,
      badge: badgeVersement(index),
      premierVersement: index === 0,
      client: instantane.client || `${recu.prenom} ${recu.nom}`,
      especes: nature === NATURE_ESPECES ? centimesEnTexte(versement.montantCentimes) : '—',
      banque: estBancaire ? centimesEnTexte(versement.montantCentimes) : '—',
      codeMode: codeMode(versement),
      valeurReelle:
        estBancaire && versement.montantOperationCentimes > 0
          ? centimesEnTexte(versement.montantOperationCentimes)
          : '—',
      infosInstrument: estBancaire
        ? `${versement.banque || '—'} / ${versement.referenceInstrument || '—'}`
        : '—',
      employe: versement.enregistrePar || recu.employe || '—',
      rabatteur: instantane.rabatteur || recu.rabatteur || '—',
      hotel: instantane.hotel || recu.hotel || '—',
      chambre: instantane.chambre || recu.chambre || '—',
      vol: instantane.vol || recu.vol || '—',
      convenu: centimesEnTexte(instantane.convenuCentimes ?? recu.convenuCentimes),
      restant: centimesEnTexte(instantane.restantApresCentimes),
      statut: instantane.statutApres,
      anomalie: anomaliePendante && anomalies.includes(mouvement.id),
    }
  })

  // R-60 — lignes d'annulation.
  const annulees = annulationsDeLaPeriode(recus, periode, maintenant)
  const annulations: LigneAnnulation[] = annulees.map((recu) => {
    const natures = [...new Set(recu.versements.map((v) => natureNormalisee(v.nature)))]
    const especes = recu.versements
      .filter((v) => natureNormalisee(v.nature) === NATURE_ESPECES)
      .reduce((s, v) => s + v.montantCentimes, 0)
    const banque = recu.versements
      .filter((v) => natureNormalisee(v.nature) !== NATURE_ESPECES)
      .reduce((s, v) => s + v.montantCentimes, 0)
    const reel = Math.max(0, ...recu.versements.map((v) => v.montantOperationCentimes))
    const infos = [
      ...new Set(
        recu.versements
          .filter((v) => natureNormalisee(v.nature) !== NATURE_ESPECES)
          .map((v) => `${v.banque || '—'} / ${v.referenceInstrument || '—'}`),
      ),
    ]
    const route = recu.modeRemboursement === 'cash' ? 'من الصندوق' : 'خارج الصندوق'
    return {
      id: recu.id,
      heure: heureDepuisHorodatage(recu.annuleLe) || '—',
      date: dateFrDepuisHorodatage(recu.annuleLe) || '—',
      numeroRecu: recu.numero,
      client: `${recu.prenom} ${recu.nom}`,
      especes: especes ? centimesEnTexte(especes) : '—',
      banque: banque ? centimesEnTexte(banque) : '—',
      codeMode: natures
        .map((n) => (n === NATURE_ESPECES ? 'E' : n === NATURE_VIREMENT ? 'V' : 'CH'))
        .join('/'),
      valeurReelle: reel ? centimesEnTexte(reel) : '—',
      infosInstrument: `${route} / ${infos.length ? infos.join(' · ') : recu.motifAnnulation || '—'}`,
      employe: recu.annulePar || recu.employe || '—',
      rabatteur: recu.rabatteur || '—',
      hotel: recu.hotel || '—',
      chambre: recu.chambre || '—',
      vol: recu.vol || '—',
      convenu: centimesEnTexte(recu.convenuCentimes),
    }
  })

  const totaux = totauxFinance(retenus, remboursements)

  const chequesSansImage = operations.filter((operation) => {
    if (natureNormalisee(operation.nature) !== NATURE_CHEQUE) return false
    if (operation.image) return false
    return retenus.some((m) => m.versement.operationPartageeId === operation.id)
  }).length

  const modifications = recus.reduce(
    (compte, recu) =>
      compte +
      recu.modifications.filter((modification) =>
        dansLaPeriode(
          cleJourDepuisDateFr(dateFrDepuisHorodatage(modification.dateHeure)),
          periode,
          maintenant,
        ),
      ).length,
    0,
  )

  const aujourdhui = cleJour(maintenant)
  const hier = decalerCleJour(aujourdhui, -1)
  const etat = etatImpression({
    anomalieEnAttente: anomaliePendante,
    estAujourdhui: jourSelectionne === aujourdhui,
  })

  return {
    periode,
    libellePeriode: libellePeriode(periode, maintenant),
    jourSelectionne,
    lignes,
    annulations,
    totaux,
    nouveauxClients: retenus.filter((m) => m.index === 0).length,
    dernierRecu: retenus.length
      ? String(Math.max(...retenus.map((m) => m.recu.numero)))
      : '—',
    chequesSansImage,
    modifications,
    nombreAnnulations: annulees.length,
    totalAnnule: centimesEnTexte(totalAnnuleCentimes(annulees)),
    nombreImpressions,
    codeImpression: codeImpression(nombreImpressions),
    anomaliesEnAttente: anomalies,
    etatVeille: etatDeLaVeille,
    symboleEtat: etat.symbole,
    couleurEtat: etat.couleur,
    peutImprimer: peutImprimer({
      jour: jourSelectionne,
      aujourdhui,
      hier,
      estAdministrateur,
    }),
    nombrePages: nombreDePages(lignes.length + annulations.length),
    estAdministrateur,
  }
}

/** R-61, R-62 — Enregistre une impression du journal. */
export async function enregistrerImpressionFinance(
  jour: string,
): Promise<Resultat<{ numeroImpression: number }>> {
  const source = sourceDonnees()
  const maintenant = source.horloge.maintenant()
  const utilisateur = await source.session.utilisateurCourant()
  const estAdministrateur = utilisateur ? source.session.estAdministrateur(utilisateur) : false

  const aujourdhui = cleJour(maintenant)
  const hier = decalerCleJour(aujourdhui, -1)

  // R-61 — un employé ne peut imprimer que la journée courante ou la veille.
  if (!peutImprimer({ jour, aujourdhui, hier, estAdministrateur })) {
    return {
      statut: 'erreurs',
      erreurs: [{ champ: 'jour', code: 'impression-hors-periode-autorisee' }],
    }
  }

  const recus = await source.recus.lister({ inclureAnnules: true })
  const mouvementsCaisse = await source.mouvementsCaisse.lister()
  const impressions = await source.impressionsFinance.listerParJour(jour)

  const mouvementIds = [
    ...collecterMouvements(recus)
      .filter((m) => m.jour === jour)
      .map((m) => m.id),
    ...mouvementsCaisse.filter((m) => m.jour === jour).map((m) => m.id),
  ].sort()

  const numeroImpression = impressions.length + 1
  await source.impressionsFinance.creer({
    id: source.identifiants.nouvelId('impression'),
    jour,
    imprimeLe: horodatage(maintenant),
    employe: utilisateur?.nom ?? '—',
    numeroImpression,
    mouvementIds,
    nombreLignes: mouvementIds.length,
  })

  await tracer(
    source,
    'طباعة الصندوق',
    `${dateFrDepuisCleJour(jour)} — ${String(numeroImpression).padStart(2, '0')} — ${mouvementIds.length} حركة`,
    utilisateur,
  )

  return ok({ numeroImpression })
}

/** R-65 — Acquitte les anomalies d'une journée. Réservé à l'administrateur. */
export async function acquitterAnomalies(jour: string): Promise<Resultat<null>> {
  const source = sourceDonnees()
  const utilisateur = await source.session.utilisateurCourant()
  const estAdministrateur = utilisateur ? source.session.estAdministrateur(utilisateur) : false

  if (!estAdministrateur) {
    return {
      statut: 'erreurs',
      erreurs: [{ champ: 'anomalie', code: 'acquittement-reserve-administrateur' }],
    }
  }

  const journal = await journalFinancier({ filtre: 'day', jour })
  if (!journal.anomaliesEnAttente.length) return ok(null)

  const maintenant = source.horloge.maintenant()
  const precedent = await source.acquittementsAnomalie.parJour(jour)
  const tous = [
    ...new Set([...(precedent?.mouvementIds ?? []), ...journal.anomaliesEnAttente].map(String)),
  ].sort()

  await source.acquittementsAnomalie.acquitter({
    jour,
    mouvementIds: tous,
    acquitteLe: horodatage(maintenant),
    acquittePar: utilisateur?.nom ?? '—',
  })

  await tracer(
    source,
    'مراجعة',
    `تأكيد مراجعة ${journal.anomaliesEnAttente.length} عملية — ${dateFrDepuisCleJour(jour)}`,
    utilisateur,
  )

  return ok(null)
}
