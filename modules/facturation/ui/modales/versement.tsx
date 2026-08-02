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
import { dateDuJour } from '../../domain/dates'
import { formaterMontant } from '../../domain/format'
import { centimesEnTexteDevise, dirhamsSaisisEnCentimes } from '../../domain/money'
import { natureAbregee, natureNormalisee } from '../../domain/payment-method'
import type { ErreurValidation, Resultat } from '../../domain/rules/errors'
import { messageErreur } from '../../domain/rules/errors'
import { motifRefusVersement, type SaisieVersement } from '../../domain/rules/payment'
import { restantDu, totalPaye } from '../../domain/rules/receipt'
import type { OperationPartagee, Recu } from '../../domain/types'
import { Champ, enErreur, ListeErreurs, Saisie } from '../champs'
import { Dialogue } from '../dialogue'
import { BlocInstrument, instrumentVierge } from '../instrument-panel'
import { CarteImageInstrument } from '../carte-image-instrument'
import { cibleImageInstrument, useBrouillonImage } from '../image-instrument'
import { ModalePaiementImage } from './paiement-image'
import { Montant, TexteArabe } from '../bidi'
import { ModaleDepassement } from './depassement'
import { T } from '../textes'

/** Libellé abrégé de la méthode, comme `receiptMethodDisplay()`. */
function libelleNature(valeur: string): string {
  const nature = natureNormalisee(valeur)
  if (nature === 'نقد') return T.methodes.especes
  if (nature === 'شيك') return T.methodes.cheque
  if (nature === 'تحويل بنكي') return T.methodes.virement
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
    /** R-35 — image de l'instrument, rattachée à l'enregistrement seulement. */
    image: { contenu: Blob; nomOrigine: string } | null,
  ) => Promise<Resultat<{ recuId: string }>>
  /** R-38 — aperçus des images déjà portées par les opérations partagées. */
  imagesOperations: Record<string, string>
}

export function ModaleVersement({
  recus,
  operations,
  numeroInitial = '',
  onFermer,
  onEnregistrer,
  imagesOperations,
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
  // R-35 — l'image reste un brouillon local jusqu'à l'enregistrement du versement.
  const image = useBrouillonImage()

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
    const resultat = await onEnregistrer(
      saisie,
      confirme,
      image.brouillon
        ? { contenu: image.brouillon.contenu, nomOrigine: image.brouillon.nomOrigine }
        : null,
    )
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
      titre={T.versement.titre}
      taille="large"
      classeCoque="recu-coque"
      onFermer={onFermer}
      bandeau={
        // Même bandeau que le formulaire de création : intitulé, numéro visé
        // puis date du jour. Tant qu'aucun reçu n'est trouvé, le fichier de
        // référence affiche un simple tiret.
        <div className="recu-bandeau">
          <div className="recu-bandeau-label">{T.versement.numeroRecu.replace(' *', '')}</div>
          <div className="recu-bandeau-numero mono">
            {recu ? recu.numero : T.nouveau.montantInconnu}
          </div>
          <div className="recu-bandeau-date mono" dir="ltr">
            {dateDuJour()}
          </div>
        </div>
      }
      pied={
        <>
          <button className="omra-btn" onClick={onFermer} disabled={envoi}>
            {T.versement.annuler}
          </button>
          <button
            className="omra-btn primary"
            onClick={() => soumettre(false)}
            disabled={envoi || !utilisable}
          >
            {T.versement.enregistrer}
          </button>
        </>
      }
    >
      <ListeErreurs erreurs={erreurs} />

      <div className="omra-fields">
        <Champ label={T.versement.numeroRecu} aide={T.versement.aideNumero}>
          <Saisie
            valeur={saisie.numeroRecu}
            onChange={(v) => modifier({ numeroRecu: v.replace(/\D/g, '') })}
            invalide={enErreur(erreurs, 'numeroRecu')}
            placeholder={T.nouveau.gabaritNumeroRecu}
            classe="numero-recu"
            mono
            inputMode="numeric"
          />
        </Champ>
      </div>

      {refus ? (
        <div className="omra-errors" style={{ marginTop: 14 }} role="alert">
          <strong>{messageErreur(refus)}</strong>
        </div>
      ) : null}

      {recu && !refus ? (
        <>
          <div className="omra-summary" style={{ marginTop: 14 }}>
            <div>
              <span>{T.registre.colonnes.nom}</span>
              <TexteArabe>{`${recu.prenom} ${recu.nom}`}</TexteArabe>
            </div>
            <div>
              <span>{T.registre.colonnes.convenu}</span>
              <Montant centimes={recu.convenuCentimes} />
            </div>
            <div>
              <span>{T.versement.payeAvant}</span>
              <Montant centimes={totalPaye(recu)} />
            </div>
            <div>
              <span>{T.registre.colonnes.restant}</span>
              <Montant centimes={restant} />
            </div>
            <div>
              <span>{T.registre.colonnes.nbVersements}</span>
              <span className="mono">
                {recu.versements.length} / {MAX_VERSEMENTS}
              </span>
            </div>
            <div>
              <span>{T.versement.restantApres}</span>
              <Montant centimes={Math.max(0, restant - montantCentimes)} />
            </div>
          </div>

          {recu.versements.length === MAX_VERSEMENTS - 1 ? (
            <p className="omra-hint" style={{ marginTop: 10, color: 'var(--warn)' }}>
              الدفعة السادسة يجب أن تساوي كامل الباقي بالضبط ({centimesEnTexteDevise(restant)}).
            </p>
          ) : null}

          <div className="omra-panel">
            <h3>{T.versement.recap}</h3>
            <table className="omra-mini-table">
              <thead>
                <tr>
                  <th>{T.versement.colonnes.rang}</th>
                  <th>{T.versement.colonnes.date}</th>
                  <th>{T.versement.colonnes.montant}</th>
                  <th>{T.versement.colonnes.methode}</th>
                  <th>{T.versement.colonnes.details}</th>
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
              {T.versement.recapAide}
            </p>
          </div>

          <div className="omra-fields" style={{ marginTop: 14 }}>
            <Champ label={T.versement.montant}>
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

          <CarteImageInstrument
            saisie={saisie.instrument}
            contexte="versement"
            apercuBrouillon={image.brouillon?.apercu ?? ''}
            apercuOperation={imagesOperations[saisie.instrument.operationId] ?? ''}
            onAjouter={image.ouvrir}
          />

          {image.ouverte ? (
            <ModalePaiementImage
              cible={cibleImageInstrument(saisie.instrument, saisie.montant)}
              onFermer={image.fermer}
              onEnregistrer={(fichier) => image.retenir(fichier.contenu, fichier.nomOrigine)}
            />
          ) : null}
        </>
      ) : null}
    </Dialogue>
  )
}
