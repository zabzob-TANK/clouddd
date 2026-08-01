'use client'

/**
 * Fenêtre « Nouveau reçu ».
 *
 * Reproduit la structure du formulaire de référence : bloc voyageur, bloc
 * programme et prix, groupe facultatif, puis premier versement obligatoire avec
 * sa méthode de paiement.
 *
 * Toute la validation vient du noyau métier (R-01 à R-14) : cet écran n'en
 * réimplémente aucune, il se contente d'afficher les erreurs renvoyées.
 */

import { useState } from 'react'

import { formaterMontant, formaterTelephone, nettoyerArabe } from '../../domain/format'
import { centimesEnTexteDevise, dirhamsSaisisEnCentimes } from '../../domain/money'
import type { ErreurValidation, Resultat } from '../../domain/rules/errors'
import type { SaisieNouveauRecu } from '../../domain/rules/create-receipt'
import { construireGrille, montantConvenu } from '../../domain/rules/tarif'
import type { OperationPartagee, Passeport, Recu, Saison, Tarif } from '../../domain/types'
import { CaseACocher, Champ, enErreur, ListeErreurs, Saisie, Selection } from '../champs'
import { Dialogue } from '../dialogue'
import { BlocInstrument, instrumentVierge } from '../instrument-panel'
import { ModaleDepassement } from './depassement'
import { ModalePasseport } from './passeport'

interface Referentiels {
  saison: Saison
  hotels: { id: string; nom: string }[]
  vols: { id: string; nom: string }[]
  chambres: { id: string; code: string }[]
  rabatteurs: { id: string; nom: string }[]
  tarifs: Tarif[]
}

interface Proprietes {
  referentiels: Referentiels
  operations: OperationPartagee[]
  recus: Recu[]
  onFermer: () => void
  onEnregistrer: (
    saisie: SaisieNouveauRecu,
    confirme: boolean,
  ) => Promise<Resultat<{ recuId: string; numero: number }>>
}

function saisieVierge(): SaisieNouveauRecu {
  return {
    prenom: '',
    nom: '',
    telephone: '',
    hotel: '',
    vol: '',
    chambre: '',
    rabatteur: '',
    reduction: '',
    groupeCoche: false,
    groupe: '',
    premierVersement: '',
    note: '',
    instrument: instrumentVierge(),
    passeport: null,
  }
}

