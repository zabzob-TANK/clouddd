/**
 * Erreurs de validation.
 *
 * Le fichier de référence pousse des messages en arabe directement dans l'état.
 * Ici les règles renvoient des **codes**, et la traduction est séparée : le
 * domaine reste pur et l'interface peut être en français sans que la logique
 * change.
 *
 * L'ordre dans lequel les erreurs sont produites est significatif et reproduit
 * exactement celui du fichier de référence.
 */

import { centimesEnTexteDevise } from '../money'

export type CodeErreur =
  // Identité et contact
  | 'prenom-obligatoire'
  | 'nom-obligatoire'
  | 'telephone-obligatoire'
  | 'telephone-dix-chiffres'
  // Programme
  | 'hotel-obligatoire'
  | 'vol-obligatoire'
  | 'chambre-obligatoire'
  | 'rabatteur-obligatoire'
  | 'tarif-introuvable'
  | 'reduction-superieure-au-plafond'
  | 'reduction-superieure-ou-egale-au-tarif'
  | 'convenu-inferieur-au-paye'
  // Groupe
  | 'groupe-obligatoire'
  // Versements
  | 'premier-versement-obligatoire'
  | 'montant-obligatoire'
  | 'montant-doit-etre-positif'
  | 'montant-superieur-au-convenu'
  | 'montant-superieur-au-restant'
  | 'sixieme-versement-doit-solder'
  | 'numero-recu-obligatoire'
  | 'numero-recu-introuvable'
  | 'recu-annule'
  | 'recu-deja-solde'
  | 'nombre-maximal-de-versements-atteint'
  | 'premier-versement-absent'
  // Instrument bancaire
  | 'reference-instrument-obligatoire'
  | 'date-instrument-obligatoire'
  | 'date-instrument-invalide'
  | 'banque-obligatoire'
  | 'payeur-obligatoire'
  | 'montant-operation-obligatoire'
  | 'montant-operation-doit-etre-positif'
  | 'operation-partagee-obligatoire'
  | 'operation-partagee-introuvable'
  // Annulation
  | 'motif-annulation-obligatoire'
  | 'mode-remboursement-obligatoire'
  | 'mot-de-passe-obligatoire'
  | 'mot-de-passe-incorrect'
  // Modification
  | 'motif-modification-obligatoire'
  | 'section-obligatoire'
  | 'operation-partagee-non-modifiable-ici'

export interface ErreurValidation {
  /** Champ concerné, tel qu'identifié dans le formulaire. */
  champ: string
  code: CodeErreur
  /** Valeurs à insérer dans le message. */
  parametres?: Record<string, string | number>
}

/**
 * Résultat d'une règle de validation.
 *
 * `confirmation-requise` reproduit `requestSharedOverflow()` : l'enregistrement
 * reste possible mais exige une confirmation explicite (R-32).
 */
export type Resultat<T> =
  | { statut: 'ok'; valeur: T }
  | { statut: 'erreurs'; erreurs: ErreurValidation[] }
  | {
      statut: 'confirmation-requise'
      motif: 'depassement-operation-partagee'
      montantCentimes: number
      disponibleCentimes: number
    }

export function erreurs(liste: ErreurValidation[]): Resultat<never> {
  return { statut: 'erreurs', erreurs: liste }
}

export function erreur(
  champ: string,
  code: CodeErreur,
  parametres?: Record<string, string | number>,
): Resultat<never> {
  return { statut: 'erreurs', erreurs: [{ champ, code, parametres }] }
}

export function ok<T>(valeur: T): Resultat<T> {
  return { statut: 'ok', valeur }
}

/**
 * Messages français.
 *
 * Traduction des messages arabes du fichier de référence. Le sens et le
 * déclenchement sont identiques ; seule la langue change, conformément à
 * l'exception validée (observation O-09).
 */
