'use client'

/**
 * Écran de connexion.
 *
 * Reproduit l'écran `login` du fichier de référence : marque, deux champs,
 * bouton d'entrée, message d'erreur et rappel des comptes d'essai.
 * Arabe, de droite à gauche, comme dans le fichier.
 */

import { useState } from 'react'

import type { Utilisateur } from '../../domain/types'
import { T } from '../textes'

interface Proprietes {
  onConnexion: (identifiant: string, motDePasse: string) => Promise<Utilisateur | null>
  /** Comptes d'essai affichés sous le formulaire, comme dans la référence. */
  comptesEssai: string[]
}

export function EcranConnexion({ onConnexion, comptesEssai }: Proprietes) {
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const entrer = async () => {
    setEnvoi(true)
    const utilisateur = await onConnexion(identifiant, motDePasse)
    setEnvoi(false)
    if (!utilisateur) {
      setErreur(T.connexion.erreur)
      setMotDePasse('')
    }
  }

  return (
    <div className="omra-login">
      <div className="omra-login-card">
        <div className="omra-login-brand">
          <div className="omra-logo" aria-hidden="true">
            ز
          </div>
          <div>
            <div className="omra-brand-name">{T.marque.nom}</div>
            <div className="omra-brand-sub">{T.marque.sousTitre}</div>
          </div>
        </div>

        {erreur ? (
          <div className="omra-login-erreur" role="alert">
            {erreur}
          </div>
        ) : null}

        <label className="omra-login-champ">
          <span>{T.connexion.utilisateur}</span>
          <input
            className="omra-input"
            value={identifiant}
            onChange={(evenement) => setIdentifiant(evenement.target.value)}
            onKeyDown={(evenement) => {
              if (evenement.key === 'Enter') void entrer()
            }}
          />
        </label>

        <label className="omra-login-champ">
          <span>{T.connexion.motDePasse}</span>
          <input
            className="omra-input"
            type="password"
            value={motDePasse}
            onChange={(evenement) => setMotDePasse(evenement.target.value)}
            onKeyDown={(evenement) => {
              if (evenement.key === 'Enter') void entrer()
            }}
          />
        </label>

        <button className="omra-btn primary omra-login-bouton" onClick={entrer} disabled={envoi}>
          {T.connexion.entrer}
        </button>

        <p className="omra-login-aide">
          {T.connexion.aideEssai}{' '}
          {comptesEssai.map((compte, index) => (
            <span key={compte}>
              {index > 0 ? ' · ' : ''}
              <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                {compte}
              </span>
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
