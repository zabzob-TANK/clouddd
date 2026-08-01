'use client'

/**
 * Fenêtre « Journal des opérations ».
 *
 * R-86 — Chaque action laisse une trace, la plus récente en tête.
 */

import type { EntreeAudit } from '../../domain/types'
import { Dialogue } from '../dialogue'
import { DateValeur } from '../bidi'
import { T } from '../textes'

export function ModaleJournal({
  entrees,
  onFermer,
}: {
  entrees: EntreeAudit[]
  onFermer: () => void
}) {
  return (
    <Dialogue titre={T.journal.titre} taille="large" onFermer={onFermer}>
      {entrees.length === 0 ? (
        <div className="omra-empty">
          <strong>{T.journal.vide}</strong>
        </div>
      ) : (
        entrees.map((entree) => (
          <div className="omra-log-entry" key={entree.id}>
            <div className="omra-log-head">
              <span className="omra-log-action">{entree.action}</span>
              <span className="omra-log-meta">
                <DateValeur>{entree.horodatage}</DateValeur> · {entree.utilisateur}
              </span>
            </div>
            <div className="omra-log-detail">{entree.detail}</div>
          </div>
        ))
      )}
    </Dialogue>
  )
}
