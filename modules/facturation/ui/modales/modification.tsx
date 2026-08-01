'use client'

/**
 * Fenêtre « Modifier le reçu ».
 *
 * R-49 — Une seule section à la fois. On choisit d'abord la section, puis on
 * saisit ; pour en modifier une autre, il faut rouvrir la fenêtre.
 * R-50 — Le motif est toujours obligatoire.
 * R-54, R-55 — L'intermédiaire, les montants et les versements suivants ne sont
 * jamais modifiables ; l’écran le rappelle explicitement.
 */

import { useState } from 'react'

import { NATURE_CHEQUE, NATURE_ESPECES, NATURE_VIREMENT } from '../../domain/constants'
import { formaterDate, formaterMontant, formaterTelephone, nettoyerArabe } from '../../domain/format'
import { centimesEnDirhamsSaisis } from '../../domain/money'
import type { ErreurValidation, Resultat } from '../../domain/rules/errors'
import {
  LIBELLES_SECTIONS,
  premierVersementModifiable,
  type SaisieModification,
} from '../../domain/rules/edit-sections'
import type { Recu, SectionModifiable, Tarif } from '../../domain/types'
import { CaseACocher, Champ, enErreur, ListeErreurs, Saisie, Selection } from '../champs'
import { Dialogue } from '../dialogue'

const DESCRIPTIONS: Record<SectionModifiable, string> = {
  identity: 'Le prénom et le nom ensemble',
  contact: 'Le numéro de téléphone seul',
  program: 'Hôtel, vol, chambre et réduction',
  group: 'Ajouter, changer ou retirer le groupe',
  note: 'Modifier la note seule',
  firstPayment: "Méthode et données de l'instrument, sans changer le montant",
}

interface Proprietes {
  recu: Recu
  referentiels: {
    hotels: { id: string; nom: string }[]
    vols: { id: string; nom: string }[]
    chambres: { id: string; code: string }[]
    tarifs: Tarif[]
  }
  onFermer: () => void
  onEnregistrer: (saisie: SaisieModification) => Promise<Resultat<null>>
}

function saisieInitiale(recu: Recu): SaisieModification {
  const premier = recu.versements[0]
  return {
    section: '',
    motif: '',
    prenom: recu.prenom,
    nom: recu.nom,
    telephone: recu.telephone,
    hotel: recu.hotel,
    vol: recu.vol,
    chambre: recu.chambre,
    reduction: centimesEnDirhamsSaisis(recu.reductionCentimes),
    groupeCoche: Boolean(recu.groupe),
    groupe: recu.groupe,
    note: recu.note,
    nature: premier?.nature ?? NATURE_ESPECES,
    reference: premier?.referenceInstrument ?? '',
    dateInstrument: premier?.dateInstrument ?? '',
    banque: premier?.banque ?? '',
    operationPartagee: premier?.portee === 'shared',
    payeur: premier?.payeur ?? '',
    montantOperation: premier ? centimesEnDirhamsSaisis(premier.montantOperationCentimes) : '',
  }
}

