/**
 * Module de facturation Zemzem Asfar.
 *
 * Point d'entrée public. Le reste de l'application n'importe que depuis ici ou
 * depuis les sous-chemins explicites `modules/facturation/ui/…`.
 *
 * Organisation :
 *  - `domain/` — types, constantes et règles. Aucune dépendance à React,
 *    à Next.js ni à une base de données.
 *  - `data/`   — ports et adaptateurs. Seul point de couture avec Omra.
 *  - `ui/`     — composants d'interface.
 *
 * Le module est autonome : il peut être copié tel quel dans un autre projet
 * Next.js. Voir `docs/facturation/transfert-omra.md`.
 */

export * from './domain/constants'
export * from './domain/dates'
export * from './domain/format'
export * from './domain/money'
export * from './domain/payment-method'
export * from './domain/bidi'
export * from './domain/rules'
export type * from './domain/types'
export type { SourceDonnees } from './data/ports'
export { sourceDonnees, modeDemonstration, sourceConfiguree } from './data'
