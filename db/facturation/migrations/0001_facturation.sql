-- =============================================================================
-- Module de facturation Zemzem Asfar — schéma initial
-- =============================================================================
--
-- ⚠️ NE JAMAIS APPLIQUER CETTE MIGRATION À LA BASE DU PROJET OFFICIEL OMRA.
--    Elle est destinée à un projet Supabase **de test**, dédié à cette
--    reconstruction. Aucune migration n'est appliquée automatiquement.
--
-- Périmètre :
--   Ce fichier ne crée QUE les entités propres à la facturation. Les
--   référentiels — saisons, hôtels, vols, chambres, rabatteurs, tarifs, comptes,
--   rôles — existent déjà dans Omra et ne sont PAS recréés ici. Ils sont
--   référencés par des colonnes de type texte, volontairement sans contrainte de
--   clé étrangère, tant que le schéma officiel n'est pas connu. Le raccordement
--   se fera en ajoutant les contraintes dans une migration ultérieure, sans
--   modifier le métier ni l'interface.
--
-- Conventions :
--   - tous les montants sont des ENTIERS EN CENTIMES (bigint) ;
--   - les dates saisies et affichées sont conservées en texte `jj/mm/aaaa`,
--     comme dans le fichier de référence, afin de ne rien réinterpréter ;
--   - les clés de journée sont en texte `aaaa-mm-jj` ;
--   - les valeurs arabes sont stockées telles quelles en `text`.
-- =============================================================================

create schema if not exists facturation;

-- -----------------------------------------------------------------------------
-- Séquence des numéros de reçu (R-11)
-- Un numéro annulé n'est jamais réutilisé (R-45).
-- -----------------------------------------------------------------------------
create sequence if not exists facturation.numero_recu_seq as bigint start with 1;

