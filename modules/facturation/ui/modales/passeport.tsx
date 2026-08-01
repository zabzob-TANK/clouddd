'use client'

/**
 * Fenêtre « Scan du passeport ».
 *
 * R-90 — Le fichier de référence expose onze champs et un remplissage explicitement
 * marqué comme une simulation (`prototype-ai-simulation`). Aucune lecture
 * automatique n'existe : la saisie et la correction sont manuelles.
 * Le port `LecteurPasseportPort` est prévu pour brancher un service réel plus tard.
 */

import { useState } from 'react'

import { formaterDate } from '../../domain/format'
import type { Passeport } from '../../domain/types'
import { Champ, Saisie } from '../champs'
import { Dialogue } from '../dialogue'

export function passeportVierge(): Passeport {
  return {
    prenom: '',
    nom: '',
    numero: '',
    nationalite: '',
    dateNaissance: '',
    lieuNaissance: '',
    dateEmission: '',
    dateExpiration: '',
    paysEmission: '',
    sexe: '',
    mrz: '',
    imageOriginale: null,
    imagePortrait: null,
    scanId: '',
    resultatBrut: null,
  }
}

interface Proprietes {
  initial: Passeport | null
  onFermer: () => void
  onValider: (passeport: Passeport) => void
}

export function ModalePasseport({ initial, onFermer, onValider }: Proprietes) {
  const [brouillon, setBrouillon] = useState<Passeport>(initial ?? passeportVierge())
  const [message, setMessage] = useState('')

  const modifier = (patch: Partial<Passeport>) => setBrouillon({ ...brouillon, ...patch })

  const valider = () => {
    // Le fichier de référence exige le nom et le prénom avant de reporter le
    // résultat du scan dans le formulaire du reçu.
    if (!brouillon.prenom.trim() || !brouillon.nom.trim()) {
      setMessage('Le prénom et le nom sont nécessaires pour utiliser le résultat du scan.')
      return
    }
    onValider({
      ...brouillon,
      scanId: brouillon.scanId || `SCAN-${Date.now()}`,
      resultatBrut: { source: 'saisie-manuelle', recuLe: new Date().toISOString() },
    })
  }

  return (
    <Dialogue
      titre="Passeport du voyageur"
      taille="large"
      onFermer={onFermer}
      pied={
        <>
          <button className="omra-btn" onClick={onFermer}>
            Annuler
          </button>
          <button className="omra-btn primary" onClick={valider}>
            Utiliser ces données
          </button>
        </>
      }
    >
      <p className="omra-hint" style={{ marginBottom: 14 }}>
        Saisie et correction manuelles. La lecture automatique n’est pas encore branchée : elle
        viendra derrière le port prévu à cet effet, sans modifier cet écran.
      </p>

      {message ? (
        <div className="omra-errors" role="alert">
          <strong>{message}</strong>
        </div>
      ) : null}

      <div className="omra-fields">
        <Champ label="Prénom *">
          <Saisie valeur={brouillon.prenom} onChange={(v) => modifier({ prenom: v })} arabe />
        </Champ>
        <Champ label="Nom *">
          <Saisie valeur={brouillon.nom} onChange={(v) => modifier({ nom: v })} arabe />
        </Champ>
        <Champ label="Numéro de passeport">
          <Saisie valeur={brouillon.numero} onChange={(v) => modifier({ numero: v })} mono />
        </Champ>
        <Champ label="Nationalité">
          <Saisie
            valeur={brouillon.nationalite}
            onChange={(v) => modifier({ nationalite: v })}
            arabe
          />
        </Champ>
        <Champ label="Date de naissance" aide="Format : 14/03/1986">
          <Saisie
            valeur={brouillon.dateNaissance}
            onChange={(v) => modifier({ dateNaissance: formaterDate(v) })}
            mono
            inputMode="numeric"
          />
        </Champ>
        <Champ label="Lieu de naissance">
          <Saisie
            valeur={brouillon.lieuNaissance}
            onChange={(v) => modifier({ lieuNaissance: v })}
            arabe
          />
        </Champ>
        <Champ label="Date d'émission">
          <Saisie
            valeur={brouillon.dateEmission}
            onChange={(v) => modifier({ dateEmission: formaterDate(v) })}
            mono
            inputMode="numeric"
          />
        </Champ>
        <Champ label="Date d'expiration">
          <Saisie
            valeur={brouillon.dateExpiration}
            onChange={(v) => modifier({ dateExpiration: formaterDate(v) })}
            mono
            inputMode="numeric"
          />
        </Champ>
        <Champ label="Pays d'émission">
          <Saisie
            valeur={brouillon.paysEmission}
            onChange={(v) => modifier({ paysEmission: v })}
            arabe
          />
        </Champ>
        <Champ label="Sexe">
          <Saisie valeur={brouillon.sexe} onChange={(v) => modifier({ sexe: v })} mono />
        </Champ>
        <Champ label="Zone de lecture optique (MRZ)" pleine>
          <textarea
            className="omra-input mono"
            dir="ltr"
            rows={3}
            value={brouillon.mrz}
            onChange={(evenement) => modifier({ mrz: evenement.target.value })}
          />
        </Champ>
      </div>
    </Dialogue>
  )
}
