# Transfert du module vers Omra

Ce dépôt est un **test parallèle**. Le module est construit pour être récupéré
tel quel dans le projet officiel Omra, sans réécriture du métier ni de l'interface.

## Ce qui se déplace

| Chemin | Contenu | Dépendances externes |
| --- | --- | --- |
| `modules/facturation/domain/` | Types, constantes, règles | aucune |
| `modules/facturation/data/` | Ports et adaptateurs | aucune au lot L0 |
| `modules/facturation/ui/` | Composants d'interface | React |
| `db/facturation/migrations/` | Migrations SQL | — |
| `docs/facturation/` | Registre des règles, transfert | — |
| `scripts/couverture.mjs` | Contrôle de couverture | Node |

Le module est autonome : aucun fichier n'importe quoi que ce soit hors de
`modules/facturation/`, hormis `react`. Un déplacement se fait par copie de
dossier, sans renommage d'import.

## Ce qui reste à brancher

Le seul point de couture est `SourceDonnees` — l'agrégat des ports défini dans
`modules/facturation/data/ports.ts`. Le raccordement consiste à écrire une
implémentation et à la déclarer dans `modules/facturation/data/index.ts`.

### 1. Référentiels — à lire dans Omra, jamais à recréer

`ReferentielsPort` attend une **forme**, pas un schéma. Le module ne fait aucune
hypothèse sur les noms de tables ou de colonnes du projet officiel.

| Méthode | Attendu | Règle concernée |
| --- | --- | --- |
| `saisonActive()` | saison courante et son plafond de réduction | R-06 |
| `hotels()`, `vols()`, `chambres()`, `rabatteurs()` | listes de choix | R-03 |
| `tarifs(saisonId)` | uniquement les combinaisons **réellement définies** | R-05 |

> ⚠️ `tarifs()` ne doit jamais compléter les combinaisons manquantes par un
> tarif nul. Une combinaison absente doit bloquer la création du reçu.

### 2. Session et autorisations

`SessionPort` se branche sur l'authentification Omra existante. Aucun compte ni
mot de passe n'est défini dans ce module.

`verifierIdentite()` correspond à la re-saisie du mot de passe exigée lors d'une
annulation (R-43, R-44). Le fichier de référence compare en clair le mot de passe
de l'utilisateur connecté (observation O-03) ; l'implémentation Omra devra
déléguer à une ré-authentification côté serveur.

`estAdministrateur()` porte trois règles : suppression d'une image (R-39),
impression du journal hors des deux derniers jours (R-61), levée d'anomalie (R-65).

### 3. Persistance

Les migrations de `db/facturation/migrations/` créent **uniquement** les entités
propres à la facturation. Les références aux référentiels Omra sont des colonnes
texte sans contrainte de clé étrangère, en attendant le schéma officiel.

Au raccordement :

1. ajouter une migration qui remplace `saison_ref`, `hotel_ref`, `vol_ref`,
   `chambre_ref` et `rabatteur_ref` par de vraies clés étrangères ;
2. écrire les politiques de sécurité au niveau des lignes — la sécurité est
   activée sans aucune politique permissive, donc fermée par défaut ;
3. brancher `SessionPort` sur les comptes et rôles existants.

### 4. Stockage des images

`StockageFichiersPort` cible Supabase Storage. Le domaine ne manipule jamais de
contenu binaire ni de `data:` URL : uniquement des `ReferenceFichier`.
L'adaptateur de démonstration conserve les octets en mémoire, mais l'interface est
déjà celle d'un stockage de fichiers.

### 5. Lecture automatique de passeport

`LecteurPasseportPort` est annoncé indisponible (R-90). Le fichier de référence ne
contient aucune lecture automatique : le remplissage y est explicitement marqué
comme une simulation. L'interface de saisie et de correction est complète et
fonctionnelle ; brancher un service réel consiste à fournir une implémentation.

## Dépendances

| Paquet | Rôle | Déjà dans Omra |
| --- | --- | --- |
| `vitest` | tests | non — à ajouter |
| `@supabase/supabase-js` | adaptateur Supabase | oui |

Aucune autre dépendance n'a été introduite au lot L0.

## Vérifications avant transfert

```bash
npx vitest run          # tests du module
node scripts/couverture.mjs   # couverture du registre des règles
npx tsc --noEmit        # typage
```

## Ce qui ne doit pas être transféré

- `modules/facturation/data/demo/` — jeu de démonstration, isolé et supprimable ;
- l'ancien portage `components/facturation/`, conservé sur la branche
  `claude/omra-architecture-proposal-krhotz` comme référence visuelle.
