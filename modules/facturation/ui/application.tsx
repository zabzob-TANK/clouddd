'use client'

/**
 * Coque de l'application.
 *
 * Reproduit la navigation du fichier de référence : écran de connexion, puis
 * en-tête global (marque, navigation الوصل / المالية / الإحصائيات, saison,
 * journal, mode nuit, utilisateur, sortie) et l'écran courant.
 *
 * Langue et orientation par écran, conformes au fichier : les écrans de ce lot
 * sont en arabe, de droite à gauche.
 *
 * Aucune règle métier n'est décidée ici : toute écriture passe par les actions
 * serveur, qui appellent le noyau.
 *
 * R-87 — Mode sombre conservé d'une session à l'autre.
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
import { restantDu } from '../domain/rules/receipt'
import { centimesEnTexteDevise } from '../domain/money'
import type { Recu, Utilisateur } from '../domain/types'
import { cleJour, decalerCleJour } from '../domain/dates'
import type { JournalFinancier } from '../data/service'
import type { PeriodeFinance } from '../domain/rules/finance-day'
import { EcranConnexion } from './ecrans/connexion'
import { EcranFinance } from './ecrans/finance'
import { EcranRecu } from './ecrans/recu'
import { EcranRegistre } from './ecrans/registre'
import { EcranStatistiques } from './ecrans/statistiques'
import { ModaleAnnulation } from './modales/annulation'
import { ModaleAnomalieFinance } from './modales/anomalie-finance'
import { ModaleDetail } from './modales/detail'
import { ModaleJournal } from './modales/journal'
import { ModaleModification } from './modales/modification'
import { ModaleNouveauRecu } from './modales/nouveau-recu'
import { ModaleVersement } from './modales/versement'
import { TexteArabe } from './bidi'
import { creerStoreModeSombre, DUREE_NOTIFICATION } from './preferences'
import { T } from './textes'
import './styles.css'

type Ecran =
  | { nom: 'registre' }
  | { nom: 'recu'; recuId: string }
  | { nom: 'statistiques' }
  | { nom: 'finance' }

type Fenetre =
  | { type: 'aucune' }
  | { type: 'nouveau' }
  | { type: 'versement'; numero?: string }
  | { type: 'annulation'; recuId: string }
  | { type: 'modification'; recuId: string }
  | { type: 'detail'; recuId: string }
  | { type: 'journal' }
  | { type: 'anomalieFinance' }

export interface ActionsFacturation {
  connecter: (identifiant: string, motDePasse: string) => Promise<Utilisateur | null>
  deconnecter: () => Promise<void>
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
  enregistrerImpression: (recuId: string) => Promise<Resultat<null>>
  journalFinancier: (periode: PeriodeFinance) => Promise<JournalFinancier>
  enregistrerImpressionFinance: (jour: string) => Promise<Resultat<{ numeroImpression: number }>>
  acquitterAnomalies: (jour: string) => Promise<Resultat<null>>
}

export function ApplicationFacturation({
  etatInitial,
  actions,
  comptesEssai,
}: {
  etatInitial: EtatFacturation
  actions: ActionsFacturation
  /** Comptes d'essai affichés sur l'écran de connexion, comme dans la référence. */
  comptesEssai: string[]
}) {
  const [etat, setEtat] = useState(etatInitial)
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [ecran, setEcran] = useState<Ecran>({ nom: 'registre' })
  const [fenetre, setFenetre] = useState<Fenetre>({ type: 'aucune' })
  // R-85 — un reçu ouvert juste après sa création est l'original ; rouvert
  // ensuite, le fichier de référence le marque « نسخة ».
  const [recuOriginal, setRecuOriginal] = useState<string | null>(null)
  const [journal, setJournal] = useState<JournalFinancier | null>(null)
  const [periodeFinance, setPeriodeFinance] = useState<PeriodeFinance>({ filtre: 'day' })
  const [notification, setNotification] = useState<{ texte: string; erreur: boolean } | null>(null)

  const [rechercheNom, setRechercheNom] = useState('')
  const [rechercheNumero, setRechercheNumero] = useState('')
  const [afficherAnnules, setAfficherAnnules] = useState(false)

  // R-87 — préférence d'affichage, hors de React, dans le stockage du navigateur.
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

  const aujourdhui = cleJour(new Date())
  const hier = decalerCleJour(aujourdhui, -1)

  const chargerJournal = useCallback(
    async (periode: PeriodeFinance) => {
      const resolue = periode.filtre === 'day' && !periode.jour ? { ...periode, jour: aujourdhui } : periode
      setPeriodeFinance(resolue)
      setJournal(await actions.journalFinancier(resolue))
    },
    [actions, aujourdhui],
  )

  const recuParId = (id: string): Recu | undefined => etat.recus.find((recu) => recu.id === id)
  const fermer = () => setFenetre({ type: 'aucune' })

  const classeRacine = `omra${sombre ? ' sombre' : ''}`

  // ---- Écran de connexion, conservé comme dans le fichier de référence.
  if (!utilisateur) {
    return (
      <div className={classeRacine}>
        <EcranConnexion
          comptesEssai={comptesEssai}
          onConnexion={async (identifiant, motDePasse) => {
            const connecte = await actions.connecter(identifiant, motDePasse)
            if (connecte) {
              setUtilisateur(connecte)
              await rafraichir()
            }
            return connecte
          }}
        />
      </div>
    )
  }

  const estAdministrateur = etat.estAdministrateur

  // Le fichier de référence n'affiche pas l'en-tête global sur l'écran du reçu :
  // celui-ci occupe toute la page, avec sa propre barre d'outils.
  if (ecran.nom === 'recu') {
    const recuAffiche = recuParId(ecran.recuId)
    if (recuAffiche) {
      return (
        <div className={classeRacine}>
          <EcranRecu
            recu={recuAffiche}
            original={recuOriginal === recuAffiche.id}
            onRetour={() => setEcran({ nom: 'registre' })}
            onImpression={() => {
              void actions.enregistrerImpression(recuAffiche.id).then(rafraichir)
            }}
          />
        </div>
      )
    }
  }

  return (
    <div className={classeRacine}>
      <header className="omra-header">
        <div className="omra-brand">
          <div className="omra-logo" aria-hidden="true">
            ز
          </div>
          <div>
            <div className="omra-brand-name">{T.marque.nom}</div>
            <div className="omra-brand-sub">{T.marque.sousTitre}</div>
          </div>
        </div>

        <nav className="omra-nav" aria-label={T.navigation.recu}>
          <button
            className={`omra-nav-item${ecran.nom === 'registre' || ecran.nom === 'recu' ? ' active' : ''}`}
            onClick={() => setEcran({ nom: 'registre' })}
          >
            {T.navigation.recu}
          </button>
          <button
            className={`omra-nav-item${ecran.nom === 'finance' ? ' active' : ''}`}
            onClick={() => {
              setEcran({ nom: 'finance' })
              void chargerJournal(periodeFinance)
            }}
          >
            {T.navigation.finance}
          </button>
          <button
            className={`omra-nav-item${ecran.nom === 'statistiques' ? ' active' : ''}`}
            onClick={() => setEcran({ nom: 'statistiques' })}
          >
            {T.navigation.statistiques}
          </button>
        </nav>

        <div className="omra-spacer" />

        <div className="omra-season">
          <span className="omra-season-dot" />
          <TexteArabe>{T.saisonActive(etat.saison.nom)}</TexteArabe>
        </div>

        <button
          className="omra-icon-btn"
          title={T.navigation.journal}
          onClick={() => setFenetre({ type: 'journal' })}
        >
          ⏱
        </button>

        <div className="omra-user">
          <div className="omra-avatar">{utilisateur.initiales}</div>
          <div>
            <div className="omra-user-name">
              <TexteArabe>{utilisateur.nom}</TexteArabe>
            </div>
            <div className="omra-user-role">
              <TexteArabe>{utilisateur.role}</TexteArabe>
            </div>
          </div>
          <button
            className="omra-icon-btn"
            title={T.navigation.sortie}
            onClick={async () => {
              await actions.deconnecter()
              setUtilisateur(null)
              setEcran({ nom: 'registre' })
              setFenetre({ type: 'aucune' })
            }}
          >
            ⏻
          </button>
          <button
            className="omra-icon-btn omra-no-print"
            title={sombre ? T.navigation.modeJour : T.navigation.modeNuit}
            onClick={storeSombre.basculer}
          >
            {sombre ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {ecran.nom === 'registre' ? (
        <EcranRegistre
          recus={etat.recus}
          rechercheNom={rechercheNom}
          rechercheNumero={rechercheNumero}
          afficherAnnules={afficherAnnules}
          onRechercheNom={setRechercheNom}
          onRechercheNumero={setRechercheNumero}
          onAfficherAnnules={setAfficherAnnules}
          onNouveauRecu={() => setFenetre({ type: 'nouveau' })}
          onNouveauVersement={(numero) => setFenetre({ type: 'versement', numero })}
          onOuvrirDetail={(recu) => setFenetre({ type: 'detail', recuId: recu.id })}
          onOuvrirRecu={(recu) => setEcran({ nom: 'recu', recuId: recu.id })}
          onAnnuler={(recu) => setFenetre({ type: 'annulation', recuId: recu.id })}
          onModifier={(recu) => setFenetre({ type: 'modification', recuId: recu.id })}
        />
      ) : null}

      {ecran.nom === 'statistiques' ? <EcranStatistiques /> : null}

      {ecran.nom === 'finance' && journal ? (
        <EcranFinance
          journal={journal}
          aujourdhui={aujourdhui}
          hier={hier}
          onPeriode={(periode) => void chargerJournal(periode)}
          onImprimer={async () => {
            if (!journal.jourSelectionne) {
              notifier('اختر يوماً واحداً للطباعة.', true)
              return
            }
            const resultat = await actions.enregistrerImpressionFinance(journal.jourSelectionne)
            if (resultat.statut !== 'ok') {
              notifier('يمكن للموظف طباعة اليوم أو أمس فقط.', true)
              return
            }
            await chargerJournal(periodeFinance)
            // R-67 — A4 paysage, marge 5 mm, posée le temps de l'impression.
            const style = document.createElement('style')
            style.textContent = '@page{size:A4 landscape;margin:5mm}'
            document.head.appendChild(style)
            document.body.classList.add('finance-impression')
            window.print()
            document.body.classList.remove('finance-impression')
            style.remove()
          }}
          onAcquitter={() => setFenetre({ type: 'anomalieFinance' })}
          onOuvrirDetail={(recuId) => setFenetre({ type: 'detail', recuId })}
        />
      ) : null}

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
              notifier(`تم حفظ الوصل رقم ${resultat.valeur.numero}`)
              setRecuOriginal(resultat.valeur.recuId)
              setEcran({ nom: 'recu', recuId: resultat.valeur.recuId })
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
              const suivant = await actions.recharger()
              setEtat(suivant)
              const cible = suivant.recus.find((r) => r.id === resultat.valeur.recuId)
              const reste = cible ? restantDu(cible) : 0
              // Message du fichier de référence, selon que le reçu est soldé ou non.
              notifier(
                reste === 0
                  ? `تم — الوصل ${cible?.numero ?? ''} مسدد بالكامل`
                  : `تم تسجيل الدفعة — الباقي ${centimesEnTexteDevise(reste)}`,
              )
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
                    notifier(`تم إلغاء الوصل ${recu.numero}. الرقم لن يُستعمل مجددًا.`)
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
                    notifier('تم حفظ التعديل مع الاحتفاظ بالتاريخ الكامل.')
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
                onOuvrirRecu={() => {
                  setEcran({ nom: 'recu', recuId: recu.id })
                  fermer()
                }}
              />
            )
          })()
        : null}

      {fenetre.type === 'anomalieFinance' && journal ? (
        <ModaleAnomalieFinance
          nombre={journal.anomaliesEnAttente.length}
          jour={journal.libellePeriode}
          onFermer={fermer}
          onConfirmer={async () => {
            if (!journal.jourSelectionne) return
            const resultat = await actions.acquitterAnomalies(journal.jourSelectionne)
            if (resultat.statut === 'ok') {
              await chargerJournal(periodeFinance)
              await rafraichir()
            }
            fermer()
          }}
        />
      ) : null}

      {fenetre.type === 'journal' ? (
        <ModaleJournal entrees={etat.audit} onFermer={fermer} />
      ) : null}

      {notification ? (
        <div className={`omra-toast${notification.erreur ? ' erreur' : ''}`} role="status">
          {notification.texte}
        </div>
      ) : null}

      {/* `estAdministrateur` conditionnera les actions réservées à la direction
          dans les lots L4 et L5 (impression du journal, suppression d'image). */}
      <span hidden data-administrateur={estAdministrateur} />
    </div>
  )
}
