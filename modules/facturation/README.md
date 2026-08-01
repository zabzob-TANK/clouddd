# Module de facturation — Zemzem Asfar

Reconstruction du prototype `Zemzem Asfar.dc.html` en application Next.js
maintenable, destinée à être intégrée dans Omra.

## Organisation

```
modules/facturation/
├── domain/     Types, constantes et règles. Pur : ni React, ni Next.js, ni base.
├── data/       Ports et adaptateurs. Seul point de couture avec l'extérieur.
│   └── demo/   Jeu de démonstration — isolé, supprimable, jamais importé ailleurs.
├── ui/         Composants d'interface.
└── index.ts    Point d'entrée public.
```

Deux règles ESLint garantissent cette séparation : le module n'importe rien hors
de lui-même, et `domain/` ne dépend ni de React, ni de Next.js, ni de la persistance.

## Principes

**L'argent est toujours un entier en centimes.** Aucun flottant ne circule dans
le domaine. `domain/money.ts` reproduit à l'identique le formatage du fichier de
référence, y compris la normalisation de l'espace fine insécable.

**Les valeurs arabes et les valeurs techniques sont isolées.** L'interface est en
français et se lit de gauche à droite. Les noms, hôtels et motifs sont rendus de
droite à gauche ; les montants, dates, téléphones et références restent de gauche
à droite, même à l'intérieur d'un texte arabe. Toute valeur du domaine passe par
une primitive de `ui/bidi.tsx` — jamais en texte brut.

**Les règles du fichier de référence sont reproduites sans correction.** Les
comportements qui paraissent incohérents sont documentés comme observations dans
`docs/facturation/inventaire.md` et conservés tels quels.

**La source de données est interchangeable.** Le métier et l'interface ne
connaissent que `SourceDonnees`. Basculer de la démonstration à Supabase se fait
dans `data/index.ts`, sans toucher au reste.

## Registre des règles

Chaque règle du fichier de référence porte un identifiant stable — `C-01` pour
une constante, `U-01` pour un utilitaire, `R-01` pour une règle métier — cité
dans le code et dans le nom des tests.

```bash
npm run test         # tests du module
npm run couverture   # vérifie que chaque règle livrée est codée et testée
npm run verifier     # les deux, plus le typage
```

`npm run couverture` échoue si un identifiant appartenant à un lot déjà livré
n'apparaît pas à la fois dans le code et dans les tests.

## Mode démonstration

Par défaut, `FACTURATION_SOURCE=demo` : les données vivent en mémoire, aucun
secret n'est nécessaire. Le jeu de démonstration couvre les cas qui portent une
règle — espèces, chèque unique, virement partagé entre deux reçus, annulation
avec et sans sortie de caisse, reçu soldé.

Ce n'est pas l'architecture cible : voir `docs/facturation/transfert-omra.md`.
