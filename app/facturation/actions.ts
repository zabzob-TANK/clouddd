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
} from '@/modules/facturation/data/service'
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
