# Reprise — module Facturation Zemzem Asfar

Document de continuité pour la reconstruction du module de facturation.
Toute session de travail (VS Code, CLI, web) doit lire ce fichier avant
de modifier le code du module `modules/facturation/`.

## 1. État du dépôt

Branche : `claude/facturation-reconstruction`
Tests : 412 (Vitest, `npx vitest run`)
Build : `npm run build` + `npm start` → HTTP 200 sur `/facturation`
Lots L0–L6 livrés (voir `docs/facturation/inventaire.md`)

## 2. Architecture

```
modules/facturation/
  domain/          Règles pures, aucun effet de bord
    constants.ts   Valeurs de référence (C-01 à C-09)
    types.ts       Types partagés (Recu, Versement, etc.)
    rules/         Fonctions de validation et de calcul
  data/
    ports.ts       Contrat (interfaces des ports)
    service.ts     Orchestration (relie ports et domaine)
    demo/          Adaptateur de démonstration (mémoire)
  ui/
    ecrans/        Composants-écrans (registre, finance, suivi, etc.)
    modales/       Fenêtres modales (nouveau-recu, versement, etc.)
    styles.css     Tokens et styles de base
    theme-sombre.css
```

Ports et adaptateurs : le domaine ne connaît pas Supabase. Chaque source
de données implémente les interfaces de `ports.ts`. Aujourd'hui seul
l'adaptateur `demo/` existe ; le futur `supabase/` le remplacera.

## 3. Décisions métier confirmées

### Rôles
- Binaire : `slot_number = 1` = administrateur, 2–6 = employé.
- Pas de matrice de permissions, pas de droits par compte.
- Tous les comptes actifs peuvent : se connecter, voir les voyageurs,
  créer des inscriptions, enregistrer des versements.
- Réservé à l'administrateur : suppression d'image, levée d'anomalie,
  impression hors fenêtre autorisée, correction du montant du 1er versement.

### Session
- Une seule session active par compte. Un nouveau login sur un autre
  appareil invalide la session précédente **de ce compte uniquement**.
  Les autres comptes ne sont pas affectés.

### Annulation
- Définitive, jamais réversible.
- Total remboursé = total payé (pas le convenu).
- Mode de remboursement : espèces (mouvement de caisse) ou aucun.

### Modification du premier versement
- L'employé peut changer : nature, banque, référence, date instrument,
  payeur, passage unique ↔ partagé.
- Seul l'administrateur peut modifier le montant.

### Trop-perçu
- Autorisé, visible comme anomalie, pas de remboursement automatique.
- Un reçu avec trop-perçu est considéré « soldé » (restant ≤ 0).

### Saison
- Chaque inscription, tarif, étiquette de groupe et reçu appartient
  obligatoirement à une saison (`saison_id NOT NULL`).
- Un groupe est une simple étiquette saisonnière, sans structure familiale.

### Homonymes
- Deux voyageurs portant le même nom restent deux dossiers distincts
  (clientId et téléphone différents).

### Impressions
- Chaque clic incrémente un compteur (`impressions += 1`) **avant**
  `window.print()`.
- Le compteur est consigné sur le reçu, pas dans un journal séparé.

## 4. Corrections pendantes (lot 1 — domaine pur)

Toutes ces corrections se font dans `domain/rules/` et `data/service.ts`,
sans toucher à Supabase. Écrire le test qui échoue **avant** la correction.

| ID  | Fichier                        | Problème |
|-----|--------------------------------|----------|
| P05 | `rules/cancellation.ts`        | `preparerAnnulation` ne vérifie pas `recu.statut === 'ملغى'` → double annulation possible |
| P06 | `rules/edit-sections.ts`       | `preparerModification` ne vérifie pas le statut annulé → modification d'un reçu annulé possible |
| P13 | `rules/edit-sections.ts`       | La modification commerciale ne peut pas descendre sous le total payé, mais le trop-perçu doit rester autorisé → ajuster la garde `convenu < paye` |
| P01 | `rules/edit-sections.ts`       | La branche `firstPayment` consigne les changements mais ne peuple jamais `champsModifies` → la correction ne s'applique pas |
| P18 | `ui/modales/*.tsx` + `service` | `imprimer()` doit être `async` avec `await` avant `window.print()` |
| P08 | `data/service.ts`              | Le numéro de reçu est réservé avant validation — doit l'être après, dans la transaction |
| —   | `rules/receipt.ts`             | `statutAffiche` : `restantDu(recu) === 0` → `<= 0` pour le trop-perçu |
| —   | `rules/payment.ts`             | `motifRefusVersement` : `restantDu(recu) === 0` → `<= 0` pour le trop-perçu |

## 5. Sécurité

- `SUPABASE_SERVICE_ROLE_KEY` : jamais dans le navigateur, jamais dans git,
  jamais préfixé `NEXT_PUBLIC_`.
- `.env.example` : ne jamais renseigner les identifiants du projet
  Supabase officiel d'Omra.
- En-tête de migration : ne jamais appliquer à la base du projet officiel.
- `FACTURATION_SOURCE=demo` doit être impossible en production
  (`NODE_ENV=production` → refuser le démarrage).

## 6. Plan de lots (Supabase)

| Lot | Contenu | Pré-requis |
|-----|---------|------------|
| 1   | Corrections domaine pur (ci-dessus) | aucun |
| 2   | Schéma Supabase (`db/facturation/migrations/`) | dépôt Omra officiel |
| 3   | RLS + RPCs `SECURITY DEFINER` | lot 2 |
| 4   | Adaptateur `supabase/` (ports.ts → Supabase) | lot 3, credentials test |
| 5   | Auth Supabase (session unique par compte) | lot 4 |
| 6   | Storage (images chèques/virements) | lot 4 |
| 7   | Garde production + déploiement | lots 1–6 |

## 7. Fichiers de référence

- `docs/facturation/inventaire.md` — registre des règles (R-xx) et couverture
- `docs/facturation/transfert-omra.md` — plan de transfert vers le dépôt officiel
- `db/facturation/migrations/0001_facturation.sql` — schéma existant (RLS sans policies)
- `modules/facturation/data/demo/dataset.ts` — 18 reçus sur 6 jours
