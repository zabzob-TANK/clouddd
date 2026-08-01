'use client'

/**
 * Bloc « méthode de paiement » partagé par la création de reçu et l'ajout de
 * versement — les deux formulaires du fichier de référence exposent exactement
 * les mêmes choix et les mêmes champs.
 *
 * Reproduit R-23 à R-33 côté interface : nature, portée unique ou partagée,
 * opération nouvelle ou existante, et récapitulatif de l'allocation.
 */

import { NATURE_CHEQUE, NATURE_ESPECES, NATURE_VIREMENT } from '../domain/constants'
import { formaterDate, formaterMontant } from '../domain/format'
import { centimesEnTexteDevise, dirhamsSaisisEnCentimes } from '../domain/money'
import { natureNormalisee } from '../domain/payment-method'
import type { SaisieInstrument } from '../domain/rules/instrument'
import type { ErreurValidation } from '../domain/rules/errors'
import { optionsOperations } from '../domain/rules/shared-payment'
import type { OperationPartagee, Recu } from '../domain/types'
import { Champ, CaseACocher, enErreur, Saisie, Selection } from './champs'
import { Montant } from './bidi'
import { T } from './textes'

/** Natures proposées, avec les libellés arabes du fichier de référence. */
const NATURES = [
  { valeur: NATURE_ESPECES, libelle: T.methodes.especes },
  { valeur: NATURE_CHEQUE, libelle: T.methodes.cheque },
  { valeur: NATURE_VIREMENT, libelle: T.methodes.virement },
]

interface Proprietes {
  saisie: SaisieInstrument
  onChange: (saisie: SaisieInstrument) => void
  erreurs: ErreurValidation[]
  operations: OperationPartagee[]
  recus: Recu[]
  /** Montant saisi dans le formulaire parent, en dirhams. */
  montantSaisi: string
}

