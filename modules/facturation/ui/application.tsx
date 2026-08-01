'use client'

/**
 * Coque de l'application de facturation.
 *
 * Porte l'en-tête global, la navigation, l’écran courant, les fenêtres modales
 * et les notifications. Aucune règle métier n’est décidée ici : toute écriture
 * passe par les actions serveur, qui appellent le noyau.
 *
 * R-87 — Mode sombre conservé d’une session à l'autre.
 * R-88 — Notification transitoire de 2 800 ms.
 * R-89 — La touche d'échappement ferme toute fenêtre (voir `Dialogue`).
 */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import type { EtatFacturation } from '../data/service'
import type { SaisieAnnulation } from '../domain/rules/cancellation'
import type { SaisieNouveauRecu } from '../domain/rules/create-receipt'
import type { SaisieModification } from '../domain/rules/edit-sections'
import type { Resultat } from '../domain/rules/errors'
import type { SaisieVersement } from '../domain/rules/payment'
import type { Recu } from '../domain/types'
import { EcranFiche } from './ecrans/fiche'
import { EcranRegistre } from './ecrans/registre'
import { ModaleAnnulation } from './modales/annulation'
import { ModaleDetail } from './modales/detail'
import { ModaleJournal } from './modales/journal'
import { ModaleModification } from './modales/modification'
import { ModaleNouveauRecu } from './modales/nouveau-recu'
import { ModaleVersement } from './modales/versement'
import { TexteArabe } from './bidi'
import { creerStoreModeSombre, DUREE_NOTIFICATION } from './preferences'
import './styles.css'

type Fenetre =
  | { type: 'aucune' }
  | { type: 'nouveau' }
  | { type: 'versement'; numero?: string }
  | { type: 'annulation'; recuId: string }
  | { type: 'modification'; recuId: string }
  | { type: 'detail'; recuId: string }
  | { type: 'journal' }

export interface ActionsFacturation {
  recharger: () => Promise<EtatFacturation>
  creerRecu: (
    saisie: SaisieNouveauRecu,
    confirme: boolean,
  ) => Promise<Resultat<{ recuId: string; numero: number }>>
  ajouterVersement: (
    saisie: SaisieVersement,
    confirme: boolean,
  ) => Promise<Resultat<{ recuId: string }>>
  annulerRecu: (recuId: string, saisie: SaisieAnnulation) => Promise<Resultat<null>>
  modifierRecu: (recuId: string, saisie: SaisieModification) => Promise<Resultat<null>>
}