export function ModaleModification({ recu, referentiels, onFermer, onEnregistrer }: Proprietes) {
  const [saisie, setSaisie] = useState<SaisieModification>(saisieInitiale(recu))
  const [erreurs, setErreurs] = useState<ErreurValidation[]>([])
  const [envoi, setEnvoi] = useState(false)

  const modifier = (patch: Partial<SaisieModification>) => setSaisie({ ...saisie, ...patch })
  const section = saisie.section
  const versementPartage = !premierVersementModifiable(recu)

  const soumettre = async () => {
    setEnvoi(true)
    const resultat = await onEnregistrer(saisie)
    setEnvoi(false)
    if (resultat.statut === 'erreurs') {
      setErreurs(resultat.erreurs)
      return
    }
    onFermer()
  }

  return (
    <Dialogue
      titre="Modifier les données du reçu"
      taille="large"
      onFermer={onFermer}
      pied={
        section ? (
          <>
            <button
              className="omra-btn"
              onClick={() => {
                setSaisie({ ...saisie, section: '' })
                setErreurs([])
              }}
              disabled={envoi}
            >
              Changer de section
            </button>
            <button className="omra-btn primary" onClick={soumettre} disabled={envoi}>
              Enregistrer la modification
            </button>
          </>
        ) : (
          <button className="omra-btn" onClick={onFermer}>
            Fermer
          </button>
        )
      }
    >
      <ListeErreurs erreurs={erreurs} />

      {!section ? (
        <>
          <p style={{ fontSize: 13, marginTop: 0 }}>
            Choisissez une seule section. Après l’avoir enregistrée, vous pourrez rouvrir cette
            fenêtre pour en modifier une autre.
          </p>
          <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
            {(Object.keys(LIBELLES_SECTIONS) as SectionModifiable[]).map((cle) => {
              const bloquee = cle === 'firstPayment' && versementPartage
              return (
                <button
                  key={cle}
                  className="omra-btn"
                  style={{ height: 'auto', padding: '12px 14px', textAlign: 'left' }}
                  disabled={bloquee}
                  onClick={() => setSaisie({ ...saisie, section: cle })}
                >
                  <span style={{ display: 'block', fontWeight: 750, fontSize: 13 }}>
                    {LIBELLES_SECTIONS[cle]}
                  </span>
                  <span
                    style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}
                  >
                    {bloquee
                      ? "Opération partagée : à modifier depuis le registre des paiements, pas depuis le reçu."
                      : DESCRIPTIONS[cle]}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="omra-hint" style={{ marginTop: 14 }}>
            L’intermédiaire et les montants des versements ne sont pas modifiables. Les versements à
            partir du deuxième restent tels qu’ils ont été enregistrés.
          </p>
        </>
      ) : (
        <>
          <div className="omra-panel" style={{ marginTop: 0 }}>
            <h3>{LIBELLES_SECTIONS[section]}</h3>

            {section === 'identity' ? (
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
              </div>
            ) : null}

            {section === 'contact' ? (
              <div className="omra-fields">
                <Champ label="Téléphone *" aide="10 chiffres">
                  <Saisie
                    valeur={saisie.telephone}
                    onChange={(v) => modifier({ telephone: formaterTelephone(v) })}
                    invalide={enErreur(erreurs, 'telephone')}
                    mono
                    inputMode="tel"
                  />
                </Champ>
              </div>
            ) : null}

            {section === 'program' ? (
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
                <Champ label="Réduction (DH)">
                  <Saisie
                    valeur={saisie.reduction}
                    onChange={(v) => modifier({ reduction: formaterMontant(v) })}
                    invalide={enErreur(erreurs, 'reduction')}
                    mono
                    inputMode="numeric"
                  />
                </Champ>
              </div>
            ) : null}

            {section === 'group' ? (
              <>
                <CaseACocher
                  coche={saisie.groupeCoche}
                  onChange={(coche) => modifier({ groupeCoche: coche })}
                  label="Appartient à un groupe ou une famille"
                />
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
              </>
            ) : null}

            {section === 'note' ? (
              <div className="omra-fields">
                <Champ label="Note" pleine>
                  <Saisie valeur={saisie.note} onChange={(v) => modifier({ note: v })} />
                </Champ>
              </div>
            ) : null}

            {section === 'firstPayment' ? (
              <>
                <div className="omra-choice">
                  {[
                    { valeur: NATURE_ESPECES, libelle: 'Espèces' },
                    { valeur: NATURE_CHEQUE, libelle: 'Chèque' },
                    { valeur: NATURE_VIREMENT, libelle: 'Virement' },
                  ].map((option) => (
                    <button
                      key={option.valeur}
                      type="button"
                      className={saisie.nature === option.valeur ? 'active' : ''}
                      onClick={() => modifier({ nature: option.valeur })}
                    >
                      {option.libelle}
                    </button>
                  ))}
                </div>

                {saisie.nature !== NATURE_ESPECES ? (
                  <div className="omra-fields" style={{ marginTop: 12 }}>
                    <Champ label="Numéro / référence *">
                      <Saisie
                        valeur={saisie.reference}
                        onChange={(v) => modifier({ reference: v })}
                        invalide={enErreur(erreurs, 'reference')}
                        mono
                      />
                    </Champ>
                    <Champ label="Date de l’opération *">
                      <Saisie
                        valeur={saisie.dateInstrument}
                        onChange={(v) => modifier({ dateInstrument: formaterDate(v) })}
                        invalide={enErreur(erreurs, 'dateInstrument')}
                        mono
                        inputMode="numeric"
                      />
                    </Champ>
                    <Champ label="Banque *">
                      <Saisie
                        valeur={saisie.banque}
                        onChange={(v) => modifier({ banque: v })}
                        invalide={enErreur(erreurs, 'banque')}
                        arabe
                      />
                    </Champ>
                  </div>
                ) : null}

                <p className="omra-hint" style={{ marginTop: 12 }}>
                  Cette modification ne concerne que la méthode et les données du premier versement.
                  Son montant et les versements suivants ne changent pas.
                </p>
              </>
            ) : null}
          </div>

          <div className="omra-fields">
            <Champ label="Motif de la modification *" pleine>
              <Saisie
                valeur={saisie.motif}
                onChange={(v) => modifier({ motif: v })}
                invalide={enErreur(erreurs, 'motif')}
                arabe
              />
            </Champ>
          </div>
        </>
      )}
    </Dialogue>
  )
}
