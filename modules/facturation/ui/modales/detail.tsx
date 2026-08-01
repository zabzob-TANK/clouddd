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

function libelleNature(valeur: string): string {
  const nature = natureNormalisee(valeur)
  if (nature === 'نقد') return 'Espèces'
  if (nature === 'شيك') return 'Chèque'
  if (nature === 'تحويل بنكي') return 'Virement'
  return '—'
}

/** Libellés français des statuts calculés. */
export function libelleStatut(recu: Recu): { texte: string; classe: string } {
  const statut = statutAffiche(recu)
  if (statut === 'ملغى') return { texte: 'Annulé', classe: 'annule' }
  if (statut === 'مسدد') return { texte: 'Soldé', classe: 'solde' }
  return { texte: 'Incomplet', classe: 'incomplet' }
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
  onFermer: () => void
  onOuvrirFiche: () => void
}

export function ModaleDetail({ recu, saison, onFermer, onOuvrirFiche }: Proprietes) {
  const statut = libelleStatut(recu)
  const paye = totalPaye(recu)
  const restant = restantDu(recu)

  return (
    <Dialogue
      titre="Dossier complet du voyageur"
      taille="large"
      onFermer={onFermer}
      entete={<span className={`omra-pill ${statut.classe}`}>{statut.texte}</span>}
      pied={
        <>
          <button className="omra-btn" onClick={onFermer}>
            Fermer
          </button>
          <button className="omra-btn primary" onClick={onOuvrirFiche}>
            Voir le reçu
          </button>
        </>
      }
    >
      <div className="omra-summary" style={{ marginTop: 0 }}>
        <div>
          <span>Reçu</span>
          <Reference>{recu.numero}</Reference>
        </div>
        <div>
          <span>Prix d’origine</span>
          <Montant centimes={recu.tarifCentimes} />
        </div>
        <div>
          <span>Réduction</span>
          <Montant centimes={recu.reductionCentimes} />
        </div>
        <div>
          <span>Montant convenu</span>
          <Montant centimes={recu.convenuCentimes} />
        </div>
        <div>
          <span>Payé</span>
          <Montant centimes={paye} />
        </div>
        <div>
          <span>Restant</span>
          <Montant centimes={restant} />
        </div>
      </div>

      <div className="omra-panel">
        <h3>Identité et contact</h3>
        <div className="omra-defs">
          <Definition label="Prénom et nom">
            <TexteArabe>{`${recu.prenom} ${recu.nom}`}</TexteArabe>
          </Definition>
          <Definition label="Téléphone">
            <Telephone>{recu.telephone}</Telephone>
          </Definition>
          <Definition label="Passeport">
            {recu.passeport?.numero ? (
              <Reference>{recu.passeport.numero}</Reference>
            ) : (
              <span className="omra-cell-muted">Non renseigné</span>
            )}
          </Definition>
          <Definition label="Groupe">
            {recu.groupe || <span className="omra-cell-muted">—</span>}
          </Definition>
          <Definition label="Note">
            {recu.note || <span className="omra-cell-muted">—</span>}
          </Definition>
        </div>
      </div>

      <div className="omra-panel">
        <h3>Programme</h3>
        <div className="omra-defs">
          <Definition label="Hôtel">
            <TexteArabe>{recu.hotel}</TexteArabe>
          </Definition>
          <Definition label="Chambre">
            <Reference>{recu.chambre}</Reference>
          </Definition>
          <Definition label="Vol">
            <TexteArabe>{recu.vol}</TexteArabe>
          </Definition>
          <Definition label="Intermédiaire">
            <TexteArabe>{recu.rabatteur}</TexteArabe>
          </Definition>
          <Definition label="Saison">
            <TexteArabe>{saison.nom}</TexteArabe>
          </Definition>
          <Definition label="Durée">
            <TexteArabe>{saison.duree}</TexteArabe>
          </Definition>
        </div>
      </div>

      <div className="omra-panel">
        <h3>Informations d’enregistrement</h3>
        <div className="omra-defs">
          <Definition label="Date d’enregistrement">
            <DateValeur>{recu.date}</DateValeur>
          </Definition>
          <Definition label="Employé">
            <TexteArabe>{recu.employe}</TexteArabe>
          </Definition>
          <Definition label="Impressions">
            <Reference>{recu.impressions}</Reference>
          </Definition>
          <Definition label="Versements">
            <Reference>{`${recu.versements.length} / ${MAX_VERSEMENTS}`}</Reference>
          </Definition>
          {recu.derniereModification ? (
            <Definition label="Dernière modification">
              <DateValeur>{recu.derniereModification}</DateValeur>
            </Definition>
          ) : null}
          {recu.modifiePar ? (
            <Definition label="Modifié par">
              <TexteArabe>{recu.modifiePar}</TexteArabe>
            </Definition>
          ) : null}
        </div>
      </div>

      <div className="omra-panel">
        <h3>Versements enregistrés</h3>
        <table className="omra-mini-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Référence</th>
              <th>Date instrument</th>
              <th>Banque</th>
              <th>Payeur</th>
              <th>Montant opération</th>
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
          <h3>Historique des modifications ({recu.modifications.length})</h3>
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
                Motif : {modification.motif}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {recu.statut === 'ملغى' ? (
        <div className="omra-panel">
          <h3>Informations d’annulation</h3>
          <div className="omra-defs">
            <Definition label="Motif">
              <TexteArabe>{recu.motifAnnulation}</TexteArabe>
            </Definition>
            <Definition label="Annulé par">
              <TexteArabe>{recu.annulePar ?? '—'}</TexteArabe>
            </Definition>
            <Definition label="Date d’annulation">
              <DateValeur>{recu.annuleLe ?? '—'}</DateValeur>
            </Definition>
            <Definition label="Mode de remboursement">
              {recu.modeRemboursement === 'cash' ? 'Depuis la caisse' : 'Hors caisse'}
            </Definition>
            <Definition label="Montant remboursé">
              <Montant centimes={recu.montantRembourseCentimes ?? 0} />
            </Definition>
          </div>
        </div>
      ) : null}
    </Dialogue>
  )
}
