'use client'

/**
 * Fenêtre de confirmation d’un dépassement d'opération partagée.
 *
 * R-32 — L'enregistrement reste possible, mais exige une confirmation explicite.
 * L'écart n’est pas corrigé : il est conservé dans les données.
 * R-33 — Le fichier de référence précise qu'aucune surveillance automatique des
 * opérations dupliquées n'existe ; le texte est repris tel quel, en français.
 */

import { centimesEnTexteDevise } from '../../domain/money'
import { Dialogue } from '../dialogue'

interface Proprietes {
  montantCentimes: number
  disponibleCentimes: number
  onRetour: () => void
  onConfirmer: () => void
}

export function ModaleDepassement({
  montantCentimes,
  disponibleCentimes,
  onRetour,
  onConfirmer,
}: Proprietes) {
  return (
    <Dialogue
      titre="Dépassement du montant restant de l’opération"
      taille="small"
      onFermer={onRetour}
      pied={
        <>
          <button className="omra-btn" onClick={onRetour}>
            Retour
          </button>
          <button className="omra-btn primary" onClick={onConfirmer}>
            Confirmer et enregistrer
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, marginTop: 0 }}>
        L’enregistrement est possible, mais il demande une confirmation explicite.
      </p>

      <div className="omra-summary" style={{ marginTop: 14 }}>
        <div>
          <span>Part à enregistrer</span>
          <span className="mono">{centimesEnTexteDevise(montantCentimes)}</span>
        </div>
        <div>
          <span>Restant sur l’opération</span>
          <span className="mono">{centimesEnTexteDevise(disponibleCentimes)}</span>
        </div>
      </div>

      <p className="omra-hint" style={{ marginTop: 14 }}>
        Cet écart sera conservé dans les données de l’opération. Aucune surveillance automatique des
        opérations dupliquées n’est effectuée.
      </p>
    </Dialogue>
  )
}