export const MESSAGES_FR: Record<CodeErreur, (p?: Record<string, string | number>) => string> = {
  'prenom-obligatoire': () => 'Le prénom est obligatoire.',
  'nom-obligatoire': () => 'Le nom est obligatoire.',
  'telephone-obligatoire': () => 'Le numéro de téléphone est obligatoire.',
  'telephone-dix-chiffres': () => 'Le numéro de téléphone doit comporter 10 chiffres.',

  'hotel-obligatoire': () => "Choisissez l'hôtel.",
  'vol-obligatoire': () => 'Choisissez le vol.',
  'chambre-obligatoire': () => 'Choisissez la chambre.',
  'rabatteur-obligatoire': () => "Choisissez l'intermédiaire.",
  'tarif-introuvable': () =>
    "Aucun prix n'est défini pour ce choix. Changez l'hôtel, le vol ou la chambre.",
  'reduction-superieure-au-plafond': (p) =>
    `La réduction maximale pour cette saison est de ${p?.plafond ?? ''}.`,
  'reduction-superieure-ou-egale-au-tarif': () =>
    'La réduction ne peut pas égaler ni dépasser le prix.',
  'convenu-inferieur-au-paye': (p) =>
    `Le nouveau montant convenu est inférieur au montant déjà payé (${p?.paye ?? ''}).`,

  'groupe-obligatoire': () => 'Le code de groupe est obligatoire.',

  'premier-versement-obligatoire': () => 'Le premier versement est obligatoire.',
  'montant-obligatoire': () => 'Le montant est obligatoire.',
  'montant-doit-etre-positif': () => 'Le montant doit être supérieur à 0 DH.',
  'montant-superieur-au-convenu': (p) =>
    `Le montant versé dépasse le montant convenu (${p?.convenu ?? ''}). Le surpaiement est interdit.`,
  'montant-superieur-au-restant': (p) =>
    `Le montant dépasse le restant dû (${p?.restant ?? ''}). Le surpaiement est interdit.`,
  'sixieme-versement-doit-solder': (p) =>
    `Le sixième versement doit être exactement égal au restant dû (${p?.restant ?? ''}). ` +
    "Aucun montant inférieur ou supérieur n'est accepté.",
  'numero-recu-obligatoire': () => 'Saisissez le numéro du reçu.',
  'numero-recu-introuvable': () => "Ce numéro n'existe pas.",
  'recu-annule': () => 'Ce reçu est annulé.',
  'recu-deja-solde': () => 'Ce reçu est intégralement soldé.',
  'nombre-maximal-de-versements-atteint': (p) =>
    `Ce reçu a atteint le maximum de ${p?.maximum ?? ''} versements.`,
  'premier-versement-absent': () => "Aucun premier versement n'est rattaché à ce reçu.",

  'reference-instrument-obligatoire': () =>
    'Le numéro de chèque ou la référence de virement est obligatoire.',
  'date-instrument-obligatoire': () => "La date de l'opération est obligatoire.",
  'date-instrument-invalide': () => "Date invalide. Format attendu : 02/07/2025.",
  'banque-obligatoire': () => 'La banque est obligatoire.',
  'payeur-obligatoire': () => "Le nom de la personne ayant payé est obligatoire.",
  'montant-operation-obligatoire': () => "Le montant total de l'opération est obligatoire.",
  'montant-operation-doit-etre-positif': () =>
    "Le montant total de l'opération doit être supérieur à 0 DH.",
  'operation-partagee-obligatoire': () => 'Choisissez une opération partagée existante.',
  'operation-partagee-introuvable': () => "L'opération partagée choisie n'existe pas.",

  'motif-annulation-obligatoire': () => "Le motif d'annulation est obligatoire.",
  'mode-remboursement-obligatoire': () => 'Choisissez le mode de remboursement.',
  'mot-de-passe-obligatoire': () => 'Le mot de passe est obligatoire.',
  'mot-de-passe-incorrect': () => 'Mot de passe incorrect.',

  'motif-modification-obligatoire': () => 'Le motif de modification est obligatoire.',
  'section-obligatoire': () => 'Choisissez une section à modifier.',
  'operation-partagee-non-modifiable-ici': () =>
    "Les données d'une opération partagée se modifient depuis le registre des paiements, " +
    'et non depuis le reçu.',
}

/** Rend une erreur en français. */
export function messageFr(erreurValidation: ErreurValidation): string {
  return MESSAGES_FR[erreurValidation.code](erreurValidation.parametres)
}

/** Raccourci pour formater un montant destiné à un message. */
export function montantPourMessage(centimes: number): string {
  return centimesEnTexteDevise(centimes)
}