export function ApplicationFacturation({
  etatInitial,
  actions,
}: {
  etatInitial: EtatFacturation
  actions: ActionsFacturation
}) {
  const [etat, setEtat] = useState(etatInitial)
  const [ecran, setEcran] = useState<{ nom: 'registre' } | { nom: 'fiche'; recuId: string }>({
    nom: 'registre',
  })
  const [fenetre, setFenetre] = useState<Fenetre>({ type: 'aucune' })
  const [notification, setNotification] = useState<{ texte: string; erreur: boolean } | null>(null)

  const [rechercheNom, setRechercheNom] = useState('')
  const [rechercheNumero, setRechercheNumero] = useState('')
  const [afficherAnnules, setAfficherAnnules] = useState(false)

  // R-87 — préférence d'affichage, conservée dans le stockage du navigateur.
  // Ce n’est pas une donnée métier : la base reste la seule source des données.
  // Le mode sombre vit hors de React : on s'y abonne au lieu de le recopier.
  const storeSombre = useMemo(
    () => creerStoreModeSombre(typeof window === 'undefined' ? null : window.localStorage),
    [],
  )
  const sombre = useSyncExternalStore(
    storeSombre.subscribe,
    storeSombre.lire,
    storeSombre.lireServeur,
  )

  // R-88
  const notifier = useCallback((texte: string, erreur = false) => {
    setNotification({ texte, erreur })
  }, [])

  useEffect(() => {
    if (!notification) return
    const minuteur = setTimeout(() => setNotification(null), DUREE_NOTIFICATION)
    return () => clearTimeout(minuteur)
  }, [notification])

  const rafraichir = useCallback(async () => {
    setEtat(await actions.recharger())
  }, [actions])

  const recuParId = (id: string): Recu | undefined => etat.recus.find((recu) => recu.id === id)

  const fermer = () => setFenetre({ type: 'aucune' })

  return (
    <div className={`omra${sombre ? ' sombre' : ''}`}>
      <header className="omra-header">
        <div className="omra-brand">
          <div className="omra-logo" aria-hidden="true">
            ز
          </div>
          <div>
            <div className="omra-brand-name">Zemzem Asfar</div>
            <div className="omra-brand-sub">Gestion de la Omra</div>
          </div>
        </div>

        <nav className="omra-nav" aria-label="Navigation principale">
          <button
            className={`omra-nav-item${ecran.nom !== 'fiche' ? ' active' : ''}`}
            onClick={() => setEcran({ nom: 'registre' })}
          >
            Reçus
          </button>
          <button className="omra-nav-item" disabled title="Lot L4">
            Finances
          </button>
          <button className="omra-nav-item" disabled title="Lot L6">
            Statistiques
          </button>
        </nav>

        <div className="omra-spacer" />

        <div className="omra-season">
          <span className="omra-season-dot" />
          <TexteArabe>{etat.saison.nom}</TexteArabe>
        </div>

        <button
          className="omra-icon-btn"
          title="Journal des opérations"
          onClick={() => setFenetre({ type: 'journal' })}
        >
          ⏱
        </button>

        <button
          className="omra-icon-btn"
          title={sombre ? 'Mode clair' : 'Mode sombre'}
          onClick={storeSombre.basculer}
        >
          {sombre ? '☀' : '☾'}
        </button>

        <div className="omra-user">
          <div className="omra-avatar">{etat.utilisateur?.initiales ?? '—'}</div>
          <div>
            <div className="omra-user-name">
              <TexteArabe>{etat.utilisateur?.nom ?? '—'}</TexteArabe>
            </div>
            <div className="omra-user-role">
              {etat.estAdministrateur ? 'Administrateur' : 'Caisse'}
            </div>
          </div>
        </div>
      </header>

      {etat.modeDemonstration ? (
        <div className="omra-demo-banner">
          Mode démonstration — données fictives en mémoire, remplaçables par la base réelle sans
          modifier le métier ni l&apos;interface.
        </div>
      ) : null}

      {ecran.nom === 'registre' ? (
        <EcranRegistre
          recus={etat.recus}
          saison={etat.saison}
          rechercheNom={rechercheNom}
          rechercheNumero={rechercheNumero}
          afficherAnnules={afficherAnnules}
          onRechercheNom={setRechercheNom}
          onRechercheNumero={setRechercheNumero}
          onAfficherAnnules={setAfficherAnnules}
          onNouveauRecu={() => setFenetre({ type: 'nouveau' })}
          onNouveauVersement={(numero) => setFenetre({ type: 'versement', numero })}
          onOuvrirDetail={(recu) => setFenetre({ type: 'detail', recuId: recu.id })}
          onOuvrirFiche={(recu) => setEcran({ nom: 'fiche', recuId: recu.id })}
          onAnnuler={(recu) => setFenetre({ type: 'annulation', recuId: recu.id })}
          onModifier={(recu) => setFenetre({ type: 'modification', recuId: recu.id })}
        />
      ) : null}

      {ecran.nom === 'fiche'
        ? (() => {
            const recu = recuParId(ecran.recuId)
            if (!recu) return null
            return (
              <EcranFiche
                recu={recu}
                saison={etat.saison}
                onRetour={() => setEcran({ nom: 'registre' })}
                onDetail={() => setFenetre({ type: 'detail', recuId: recu.id })}
                onVersement={() =>
                  setFenetre({ type: 'versement', numero: String(recu.numero) })
                }
                onModifier={() => setFenetre({ type: 'modification', recuId: recu.id })}
                onAnnuler={() => setFenetre({ type: 'annulation', recuId: recu.id })}
              />
            )
          })()
        : null}

      {fenetre.type === 'nouveau' ? (
        <ModaleNouveauRecu
          referentiels={{
            saison: etat.saison,
            hotels: etat.hotels,
            vols: etat.vols,
            chambres: etat.chambres,
            rabatteurs: etat.rabatteurs,
            tarifs: etat.tarifs,
          }}
          operations={etat.operations}
          recus={etat.recus}
          onFermer={fermer}
          onEnregistrer={async (saisie, confirme) => {
            const resultat = await actions.creerRecu(saisie, confirme)
            if (resultat.statut === 'ok') {
              await rafraichir()
              notifier(`Reçu ${resultat.valeur.numero} enregistré.`)
              setEcran({ nom: 'fiche', recuId: resultat.valeur.recuId })
            }
            return resultat
          }}
        />
      ) : null}

      {fenetre.type === 'versement' ? (
        <ModaleVersement
          recus={etat.recus}
          operations={etat.operations}
          numeroInitial={fenetre.numero}
          onFermer={fermer}
          onEnregistrer={async (saisie, confirme) => {
            const resultat = await actions.ajouterVersement(saisie, confirme)
            if (resultat.statut === 'ok') {
              await rafraichir()
              notifier('Versement enregistré.')
            }
            return resultat
          }}
        />
      ) : null}

      {fenetre.type === 'annulation'
        ? (() => {
            const recu = recuParId(fenetre.recuId)
            if (!recu) return null
            return (
              <ModaleAnnulation
                recu={recu}
                onFermer={fermer}
                onAnnuler={async (saisie) => {
                  const resultat = await actions.annulerRecu(recu.id, saisie)
                  if (resultat.statut === 'ok') {
                    await rafraichir()
                    notifier(
                      `Reçu ${recu.numero} annulé. Son numéro ne sera jamais réutilisé.`,
                    )
                    setEcran({ nom: 'registre' })
                  }
                  return resultat
                }}
              />
            )
          })()
        : null}

      {fenetre.type === 'modification'
        ? (() => {
            const recu = recuParId(fenetre.recuId)
            if (!recu) return null
            return (
              <ModaleModification
                recu={recu}
                referentiels={{
                  hotels: etat.hotels,
                  vols: etat.vols,
                  chambres: etat.chambres,
                  tarifs: etat.tarifs,
                }}
                onFermer={fermer}
                onEnregistrer={async (saisie) => {
                  const resultat = await actions.modifierRecu(recu.id, saisie)
                  if (resultat.statut === 'ok') {
                    await rafraichir()
                    notifier('Modification enregistrée avec son historique.')
                  }
                  return resultat
                }}
              />
            )
          })()
        : null}

      {fenetre.type === 'detail'
        ? (() => {
            const recu = recuParId(fenetre.recuId)
            if (!recu) return null
            return (
              <ModaleDetail
                recu={recu}
                saison={etat.saison}
                onFermer={fermer}
                onOuvrirFiche={() => {
                  setEcran({ nom: 'fiche', recuId: recu.id })
                  fermer()
                }}
              />
            )
          })()
        : null}

      {fenetre.type === 'journal' ? (
        <ModaleJournal entrees={etat.audit} onFermer={fermer} />
      ) : null}

      {notification ? (
        <div className={`omra-toast${notification.erreur ? ' erreur' : ''}`} role="status">
          {notification.texte}
        </div>
      ) : null}
    </div>
  )
}
