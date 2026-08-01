'use client'

/**
 * Fenêtre « Annuler le reçu ».
 *
 * R-43 à R-47 — Motif, mode de remboursement et mot de passe obligatoires.
 * Le reçu n’est jamais supprimé et son numéro n’est jamais réutilisé.
 */

import { useState } from 'react'

import type { ErreurValidation, Resultat } from '../../domain/rules/errors'
import type { SaisieAnnulation } from '../../domain/rules/cancellation'
import { totalPaye } from '../../domain/rules/receipt'
import type { Recu } from '../../domain/types'
import { Champ, enErreur, ListeErreurs, Saisie, Selection } from '../champs'
import { Dialogue } from '../dialogue'
import { Montant, Reference, TexteArabe } from '../bidi'
import { T } from '../textes'

interface Proprietes {
  recu: Recu
  onFermer: () => void
  onAnnuler: (saisie: SaisieAnnulation) => Promise<Resultat<null>>
}

export function ModaleAnnulation({ recu, onFermer, onAnnuler }: Proprietes) {
  const [saisie, setSaisie] = useState<SaisieAnnulation>({
    motif: '',
    modeRemboursement: '',
    motDePasse: '',
  })
  const [erreurs, setErreurs] = useState<ErreurValidation[]>([])
  const [envoi, setEnvoi] = useState(false)

  const modifier = (patch: Partial<SaisieAnnulation>) => setSaisie({ ...saisie, ...patch })

  const soumettre = async () => {
    setEnvoi(true)
    const resultat = await onAnnuler(saisie)
    setEnvoi(false)
    if (resultat.statut === 'erreurs') {
      setErreurs(resultat.erreurs)
      return
    }
    onFermer()
  }

  return (
    <Dialogue
      titre={T.annulation.titre}
      onFermer={onFermer}
      pied={
        <>
          <button className="omra-btn" onClick={onFermer} disabled={envoi}>
            {T.annulation.retour}
          </button>
          <button className="omra-btn danger" onClick={soumettre} disabled={envoi}>
            {T.annulation.confirmer}
          </button>
        </>
      }
    >
      <ListeErreurs erreurs={erreurs} />

      <p style={{ fontSize: 13, marginTop: 0 }}>
        {T.annulation.avertissement}
      </p>

      <div className="omra-summary" style={{ marginTop: 14 }}>
        <div>
          <span>{T.registre.colonnes.numero}</span>
          <Reference>{recu.numero}</Reference>
        </div>
        <div>
          <span>{T.registre.colonnes.nom}</span>
          <TexteArabe>{`${recu.prenom} ${recu.nom}`}</TexteArabe>
        </div>
        <div>
          <span>{T.annulation.montantPaye}</span>
          <Montant centimes={totalPaye(recu)} />
        </div>
      </div>

      <div className="omra-fields" style={{ marginTop: 16 }}>
        <Champ label={T.annulation.modeRemboursement} pleine>
          <Selection
            valeur={saisie.modeRemboursement}
            onChange={(v) => modifier({ modeRemboursement: v as SaisieAnnulation['modeRemboursement'] })}
            options={[
              { valeur: 'cash', libelle: T.annulation.depuisCaisse },
              { valeur: 'none', libelle: T.annulation.horsCaisse },
            ]}
            invalide={enErreur(erreurs, 'modeRemboursement')}
            vide={T.annulation.choisir}
          />
        </Champ>
        <Champ label="Motif de l'annulation *" pleine>
          <Saisie
            valeur={saisie.motif}
            onChange={(v) => modifier({ motif: v })}
            invalide={enErreur(erreurs, 'motif')}
            arabe
          />
        </Champ>
        <Champ
          label={T.annulation.motDePasse}
          pleine
        >
          <Saisie
            valeur={saisie.motDePasse}
            onChange={(v) => modifier({ motDePasse: v })}
            invalide={enErreur(erreurs, 'motDePasse')}
            type="password"
          />
        </Champ>
      </div>


    </Dialogue>
  )
}
