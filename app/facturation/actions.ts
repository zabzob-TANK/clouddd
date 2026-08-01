'use server'

/**
 * Actions serveur du module de facturation.
 *
 * Fine enveloppe autour du service applicatif : aucune règle n'est écrite ici.
 * Toute la validation est faite côté serveur par le noyau métier, y compris
 * lorsque l'interface a déjà affiché un aperçu — le client ne décide rien.
 */

import {
  ajouterVersement as ajouterVersementService,
  annulerRecu as annulerRecuService,
  chargerEtat as chargerEtatService,
  creerRecu as creerRecuService,
  modifierRecu as modifierRecuService,
  type EtatFacturation,
} from '@/modules/facturation/data/service'
import {
  connecter as connecterService,
  deconnecter as deconnecterService,
  enregistrerImpressionRecu as enregistrerImpressionService,
  journalFinancier as journalFinancierService,
  enregistrerImpressionFinance as enregistrerImpressionFinanceService,
  acquitterAnomalies as acquitterAnomaliesService,
  suiviJournalier as suiviJournalierService,
  registreBancaire as registreBancaireService,
  ajouterImageOperation as ajouterImageOperationService,
  ajouterImageDernierVersement as ajouterImageDernierVersementService,
  supprimerImageOperation as supprimerImageOperationService,
  type JournalFinancier,
  type OptionsSuiviJournalier,
  type RegistreBancaire,
  type SuiviJournalier,
} from '@/modules/facturation/data/service'
import type { FiltresRegistre } from '@/modules/facturation/domain/rules/cheque-register'
import type { PeriodeFinance } from '@/modules/facturation/domain/rules/finance-day'
import type { Utilisateur } from '@/modules/facturation/domain/types'
import type { SaisieAnnulation } from '@/modules/facturation/domain/rules/cancellation'
import type { SaisieNouveauRecu } from '@/modules/facturation/domain/rules/create-receipt'
import type { SaisieModification } from '@/modules/facturation/domain/rules/edit-sections'
import type { Resultat } from '@/modules/facturation/domain/rules/errors'
import type { SaisieVersement } from '@/modules/facturation/domain/rules/payment'

export async function connecter(
  identifiant: string,
  motDePasse: string,
): Promise<Utilisateur | null> {
  return connecterService(identifiant, motDePasse)
}

export async function deconnecter(): Promise<void> {
  return deconnecterService()
}

export async function enregistrerImpression(recuId: string): Promise<Resultat<null>> {
  return enregistrerImpressionService(recuId)
}

export async function journalFinancier(periode: PeriodeFinance): Promise<JournalFinancier> {
  return journalFinancierService(periode)
}

export async function enregistrerImpressionFinance(
  jour: string,
): Promise<Resultat<{ numeroImpression: number }>> {
  return enregistrerImpressionFinanceService(jour)
}

export async function acquitterAnomalies(jour: string): Promise<Resultat<null>> {
  return acquitterAnomaliesService(jour)
}

export async function chargerEtat(): Promise<EtatFacturation> {
  return chargerEtatService()
}

export async function creerRecu(
  saisie: SaisieNouveauRecu,
  confirme: boolean,
): Promise<Resultat<{ recuId: string; numero: number }>> {
  return creerRecuService(saisie, confirme)
}

export async function ajouterVersement(
  saisie: SaisieVersement,
  confirme: boolean,
): Promise<Resultat<{ recuId: string }>> {
  return ajouterVersementService(saisie, confirme)
}

export async function annulerRecu(
  recuId: string,
  saisie: SaisieAnnulation,
): Promise<Resultat<null>> {
  return annulerRecuService(recuId, saisie)
}

export async function modifierRecu(
  recuId: string,
  saisie: SaisieModification,
): Promise<Resultat<null>> {
  return modifierRecuService(recuId, saisie)
}

/** R-68 à R-72 — Suivi journalier d'un mois. */
export async function suiviJournalier(
  options: OptionsSuiviJournalier,
): Promise<SuiviJournalier> {
  return suiviJournalierService(options)
}

/** R-73 à R-77 — Registre des chèques et virements. */
export async function registreBancaire(
  filtres: Partial<FiltresRegistre>,
  cleSelectionnee: string | null,
): Promise<RegistreBancaire> {
  return registreBancaireService(filtres, cleSelectionnee)
}

/**
 * R-35, R-36, R-38, R-41 — Ajoute l'image d'une opération bancaire.
 *
 * Le fichier voyage en `FormData` : l'action ne reçoit que son contenu binaire
 * et le dépose dans le stockage de fichiers. Aucune image n'est stockée en base.
 */
export async function ajouterImageOperation(donnees: FormData): Promise<Resultat<null>> {
  const cle = String(donnees.get('cle') ?? '')
  const fichier = donnees.get('fichier')
  if (!(fichier instanceof File)) return ajouterImageOperationService(cle, null)
  return ajouterImageOperationService(cle, {
    contenu: await fichier.arrayBuffer(),
    nomOrigine: fichier.name || 'document-paiement',
    typeMime: fichier.type || 'application/octet-stream',
  })
}

/** R-39, R-40, R-41 — Supprime l'image d'une opération. Administrateur seulement. */
export async function supprimerImageOperation(cle: string): Promise<Resultat<null>> {
  return supprimerImageOperationService(cle)
}

/**
 * R-35, R-38 — Dépose l'image tenue en brouillon par un formulaire, une fois le
 * reçu ou le versement enregistré.
 */
export async function ajouterImageDernierVersement(donnees: FormData): Promise<Resultat<null>> {
  const recuId = String(donnees.get('recuId') ?? '')
  const fichier = donnees.get('fichier')
  if (!(fichier instanceof File)) return ajouterImageDernierVersementService(recuId, null)
  return ajouterImageDernierVersementService(recuId, {
    contenu: await fichier.arrayBuffer(),
    nomOrigine: fichier.name || 'document-paiement',
    typeMime: fichier.type || 'application/octet-stream',
  })
}