-- -----------------------------------------------------------------------------
-- Clients
-- -----------------------------------------------------------------------------
create table if not exists facturation.clients (
  id             text primary key,
  nom            text not null,               -- valeur arabe
  prenom         text not null,               -- valeur arabe
  photo_chemin   text,                        -- référence Supabase Storage
  cree_le        text not null,               -- horodatage `jj/mm/aaaa HH:MM`
  cree_par       text not null,
  created_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Passeports (R-90)
-- La lecture automatique n'existe pas dans le fichier de référence : la saisie
-- est manuelle, `resultat_brut` en conserve l'origine.
-- -----------------------------------------------------------------------------
create table if not exists facturation.passeports (
  id                  text primary key,
  client_id           text references facturation.clients (id) on delete cascade,
  prenom              text,                   -- valeur arabe
  nom                 text,                   -- valeur arabe
  numero              text,
  nationalite         text,
  date_naissance      text,
  lieu_naissance      text,
  date_emission       text,
  date_expiration     text,
  pays_emission       text,
  sexe                text,
  mrz                 text,
  image_originale     text,                   -- chemin Supabase Storage
  image_portrait      text,                   -- chemin Supabase Storage
  scan_id             text,
  resultat_brut       jsonb,
  created_at          timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Opérations de paiement partagées (R-29 à R-34)
-- Une opération reste UNE SEULE opération financière, quel que soit le nombre de
-- reçus qu'elle règle. L'image lui appartient (R-35, R-38).
-- -----------------------------------------------------------------------------
create table if not exists facturation.operations_partagees (
  id                     text primary key,
  nature                 text not null,       -- 'شيك' ou 'تحويل بنكي'
  reference              text not null default '',
  date_instrument        text not null default '',
  banque                 text not null default '',
  payeur                 text not null default '',
  montant_total_centimes bigint not null check (montant_total_centimes >= 0),
  creee_le               text not null,
  creee_par              text not null,
  statut                 text not null default 'active'
                           check (statut in ('active', 'archived')),
  -- R-35 : au plus une image active. La contrainte d'unicité est structurelle :
  -- une seule colonne, donc une seule image.
  image_chemin           text,
  image_nom_origine      text,
  image_origine          text,
  image_depose_le        text,
  created_at             timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Reçus
-- Références aux référentiels Omra : colonnes texte, sans clé étrangère tant que
-- le schéma officiel n'est pas connu.
-- -----------------------------------------------------------------------------
create table if not exists facturation.recus (
  id                            text primary key,
  numero                        bigint not null unique,
  client_id                     text not null references facturation.clients (id),
  passeport_id                  text references facturation.passeports (id),

  prenom                        text not null,   -- valeur arabe
  nom                           text not null,   -- valeur arabe
  telephone                     text not null,   -- `0XXX-XX.XX.XX`

  -- Référentiels Omra
  saison_ref                    text not null,
  hotel_ref                     text not null,
  vol_ref                       text not null,
  chambre_ref                   text not null,
  rabatteur_ref                 text not null,   -- non modifiable (R-54)

  tarif_centimes                bigint not null check (tarif_centimes >= 0),
  reduction_centimes            bigint not null default 0 check (reduction_centimes >= 0),
  -- R-08 : convenu = tarif − réduction. R-07 : réduction strictement inférieure au tarif.
  convenu_centimes              bigint not null check (convenu_centimes > 0),

  groupe                        text not null default '',
  note                          text not null default '',

  date_fr                       text not null,   -- `jj/mm/aaaa`
  cree_le                       text not null,   -- horodatage complet
  employe                       text not null,

  -- R-45 : jamais de suppression, seulement un changement de statut.
  statut                        text not null default 'نشط'
                                  check (statut in ('نشط', 'ملغى')),
  motif_annulation              text not null default '',
  annule_par                    text,
  annule_le                     text,
  mode_remboursement            text check (mode_remboursement in ('cash', 'none')),
  montant_rembourse_centimes    bigint check (montant_rembourse_centimes >= 0),

  impressions                   integer not null default 0 check (impressions >= 0),
  derniere_modification         text,
  modifie_par                   text,

  created_at                    timestamptz not null default now(),

  constraint reduction_inferieure_au_tarif check (reduction_centimes < tarif_centimes),
  constraint convenu_coherent check (convenu_centimes = tarif_centimes - reduction_centimes)
);

create index if not exists recus_numero_idx  on facturation.recus (numero);
create index if not exists recus_date_idx    on facturation.recus (date_fr);
create index if not exists recus_statut_idx  on facturation.recus (statut);
create index if not exists recus_client_idx  on facturation.recus (client_id);

-- -----------------------------------------------------------------------------
-- Versements (R-15 à R-22)
-- `instantane` est le mécanisme central : figé à l'enregistrement, jamais réécrit.
-- -----------------------------------------------------------------------------
create table if not exists facturation.versements (
  id                            text primary key,
  recu_id                       text not null references facturation.recus (id),
  rang                          integer not null check (rang between 1 and 6),
  montant_centimes              bigint not null check (montant_centimes > 0),
  nature                        text not null,

  date_fr                       text not null,
  heure                         text not null,
  date_heure                    text not null,
  enregistre_par                text not null,

  reference_instrument          text not null default '',
  date_instrument               text not null default '',
  banque                        text not null default '',

  portee                        text not null default 'unique'
                                  check (portee in ('unique', 'shared')),
  operation_partagee_id         text references facturation.operations_partagees (id),
  payeur                        text not null default '',
  montant_operation_centimes    bigint not null default 0,

  -- R-38 : pour un versement partagé, l'image appartient à l'opération.
  image_chemin                  text,
  image_nom_origine             text,
  image_origine                 text,
  image_depose_le               text,

  instantane                    jsonb not null,
  created_at                    timestamptz not null default now(),

  -- R-18 : au plus six versements par reçu, garanti par l'unicité du rang.
  constraint rang_unique_par_recu unique (recu_id, rang),
  -- R-38 : un versement partagé ne porte jamais d'image.
  constraint image_absente_si_partage
    check (portee = 'unique' or image_chemin is null),
  -- Un versement partagé référence toujours son opération.
  constraint operation_requise_si_partage
    check (portee = 'unique' or operation_partagee_id is not null)
);

create index if not exists versements_recu_idx      on facturation.versements (recu_id);
create index if not exists versements_date_idx      on facturation.versements (date_fr);
create index if not exists versements_operation_idx on facturation.versements (operation_partagee_id);

-- -----------------------------------------------------------------------------
-- Modifications (R-49 à R-55)
-- Une section à la fois, motif obligatoire, historique empilé.
-- -----------------------------------------------------------------------------
create table if not exists facturation.modifications (
  id              text primary key,
  recu_id         text not null references facturation.recus (id),
  section         text not null
                    check (section in ('identity', 'contact', 'program',
                                       'group', 'note', 'firstPayment')),
  section_libelle text not null,
  changements     jsonb not null,        -- [{champ, ancienne, nouvelle}]
  motif           text not null check (length(trim(motif)) > 0),
  employe         text not null,
  date_heure      text not null,
  created_at      timestamptz not null default now()
);

create index if not exists modifications_recu_idx on facturation.modifications (recu_id);

-- -----------------------------------------------------------------------------
-- Mouvements de caisse espèces (R-47, R-48)
-- Uniquement les remboursements réellement sortis en espèces.
-- -----------------------------------------------------------------------------
create table if not exists facturation.mouvements_caisse (
  id               text primary key,
  type             text not null default 'refund_cash' check (type in ('refund_cash')),
  jour             text not null,        -- `aaaa-mm-jj`
  date_fr          text not null,
  heure            text not null,
  montant_centimes bigint not null check (montant_centimes >= 0),
  recu_numero      bigint not null,
  client           text not null,        -- valeur arabe
  employe          text not null,
  created_at       timestamptz not null default now()
);

create index if not exists mouvements_caisse_jour_idx on facturation.mouvements_caisse (jour);

-- -----------------------------------------------------------------------------
-- Impressions du journal financier (R-62, R-63)
-- `mouvement_ids` est la photographie de ce qui figurait sur le papier.
-- -----------------------------------------------------------------------------
create table if not exists facturation.impressions_finance (
  id                 text primary key,
  jour               text not null,       -- `aaaa-mm-jj`
  imprime_le         text not null,
  employe            text not null,
  numero_impression  integer not null check (numero_impression >= 1),
  mouvement_ids      text[] not null,
  nombre_lignes      integer not null check (nombre_lignes >= 0),
  created_at         timestamptz not null default now(),

  constraint numero_unique_par_jour unique (jour, numero_impression)
);

create index if not exists impressions_finance_jour_idx on facturation.impressions_finance (jour);

-- -----------------------------------------------------------------------------
-- Acquittements d'anomalie (R-65)
-- Réservés à l'administrateur ; l'identité et l'horodatage sont conservés.
-- -----------------------------------------------------------------------------
create table if not exists facturation.acquittements_anomalie (
  jour           text primary key,       -- `aaaa-mm-jj`
  mouvement_ids  text[] not null,
  acquitte_le    text not null,
  acquitte_par   text not null,
  updated_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Journal d'audit (R-86)
-- -----------------------------------------------------------------------------
create table if not exists facturation.journal_audit (
  id          text primary key,
  horodatage  text not null,
  action      text not null,
  detail      text not null,
  utilisateur text not null,
  created_at  timestamptz not null default now()
);

create index if not exists journal_audit_created_idx
  on facturation.journal_audit (created_at desc);

-- =============================================================================
-- Sécurité
-- =============================================================================
-- La sécurité au niveau des lignes est activée sans aucune politique permissive :
-- tant qu'aucune politique n'est définie, seul le rôle de service peut lire ou
-- écrire. Les politiques réelles seront écrites lors du raccordement à
-- l'authentification et aux rôles d'Omra, dans une migration dédiée.
-- =============================================================================

alter table facturation.clients                 enable row level security;
alter table facturation.passeports              enable row level security;
alter table facturation.operations_partagees    enable row level security;
alter table facturation.recus                   enable row level security;
alter table facturation.versements              enable row level security;
alter table facturation.modifications           enable row level security;
alter table facturation.mouvements_caisse       enable row level security;
alter table facturation.impressions_finance     enable row level security;
alter table facturation.acquittements_anomalie  enable row level security;
alter table facturation.journal_audit           enable row level security;
