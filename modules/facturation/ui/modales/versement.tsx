'use client'

/**
 * Fenêtre « Ajouter un versement ».
 *
 * Reproduit la structure de référence : recherche du reçu par numéro, rappel de
 * sa situation, récapitulatif des six lignes de versement, puis montant et
 * méthode de paiement.
 *
 * L'avertissement affiché dès la saisie du numéro reprend `motifRefusVersement`
 * (R-15 à R-18), la même règle que celle appliquée à l'enregistrement.
 */

import { useState } from 'react'

import { MAX_VERSEMENTS } from '../../domain/constants'
import { formaterMontant } from '../../domain/format'
import { centimesEnTexteDevise, dirhamsSaisisEnCentimes } from '../../domain/money'
import { natureAbregee, natureNormalisee } from '../../domain/payment-method'
import type { ErreurValidation, Resultat } from '../../domain/rules/errors'
import { messageFr } from '../../domain/rules/errors'
import { motifRefusVersement, type SaisieVersement } from '../../domain/rules/payment'
import { restantDu, totalPaye } from '../../domain/rules/receipt'
import type { OperationPartagee, Recu } from '../../domain/types'
import { Champ, enErreur, ListeErreurs, Saisie } from '../champs'
import { Dialogue } from '../dialogue'
import { BlocInstrument, instrumentVierge } from '../instrument-panel'
import { Montant, TexteArabe } from '../bidi'
import { ModaleDepassement } from './depassement'

/** Libellé français d’une nature de paiement. */
function libelleNature(valeur: string): string {
  const nature = natureNormalisee(valeur)
  if (nature === 'نقد') return 'Espèces'
  if (nature === 'شيك') return 'Chèque'
  if (nature === 'تحويل بنكي') return 'Virement'
  return natureAbregee(valeur)
}

interface Proprietes {
  recus: Recu[]
  operations: OperationPartagee[]
  numeroInitial?: string
  onFermer: () => void
  onEnregistrer: (
    saisie: SaisieVersement,
    confirme: boolean,
  ) => Promise<Resultat<{ recuId: string }>>
}

export function ModaleVersement({
  recus,
  operations,
  numeroInitial = '',
  onFermer,
  onEnregistrer,
}: Proprietes) {
  const [saisie, setSaisie] = useState<SaisieVersement>({
    numeroRecu: numeroInitial,
    montant: '',
    instrument: instrumentVierge(),
  })
  const [erreurs, setErreurs] = useState<ErreurValidation[]>([])
  const [depassement, setDepassement] = useState<{ montant: number; disponible: number } | null>(
    null,
  )
  const [envoi, setEnvoi] = useState(false)

  const modifier = (patch: Partial<SaisieVersement>) => setSaisie({ ...saisie, ...patch })

  const numero = Number(saisie.numeroRecu)
  const recu = saisie.numeroRecu.trim()
    ? (recus.find((r) => r.numero === numero) ?? null)
    : null
  const refus = saisie.numeroRecu.trim() ? motifRefusVersement(recu) : null
  const utilisable = Boolean(recu) && !refus

  const restant = recu ? restantDu(recu) : 0
  const montantCentimes = dirhamsSaisisEnCentimes(saisie.montant)

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
      titre="Ajouter un versement"
      taille="large"
      onFermer={onFermer}
      pied={
        <>
          <button className="omra-btn" onClick={onFermer} disabled={envoi}>
            Annuler
          </button>
          <button
            className="omra-btn primary"
            onClick={() => soumettre(false)}
            disabled={envoi || !utilisable}
          >
            Enregistrer le versement
          </button>
        </>
      }
    >
      <ListeErreurs erreurs={erreurs} />

      <div className="omra-fields">
        <Champ label="Numéro du reçu *" aide="Saisissez directement le numéro">
          <Saisie
            valeur={saisie.numeroRecu}
            onChange={(v) => modifier({ numeroRecu: v.replace(/\D/g, '') })}
            invalide={enErreur(erreurs, 'numeroRecu')}
            mono
            inputMode="numeric"
          />
        </Champ>
      </div>

      {refus ? (
        <div className="omra-errors" style={{ marginTop: 14 }} role="alert">
          <strong>{messageFr(refus)}</strong>
        </div>
      ) : null}

      {recu && !refus ? (
        <>
          <div className="omra-summary" style={{ marginTop: 14 }}>
            <div>
              <span>Voyageur</span>
              <TexteArabe>{`${recu.prenom} ${recu.nom}`}</TexteArabe>
            </div>
            <div>
              <span>Montant convenu</span>
              <Montant centimes={recu.convenuCentimes} />
            </div>
            <div>
              <span>Déjà payé</span>
              <Montant centimes={totalPaye(recu)} />
            </div>
            <div>
              <span>Restant dû</span>
              <Montant centimes={restant} />
            </div>
            <div>
              <span>Versements</span>
              <span className="mono">
                {recu.versements.length} / {MAX_VERSEMENTS}
              </span>
            </div>
            <div>
              <span>Restant après ce versement</span>
              <Montant centimes={Math.max(0, restant - montantCentimes)} />
            </div>
          </div>

          {recu.versements.length === MAX_VERSEMENTS - 1 ? (
            <p className="omra-hint" style={{ marginTop: 10, color: 'var(--warn)' }}>
              Sixième versement : le montant doit être exactement égal au restant dû (
              {centimesEnTexteDevise(restant)}).
            </p>
          ) : null}

          <div className="omra-panel">
            <h3>Récapitulatif des six versements</h3>
            <table className="omra-mini-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: MAX_VERSEMENTS }, (_, index) => {
                  const versement = recu.versements[index]
                  if (!versement) {
                    return (
                      <tr key={index} className="vide">
                        <td className="mono">{index + 1}</td>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                      </tr>
                    )
                  }
                  const details = [
                    versement.referenceInstrument,
                    versement.dateInstrument,
                    versement.banque,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                  return (
                    <tr key={versement.id}>
                      <td className="mono">{index + 1}</td>
                      <td className="mono">{versement.date}</td>
                      <td>
                        <Montant centimes={versement.montantCentimes} />
                      </td>
                      <td>{libelleNature(versement.nature)}</td>
                      <td>
                        {details ? <TexteArabe>{details}</TexteArabe> : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="omra-hint" style={{ marginTop: 8 }}>
              Lecture seule.
            </p>
          </div>

          <div className="omra-fields" style={{ marginTop: 14 }}>
            <Champ label="Montant (DH) *">
              <Saisie
                valeur={saisie.montant}
                onChange={(v) => modifier({ montant: formaterMontant(v) })}
                invalide={enErreur(erreurs, 'montant')}
                mono
                inputMode="numeric"
              />
            </Champ>
          </div>

          <BlocInstrument
            saisie={saisie.instrument}
            onChange={(instrument) => modifier({ instrument })}
            erreurs={erreurs}
            operations={operations}
            recus={recus}
            montantSaisi={saisie.montant}
          />
        </>
      ) : null}
    </Dialogue>
  )
}
