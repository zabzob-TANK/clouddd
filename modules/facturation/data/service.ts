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

import { cleJour, dateDuJour, heureCourante, horodatage } from '../domain/dates'
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
    'Création',
    `Reçu ${recu.numero} — ${donnees.prenom} ${donnees.nom} — ` +
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
    'Versement',
    `Reçu ${cible.numero} — versement ${versement.rang} — ` +
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
    'Annulation',
    `Reçu ${recu.numero} — ${donnees.motif} — ` +
      (donnees.modeRemboursement === 'cash' ? 'depuis la caisse' : 'hors caisse'),
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
    'Modification',
    `Reçu ${recu.numero} — ${sectionLibelle} — ${resume} — motif : ${motif}`,
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
  await tracer(source, 'Impression', `Reçu ${recu.numero} — impression ${total}`, utilisateur)
  return ok(null)
}
