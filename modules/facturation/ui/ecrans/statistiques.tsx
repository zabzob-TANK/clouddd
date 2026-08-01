'use client'

/**
 * Écran « الإحصائيات ».
 *
 * Le fichier de référence n'y calcule rien : quatre cartes annoncent des
 * rubriques marquées « مرحلة لاحقة », suivies d'une note expliquant que la page
 * est réservée sans toucher à la facturation.
 *
 * R-91 — Cet état provisoire est reproduit tel quel. Aucun indicateur n'est
 * inventé ici : d'éventuelles statistiques réelles feront l'objet du lot L6 et
 * seront présentées séparément, comme une extension proposée.
 */

import { T } from '../textes'

export function EcranStatistiques() {
  return (
    <div className="omra-page">
      <div className="omra-stats-grille">
        {T.statistiques.cartes.map((carte) => (
          <div className="omra-stat-carte" key={carte.titre}>
            <div className="omra-stat-carte-titre">{carte.titre}</div>
            <div className="omra-stat-carte-soustitre">{carte.sousTitre}</div>
            <span className="omra-stat-carte-etiquette">{T.statistiques.etiquette}</span>
          </div>
        ))}
      </div>
      <p className="omra-stats-note">{T.statistiques.note}</p>
    </div>
  )
}
