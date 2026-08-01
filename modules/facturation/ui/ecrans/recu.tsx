'use client'

/**
 * Écran « الوصل » — affichage du reçu.
 *
 * Dans le fichier de référence, cet écran ne contient **que** deux choses :
 * une barre supérieure avec le bouton « رجوع », et le reçu imprimable occupant
 * toute la hauteur. Il n'y a ni fiche, ni cartes de synthèse, ni sections :
 * les informations détaillées vivent dans la fenêtre « الملف الكامل للمسافر ».
 *
 * Le reçu imprimable lui-même relève du lot L3. En attendant, la zone qui le
 * recevra est présente et occupe la même place, à la même dimension.
 */

import type { Recu } from '../../domain/types'
import { T } from '../textes'

interface Proprietes {
  recu: Recu
  onRetour: () => void
}

export function EcranRecu({ recu, onRetour }: Proprietes) {
  return (
    <div className="omra-recu-page">
      <div className="omra-recu-barre omra-no-print">
        <button className="omra-back" onClick={onRetour}>
          <span aria-hidden="true">←</span>
          {T.recu.retour}
        </button>
      </div>

      <div className="omra-recu-zone" aria-label={`وصل ${recu.numero}`}>
        <div className="omra-recu-attente">
          <div className="omra-recu-attente-numero" dir="ltr">
            {recu.numero}
          </div>
          <p>الوصل القابل للطباعة — المرحلة L3</p>
        </div>
      </div>
    </div>
  )
}
