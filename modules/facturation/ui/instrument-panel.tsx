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

/** Libellés français des natures. L'interface ne montre aucun libellé arabe. */
const NATURES = [
  { valeur: NATURE_ESPECES, libelle: 'Espèces' },
  { valeur: NATURE_CHEQUE, libelle: 'Chèque' },
  { valeur: NATURE_VIREMENT, libelle: 'Virement' },
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
      <h3>Méthode de paiement</h3>

      <div className="omra-choice" role="group" aria-label="Nature du paiement">
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
          <div className="omra-choice" style={{ marginTop: 12 }} role="group" aria-label="Portée">
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
              Opération individuelle
            </button>
            <button
              type="button"
              className={partage ? 'active' : ''}
              onClick={() => modifier({ portee: 'shared' })}
            >
              Opération partagée
            </button>
          </div>

          {partage ? (
            <div className="omra-choice" style={{ marginTop: 8 }} role="group" aria-label="Origine">
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
                Créer une opération
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
                Choisir une opération existante
              </button>
            </div>
          ) : null}

          {existante ? (
            <div className="omra-fields" style={{ marginTop: 12 }}>
              <Champ label="Opérations partagées disponibles *" pleine>
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
                    vide="Choisir l’opération…"
                  />
                ) : (
                  <p className="omra-hint">
                    Aucune opération partagée disponible pour cette méthode. Créez-en une d’abord.
                  </p>
                )}
              </Champ>
            </div>
          ) : (
            <div className="omra-fields" style={{ marginTop: 12 }}>
              <Champ label={nature === NATURE_CHEQUE ? 'Numéro du chèque *' : 'Référence du virement *'}>
                <Saisie
                  valeur={saisie.reference}
                  onChange={(valeur) => modifier({ reference: valeur })}
                  invalide={enErreur(erreurs, 'reference')}
                  mono
                />
              </Champ>
              <Champ label="Date de l’opération *" aide="Format : 02/07/2025">
                <Saisie
                  valeur={saisie.dateInstrument}
                  onChange={(valeur) => modifier({ dateInstrument: formaterDate(valeur) })}
                  invalide={enErreur(erreurs, 'dateInstrument')}
                  mono
                  inputMode="numeric"
                />
              </Champ>
              <Champ label="Banque *">
                <Saisie
                  valeur={saisie.banque}
                  onChange={(valeur) => modifier({ banque: valeur })}
                  invalide={enErreur(erreurs, 'banque')}
                  arabe
                />
              </Champ>
              {partage ? (
                <>
                  <Champ label="Personne ayant payé *">
                    <Saisie
                      valeur={saisie.payeur}
                      onChange={(valeur) => modifier({ payeur: valeur })}
                      invalide={enErreur(erreurs, 'payeur')}
                      arabe
                    />
                  </Champ>
                  <Champ
                    label="Montant total de l’opération *"
                    aide="Le montant saisi plus haut est la part de ce voyageur."
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
                <span>Montant de l’opération</span>
                <Montant
                  centimes={
                    existante
                      ? (operationChoisie?.montantTotalCentimes ?? 0)
                      : dirhamsSaisisEnCentimes(saisie.montantOperation)
                  }
                />
              </div>
              <div>
                <span>Déjà attribué</span>
                <Montant centimes={etatChoisi?.attribueCentimes ?? 0} />
              </div>
              <div>
                <span>Restant disponible</span>
                <Montant
                  centimes={
                    existante
                      ? (etatChoisi?.restantCentimes ?? 0)
                      : dirhamsSaisisEnCentimes(saisie.montantOperation)
                  }
                />
              </div>
              <div>
                <span>Part de ce reçu</span>
                <Montant centimes={partCentimes} />
              </div>
            </div>
          ) : null}

          <p className="omra-hint" style={{ marginTop: 10 }}>
            Une seule image par opération. Elle s’ajoute depuis le registre des paiements.
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