export function ModaleNouveauRecu({
  referentiels,
  operations,
  recus,
  onFermer,
  onEnregistrer,
}: Proprietes) {
  const [saisie, setSaisie] = useState<SaisieNouveauRecu>(saisieVierge())
  const [erreurs, setErreurs] = useState<ErreurValidation[]>([])
  const [depassement, setDepassement] = useState<{ montant: number; disponible: number } | null>(
    null,
  )
  const [passeportOuvert, setPasseportOuvert] = useState(false)
  const [envoi, setEnvoi] = useState(false)

  const modifier = (patch: Partial<SaisieNouveauRecu>) => setSaisie({ ...saisie, ...patch })

  // Aperçu du prix — le calcul fait autorité côté serveur, celui-ci n’est
  // qu'un reflet immédiat pour l’utilisateur.
  const grille = construireGrille(referentiels.tarifs)
  const tarif = grille.tarifPour(saisie.hotel, saisie.vol, saisie.chambre)
  const reduction = dirhamsSaisisEnCentimes(saisie.reduction)
  const convenu = tarif === null ? null : montantConvenu(tarif, reduction)

  const soumettre = async (confirme: boolean) => {
    setEnvoi(true)
    const resultat = await onEnregistrer(saisie, confirme)
    setEnvoi(false)

    if (resultat.statut === 'erreurs') {
      setErreurs(resultat.erreurs)
      setDepassement(null)
      return
    }
    if (resultat.statut === 'confirmation-requise') {
      setErreurs([])
      setDepassement({
        montant: resultat.montantCentimes,
        disponible: resultat.disponibleCentimes,
      })
      return
    }
    onFermer()
  }

  if (passeportOuvert) {
    return (
      <ModalePasseport
        initial={saisie.passeport}
        onFermer={() => setPasseportOuvert(false)}
        onValider={(passeport: Passeport) => {
          modifier({
            passeport,
            // Le fichier de référence reporte le nom et le prénom lus dans le
            // formulaire du reçu.
            prenom: passeport.prenom || saisie.prenom,
            nom: passeport.nom || saisie.nom,
          })
          setPasseportOuvert(false)
        }}
      />
    )
  }

  if (depassement) {
    return (
      <ModaleDepassement
        montantCentimes={depassement.montant}
        disponibleCentimes={depassement.disponible}
        onRetour={() => setDepassement(null)}
        onConfirmer={() => soumettre(true)}
      />
    )
  }

  return (
    <Dialogue
      titre="Nouveau reçu"
      taille="large"
      onFermer={onFermer}
      pied={
        <>
          <button className="omra-btn" onClick={onFermer} disabled={envoi}>
            Annuler
          </button>
          <button className="omra-btn primary" onClick={() => soumettre(false)} disabled={envoi}>
            Enregistrer le reçu
          </button>
        </>
      }
    >
      <ListeErreurs erreurs={erreurs} />

      <div className="omra-panel" style={{ marginTop: 0 }}>
        <h3>Voyageur</h3>
        {saisie.passeport ? (
          <p className="omra-hint" style={{ marginBottom: 10 }}>
            ✓ Passeport rattaché{saisie.passeport.numero ? ` — ${saisie.passeport.numero}` : ''}
          </p>
        ) : null}
        <div className="omra-fields">
          <Champ label="Prénom *">
            <Saisie
              valeur={saisie.prenom}
              onChange={(v) => modifier({ prenom: nettoyerArabe(v) })}
              invalide={enErreur(erreurs, 'prenom')}
              arabe
            />
          </Champ>
          <Champ label="Nom *">
            <Saisie
              valeur={saisie.nom}
              onChange={(v) => modifier({ nom: nettoyerArabe(v) })}
              invalide={enErreur(erreurs, 'nom')}
              arabe
            />
          </Champ>
          <Champ label="Téléphone *" aide="10 chiffres">
            <Saisie
              valeur={saisie.telephone}
              onChange={(v) => modifier({ telephone: formaterTelephone(v) })}
              invalide={enErreur(erreurs, 'telephone')}
              mono
              inputMode="tel"
            />
          </Champ>
          <Champ label="Passeport">
            <button className="omra-btn" type="button" onClick={() => setPasseportOuvert(true)}>
              {saisie.passeport ? 'Modifier le passeport' : 'Scanner le passeport'}
            </button>
          </Champ>
        </div>
      </div>

      <div className="omra-panel">
        <h3>Programme et prix</h3>
        <div className="omra-fields">
          <Champ label="Hôtel *">
            <Selection
              valeur={saisie.hotel}
              onChange={(v) => modifier({ hotel: v })}
              options={referentiels.hotels.map((h) => ({ valeur: h.id, libelle: h.nom }))}
              invalide={enErreur(erreurs, 'hotel')}
            />
          </Champ>
          <Champ label="Vol *">
            <Selection
              valeur={saisie.vol}
              onChange={(v) => modifier({ vol: v })}
              options={referentiels.vols.map((v) => ({ valeur: v.id, libelle: v.nom }))}
              invalide={enErreur(erreurs, 'vol')}
            />
          </Champ>
          <Champ label="Chambre *">
            <Selection
              valeur={saisie.chambre}
              onChange={(v) => modifier({ chambre: v })}
              options={referentiels.chambres.map((c) => ({ valeur: c.id, libelle: c.code }))}
              invalide={enErreur(erreurs, 'chambre')}
            />
          </Champ>
          <Champ label="Intermédiaire *">
            <Selection
              valeur={saisie.rabatteur}
              onChange={(v) => modifier({ rabatteur: v })}
              options={referentiels.rabatteurs.map((r) => ({ valeur: r.id, libelle: r.nom }))}
              invalide={enErreur(erreurs, 'rabatteur')}
            />
          </Champ>
          <Champ
            label="Réduction (DH)"
            aide={`Maximum ${centimesEnTexteDevise(referentiels.saison.reductionMaxCentimes)}`}
          >
            <Saisie
              valeur={saisie.reduction}
              onChange={(v) => modifier({ reduction: formaterMontant(v) })}
              invalide={enErreur(erreurs, 'reduction')}
              mono
              inputMode="numeric"
            />
          </Champ>
        </div>

        {saisie.hotel && saisie.vol && saisie.chambre && tarif === null ? (
          <p className="omra-hint" style={{ marginTop: 10, color: 'var(--danger)' }}>
            Aucun prix n’est défini pour ce choix dans cette saison.
          </p>
        ) : null}

        {tarif !== null ? (
          <div className="omra-summary">
            <div>
              <span>Prix d’origine</span>
              <span className="mono">{centimesEnTexteDevise(tarif)}</span>
            </div>
            <div>
              <span>Réduction</span>
              <span className="mono">{centimesEnTexteDevise(reduction)}</span>
            </div>
            <div>
              <span>Montant convenu</span>
              <span className="mono">{centimesEnTexteDevise(convenu ?? 0)}</span>
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <CaseACocher
            coche={saisie.groupeCoche}
            onChange={(coche) => modifier({ groupeCoche: coche })}
            label="Appartient à un groupe ou une famille"
          />
        </div>
        {saisie.groupeCoche ? (
          <div className="omra-fields" style={{ marginTop: 10 }}>
            <Champ label="Code du groupe *">
              <Saisie
                valeur={saisie.groupe}
                onChange={(v) => modifier({ groupe: v })}
                invalide={enErreur(erreurs, 'groupe')}
              />
            </Champ>
          </div>
        ) : null}

        <div className="omra-fields" style={{ marginTop: 12 }}>
          <Champ label="Note" pleine>
            <Saisie valeur={saisie.note} onChange={(v) => modifier({ note: v })} />
          </Champ>
        </div>
      </div>

      <div className="omra-panel">
        <h3>Premier versement — obligatoire</h3>
        <div className="omra-fields">
          <Champ label="Montant versé (DH) *">
            <Saisie
              valeur={saisie.premierVersement}
              onChange={(v) => modifier({ premierVersement: formaterMontant(v) })}
              invalide={enErreur(erreurs, 'premierVersement')}
              mono
              inputMode="numeric"
            />
          </Champ>
        </div>
      </div>

      <BlocInstrument
        saisie={saisie.instrument}
        onChange={(instrument) => modifier({ instrument })}
        erreurs={erreurs}
        operations={operations}
        recus={recus}
        montantSaisi={saisie.premierVersement}
      />
    </Dialogue>
  )
}