export function BlocInstrument({
  saisie,
  onChange,
  erreurs,
  operations,
  recus,
  montantSaisi,
}: Proprietes) {
  const nature = natureNormalisee(saisie.nature)
  const bancaire = nature === NATURE_CHEQUE || nature === NATURE_VIREMENT
  const partage = saisie.portee === 'shared'
  const existante = partage && saisie.sourceOperation === 'existing'

  const modifier = (patch: Partial<SaisieInstrument>) => onChange({ ...saisie, ...patch })

  // R-23 — changer de nature réinitialise la portée et les champs d’instrument,
  // comme `changeInstrumentMode()` du fichier de référence.
  const changerNature = (valeur: string) =>
    onChange({
      nature: valeur,
      portee: 'unique',
      sourceOperation: 'new',
      operationId: '',
      reference: '',
      dateInstrument: '',
      banque: '',
      payeur: '',
      montantOperation: '',
    })

  // R-31
  const options = optionsOperations(operations, recus, saisie.nature, saisie.operationId)
  const operationChoisie = operations.find((o) => o.id === saisie.operationId) ?? null
  const etatChoisi = operationChoisie
    ? optionsOperations(operations, recus, saisie.nature, saisie.operationId).find(
        (o) => o.id === saisie.operationId,
      )?.etat
    : null

  const partCentimes = dirhamsSaisisEnCentimes(montantSaisi)

  return (
    <div className="omra-panel">
      <h3>{T.nouveau.methode}</h3>

      <div className="omra-choice" role="group" aria-label={T.nouveau.methode}>
        {NATURES.map((option) => (
          <button
            key={option.valeur}
            type="button"
            className={nature === option.valeur ? 'active' : ''}
            onClick={() => changerNature(option.valeur)}
          >
            {option.libelle}
          </button>
        ))}
      </div>

      {bancaire ? (
        <>
          <div className="omra-choice" style={{ marginTop: 12 }} role="group" aria-label={T.instrument.dansLaMemeFenetre}>
            <button
              type="button"
              className={!partage ? 'active' : ''}
              onClick={() =>
                modifier({
                  portee: 'unique',
                  sourceOperation: 'new',
                  operationId: '',
                  payeur: '',
                  montantOperation: '',
                })
              }
            >
              {T.instrument.operationUnique}
            </button>
            <button
              type="button"
              className={partage ? 'active' : ''}
              onClick={() => modifier({ portee: 'shared' })}
            >
              {T.instrument.operationPartagee}
            </button>
          </div>

          {partage ? (
            <div className="omra-choice" style={{ marginTop: 8 }} role="group" aria-label={T.instrument.dansLaMemeFenetre}>
              <button
                type="button"
                className={saisie.sourceOperation === 'new' ? 'active' : ''}
                onClick={() =>
                  modifier({
                    sourceOperation: 'new',
                    operationId: '',
                    reference: '',
                    dateInstrument: '',
                    banque: '',
                    payeur: '',
                    montantOperation: '',
                  })
                }
              >
                {T.instrument.creerOperation}
              </button>
              <button
                type="button"
                className={existante ? 'active' : ''}
                onClick={() =>
                  modifier({
                    sourceOperation: 'existing',
                    operationId: '',
                    reference: '',
                    dateInstrument: '',
                    banque: '',
                    payeur: '',
                    montantOperation: '',
                  })
                }
              >
                {T.instrument.choisirOperation}
              </button>
            </div>
          ) : null}

          {existante ? (
            <div className="omra-fields" style={{ marginTop: 12 }}>
              <Champ label={T.instrument.operationsDisponibles} pleine>
                {options.length ? (
                  <Selection
                    valeur={saisie.operationId}
                    onChange={(valeur) => {
                      const operation = operations.find((o) => o.id === valeur)
                      modifier({
                        operationId: valeur,
                        reference: operation?.reference ?? '',
                        dateInstrument: operation?.dateInstrument ?? '',
                        banque: operation?.banque ?? '',
                        payeur: operation?.payeur ?? '',
                      })
                    }}
                    options={options.map((option) => ({
                      valeur: option.id,
                      libelle: option.libelle,
                    }))}
                    invalide={enErreur(erreurs, 'operationId')}
                    vide={T.instrument.choisirOperationVide}
                  />
                ) : (
                  <p className="omra-hint">
                    {T.instrument.aucuneOperation}
                  </p>
                )}
              </Champ>
            </div>
          ) : (
            <div className="omra-fields" style={{ marginTop: 12 }}>
              <Champ label={T.instrument.reference}>
                <Saisie
                  valeur={saisie.reference}
                  onChange={(valeur) => modifier({ reference: valeur })}
                  invalide={enErreur(erreurs, 'reference')}
                  mono
                />
              </Champ>
              <Champ label={T.instrument.dateOperation}>
                <Saisie
                  valeur={saisie.dateInstrument}
                  onChange={(valeur) => modifier({ dateInstrument: formaterDate(valeur) })}
                  invalide={enErreur(erreurs, 'dateInstrument')}
                  mono
                  inputMode="numeric"
                />
              </Champ>
              <Champ label={T.instrument.banque}>
                <Saisie
                  valeur={saisie.banque}
                  onChange={(valeur) => modifier({ banque: valeur })}
                  invalide={enErreur(erreurs, 'banque')}
                  arabe
                />
              </Champ>
              {partage ? (
                <>
                  <Champ label={T.instrument.payeur}>
                    <Saisie
                      valeur={saisie.payeur}
                      onChange={(valeur) => modifier({ payeur: valeur })}
                      invalide={enErreur(erreurs, 'payeur')}
                      arabe
                    />
                  </Champ>
                  <Champ
                    label={T.instrument.montantOperation}
                    aide={T.instrument.partDeCeVoyageur}
                  >
                    <Saisie
                      valeur={saisie.montantOperation}
                      onChange={(valeur) => modifier({ montantOperation: formaterMontant(valeur) })}
                      invalide={enErreur(erreurs, 'montantOperation')}
                      mono
                      inputMode="numeric"
                    />
                  </Champ>
                </>
              ) : null}
            </div>
          )}

          {partage ? (
            <div className="omra-summary">
              <div>
                <span>{T.detail.colonnes.montantOperation}</span>
                <Montant
                  centimes={
                    existante
                      ? (operationChoisie?.montantTotalCentimes ?? 0)
                      : dirhamsSaisisEnCentimes(saisie.montantOperation)
                  }
                />
              </div>
              <div>
                <span>{T.instrument.montantDistribue}</span>
                <Montant centimes={etatChoisi?.attribueCentimes ?? 0} />
              </div>
              <div>
                <span>{T.instrument.restantDisponible}</span>
                <Montant
                  centimes={
                    existante
                      ? (etatChoisi?.restantCentimes ?? 0)
                      : dirhamsSaisisEnCentimes(saisie.montantOperation)
                  }
                />
              </div>
              <div>
                <span>{T.instrument.uneSeuleImage}</span>
                <Montant centimes={partCentimes} />
              </div>
            </div>
          ) : null}

          <p className="omra-hint" style={{ marginTop: 10 }}>
            {T.instrument.imageDepuisRegistre}
          </p>
        </>
      ) : null}
    </div>
  )
}

/** Saisie d’instrument vierge — espèces, opération individuelle. */
export function instrumentVierge(): SaisieInstrument {
  return {
    nature: NATURE_ESPECES,
    portee: 'unique',
    sourceOperation: 'new',
    operationId: '',
    reference: '',
    dateInstrument: '',
    banque: '',
    payeur: '',
    montantOperation: '',
  }
}

export { CaseACocher, centimesEnTexteDevise }
