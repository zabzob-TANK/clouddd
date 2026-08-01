'use client'

/**
 * Fenêtre « Dossier complet du voyageur ».
 *
 * Reproduit la structure de référence : bandeau d’identité, montants, identité
 * et contact, programme, informations d’enregistrement, versements enregistrés,
 * historique des modifications et, le cas échéant, informations d’annulation.
 */

import { MAX_VERSEMENTS } from '../../domain/constants'
import { natureNormalisee } from '../../domain/payment-method'
import { restantDu, statutAffiche, totalPaye } from '../../domain/rules/receipt'
import type { Recu, Saison } from '../../domain/types'
import { Dialogue } from '../dialogue'
import { DateValeur, Montant, Reference, Telephone, TexteArabe } from '../bidi'
import { T } from '../textes'


function libelleNature(valeur: string): string {
  const nature = natureNormalisee(valeur)
  if (nature === 'نقد') return T.methodes.especes
  if (nature === 'شيك') return T.methodes.cheque
  if (nature === 'تحويل بنكي') return T.methodes.virement
  return '—'
}

/** Libellés français des statuts calculés. */
export function libelleStatut(recu: Recu): { texte: string; classe: string } {
  const statut = statutAffiche(recu)
  if (statut === 'ملغى') return { texte: T.statuts.annule, classe: 'annule' }
  if (statut === 'مسدد') return { texte: T.statuts.solde, classe: 'solde' }
  return { texte: T.statuts.incomplet, classe: 'incomplet' }
}

function Definition({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="omra-def-label">{label}</div>
      <div className="omra-def-value">{children}</div>
    </div>
  )
}

interface Proprietes {
  recu: Recu
  saison: Saison
  /** R-90 — portrait du passeport, s'il en existe un. */
  portrait?: string
  onFermer: () => void
  onOuvrirRecu: () => void
}

export function ModaleDetail({ recu, saison, portrait, onFermer, onOuvrirRecu }: Proprietes) {
  const statut = libelleStatut(recu)
  const paye = totalPaye(recu)
  const restant = restantDu(recu)

  return (
    <Dialogue
      titre={T.detail.titre}
      taille="large"
      onFermer={onFermer}
      entete={
        <>
          <span className={`omra-pill ${statut.classe}`}>{statut.texte}</span>
          <span className="omra-pill" style={{ background: '#F1F1EC', color: '#6E7565' }}>
            {recu.modifications.length
              ? T.detail.modifieNFois(recu.modifications.length)
              : T.detail.nonModifie}
          </span>
        </>
      }
      pied={
        <>
          <button className="omra-btn" onClick={onFermer}>
            {T.detail.fermer}
          </button>
          <button className="omra-btn primary" onClick={onOuvrirRecu}>
            {T.detail.voirRecu}
          </button>
        </>
      }
    >
      {/* Bande d'identité du fichier : photo, nom et contacts, numéro de reçu. */}
      <div className="detail-bande">
        <div className="detail-photo">
          {portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portrait} alt={T.passeport.alternativePortrait} />
          ) : (
            <div className="vide" aria-hidden="true">
              <svg
                fill="none"
                height="28"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.4"
                viewBox="0 0 24 24"
                width="28"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>
        <div className="detail-identite">
          <div className="nom">
            <TexteArabe>{`${recu.prenom} ${recu.nom}`}</TexteArabe>
          </div>
          <div className="lignes">
            <span>
              <Telephone>{recu.telephone}</Telephone>
            </span>
            <span>
              <TexteArabe>{recu.groupe || '—'}</TexteArabe>
            </span>
            <span>
              <TexteArabe>{saison.nom}</TexteArabe>
            </span>
          </div>
        </div>
        <div className="detail-numero">
          <div className="etiquette">{T.detail.numeroRecu}</div>
          <div className="valeur">{recu.numero}</div>
          <div className="date">{recu.date}</div>
          <div className="heure">{recu.creeLe.split(' ')[1] ?? ''}</div>
        </div>
      </div>

      <div className="omra-summary" style={{ marginTop: 0 }}>
        <div>
          <span>{T.registre.colonnes.numero}</span>
          <Reference>{recu.numero}</Reference>
        </div>
        <div>
          <span>{T.detail.prixOrigine}</span>
          <Montant centimes={recu.tarifCentimes} />
        </div>
        <div>
          <span>{T.registre.colonnes.reduction}</span>
          <Montant centimes={recu.reductionCentimes} />
        </div>
        <div>
          <span>{T.detail.convenu}</span>
          <Montant centimes={recu.convenuCentimes} />
        </div>
        <div>
          <span>{T.detail.paye}</span>
          <Montant centimes={paye} />
        </div>
        <div>
          <span>{T.detail.restant}</span>
          <Montant centimes={restant} />
        </div>
      </div>

      <div className="omra-panel">
        <h3>{T.detail.identiteContact}</h3>
        <div className="omra-defs">
          <Definition label={T.registre.colonnes.nom}>
            <TexteArabe>{`${recu.prenom} ${recu.nom}`}</TexteArabe>
          </Definition>
          <Definition label={T.detail.telephone}>
            <Telephone>{recu.telephone}</Telephone>
          </Definition>
          <Definition label={T.detail.passeport}>
            {/* Le fichier annonce l'état du passeport, pas un tiret. */}
            {recu.passeport ? (
              <span style={{ color: '#47593C' }}>
                <TexteArabe>{T.detail.passeportEnregistre}</TexteArabe>
                {recu.passeport.numero ? (
                  <>
                    {' — '}
                    <Reference>{recu.passeport.numero}</Reference>
                  </>
                ) : null}
              </span>
            ) : (
              <span style={{ color: '#9CA28F' }}>
                <TexteArabe>{T.detail.passeportAbsent}</TexteArabe>
              </span>
            )}
          </Definition>
          <Definition label={T.detail.groupe}>
            {recu.groupe || <span className="omra-cell-muted">—</span>}
          </Definition>
          <Definition label={T.detail.note}>
            {recu.note || <span className="omra-cell-muted">—</span>}
          </Definition>
        </div>
      </div>

      <div className="omra-panel">
        <h3>{T.detail.programme}</h3>
        <div className="omra-defs">
          <Definition label={T.detail.hotel}>
            <TexteArabe>{recu.hotel}</TexteArabe>
          </Definition>
          <Definition label={T.detail.chambre}>
            <Reference>{recu.chambre}</Reference>
          </Definition>
          <Definition label={T.detail.vol}>
            <TexteArabe>{recu.vol}</TexteArabe>
          </Definition>
          <Definition label={T.detail.rabatteur}>
            <TexteArabe>{recu.rabatteur}</TexteArabe>
          </Definition>
          <Definition label={T.detail.saison}>
            <TexteArabe>{saison.nom}</TexteArabe>
          </Definition>
          <Definition label=" ">
            <TexteArabe>{saison.duree}</TexteArabe>
          </Definition>
        </div>
      </div>

      <div className="omra-panel">
        <h3>{T.detail.infosEnregistrement}</h3>
        <div className="omra-defs">
          <Definition label={T.registre.colonnes.date}>
            <DateValeur>{recu.date}</DateValeur>
          </Definition>
          <Definition label={T.detail.employe}>
            <TexteArabe>{recu.employe}</TexteArabe>
          </Definition>
          <Definition label={T.detail.impression}>
            <Reference>{recu.impressions}</Reference>
          </Definition>
          <Definition label={T.registre.colonnes.nbVersements}>
            <Reference>{`${recu.versements.length} / ${MAX_VERSEMENTS}`}</Reference>
          </Definition>
          {recu.derniereModification ? (
            <Definition label={T.detail.derniereModification}>
              <DateValeur>{recu.derniereModification}</DateValeur>
            </Definition>
          ) : null}
          {recu.modifiePar ? (
            <Definition label={T.detail.modifiePar}>
              <TexteArabe>{recu.modifiePar}</TexteArabe>
            </Definition>
          ) : null}
        </div>
      </div>

      <div className="omra-panel">
        <h3>{T.detail.dfpEnregistrees}</h3>
        <table className="omra-mini-table">
          <thead>
            <tr>
              <th>{T.detail.colonnes.rang}</th>
              <th>{T.detail.colonnes.date}</th>
              <th>{T.detail.colonnes.montant}</th>
              <th>{T.detail.colonnes.document}</th>
              <th>{T.detail.colonnes.reference}</th>
              <th>{T.detail.colonnes.dateInstrument}</th>
              <th>{T.detail.colonnes.banque}</th>
              <th>{T.detail.colonnes.payeur}</th>
              <th>{T.detail.colonnes.montantOperation}</th>
            </tr>
          </thead>
          <tbody>
            {recu.versements.map((versement) => (
              <tr key={versement.id}>
                <td className="mono">{versement.rang}</td>
                <td>
                  <DateValeur>{versement.date}</DateValeur>
                </td>
                <td>
                  <Montant centimes={versement.montantCentimes} />
                </td>
                <td>{libelleNature(versement.nature)}</td>
                <td>
                  {versement.referenceInstrument ? (
                    <Reference>{versement.referenceInstrument}</Reference>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  {versement.dateInstrument ? (
                    <DateValeur>{versement.dateInstrument}</DateValeur>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  {versement.banque ? <TexteArabe>{versement.banque}</TexteArabe> : '—'}
                </td>
                <td>{versement.payeur ? <TexteArabe>{versement.payeur}</TexteArabe> : '—'}</td>
                <td>
                  {versement.montantOperationCentimes ? (
                    <Montant centimes={versement.montantOperationCentimes} />
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recu.modifications.length ? (
        <div className="omra-panel">
          <h3>{T.detail.journalModifications}</h3>
          {recu.modifications.map((modification) => (
            <div className="omra-log-entry" key={modification.id}>
              <div className="omra-log-head">
                <span className="omra-log-action">{modification.sectionLibelle}</span>
                <span className="omra-log-meta">
                  <DateValeur>{modification.dateHeure}</DateValeur> ·{' '}
                  <TexteArabe>{modification.employe}</TexteArabe>
                </span>
              </div>
              {modification.changements.map((changement, index) => (
                <div className="omra-log-detail" key={index}>
                  {changement.champ} : {changement.ancienne || '—'} → {changement.nouvelle || '—'}
                </div>
              ))}
              <div className="omra-log-detail" style={{ color: 'var(--muted)', marginTop: 4 }}>
                {T.detail.motifPrefixe} {modification.motif}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {recu.statut === 'ملغى' ? (
        <div className="omra-panel">
          <h3>{T.detail.infosAnnulation}</h3>
          <div className="omra-defs">
            <Definition label={T.detail.motif}>
              <TexteArabe>{recu.motifAnnulation}</TexteArabe>
            </Definition>
            <Definition label={T.detail.annulePar}>
              <TexteArabe>{recu.annulePar ?? '—'}</TexteArabe>
            </Definition>
            <Definition label={T.detail.dateAnnulation}>
              <DateValeur>{recu.annuleLe ?? '—'}</DateValeur>
            </Definition>
            <Definition label={T.annulation.modeRemboursement}>
              {recu.modeRemboursement === 'cash' ? T.annulation.depuisCaisse : T.annulation.horsCaisse}
            </Definition>
            <Definition label={T.annulation.montantPaye}>
              <Montant centimes={recu.montantRembourseCentimes ?? 0} />
            </Definition>
          </div>
        </div>
      ) : null}
    </Dialogue>
  )
}
