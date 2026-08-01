'use client'

/**
 * Écran « Reçu » — la fiche d’un reçu.
 *
 * Reproduit la structure de référence : barre de retour et d'actions, bandeau
 * de montants, informations d’identité et de programme, versements enregistrés.
 *
 * L’aperçu imprimable du reçu papier appartient au lot L3 : cet écran expose
 * l'emplacement qui le recevra, sans le simuler.
 */

import { MAX_VERSEMENTS } from '../../domain/constants'
import { natureNormalisee } from '../../domain/payment-method'
import { motifRefusVersement } from '../../domain/rules/payment'
import { restantDu, statutAffiche, totalPaye } from '../../domain/rules/receipt'
import type { Recu, Saison } from '../../domain/types'
import { DateValeur, Montant, Reference, Telephone, TexteArabe } from '../bidi'

function libelleNature(valeur: string): string {
  const nature = natureNormalisee(valeur)
  if (nature === 'نقد') return 'Espèces'
  if (nature === 'شيك') return 'Chèque'
  if (nature === 'تحويل بنكي') return 'Virement'
  return '—'
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
  onRetour: () => void
  onDetail: () => void
  onVersement: () => void
  onModifier: () => void
  onAnnuler: () => void
}

export function EcranFiche({
  recu,
  saison,
  onRetour,
  onDetail,
  onVersement,
  onModifier,
  onAnnuler,
}: Proprietes) {
  const annule = recu.statut === 'ملغى'
  const paye = totalPaye(recu)
  const restant = restantDu(recu)
  const versementImpossible = Boolean(motifRefusVersement(recu))

  const situation = statutAffiche(recu)
  const libelleSituation =
    situation === 'ملغى' ? 'Annulé' : situation === 'مسدد' ? 'Soldé' : 'Incomplet'
  const classeSituation =
    situation === 'ملغى' ? 'annule' : situation === 'مسدد' ? 'solde' : 'incomplet'

  return (
    <div className="omra-page">
      <div className="omra-fiche-head">
        <button className="omra-back" onClick={onRetour}>
          ← Retour au registre
        </button>

        <div className="omra-actions" style={{ marginLeft: 'auto' }}>
          <button className="omra-action" onClick={onDetail}>
            Dossier complet
          </button>
          <button className="omra-action" onClick={onModifier} disabled={annule}>
            Modifier
          </button>
          <button className="omra-action" onClick={onVersement} disabled={versementImpossible}>
            Ajouter un versement
          </button>
          <button className="omra-action" onClick={onAnnuler} disabled={annule}>
            Annuler le reçu
          </button>
        </div>
      </div>

      <div className="omra-fiche-grid">
        <div className="omra-stat">
          <div className="omra-stat-label">Reçu</div>
          <div className="omra-stat-value">
            <Reference>{recu.numero}</Reference>
          </div>
        </div>
        <div className="omra-stat">
          <div className="omra-stat-label">Montant convenu</div>
          <div className="omra-stat-value">
            <Montant centimes={recu.convenuCentimes} />
          </div>
        </div>
        <div className="omra-stat">
          <div className="omra-stat-label">Total versé</div>
          <div className="omra-stat-value">
            <Montant centimes={paye} />
          </div>
        </div>
        <div className="omra-stat">
          <div className="omra-stat-label">Restant dû</div>
          <div
            className="omra-stat-value"
            style={{ color: restant === 0 ? 'var(--accent)' : 'var(--danger)' }}
          >
            <Montant centimes={restant} />
          </div>
        </div>
        <div className="omra-stat">
          <div className="omra-stat-label">Situation</div>
          <div className="omra-stat-value">
            <span className={`omra-pill ${classeSituation}`}>{libelleSituation}</span>
          </div>
        </div>
      </div>

      {annule ? (
        <div className="omra-errors" role="status">
          <strong>
            Reçu annulé — <TexteArabe>{recu.motifAnnulation}</TexteArabe>
          </strong>
          <span style={{ fontSize: 12, color: 'var(--danger)' }}>
            Remboursement {recu.modeRemboursement === 'cash' ? 'depuis la caisse' : 'hors caisse'} ·{' '}
            <Montant centimes={recu.montantRembourseCentimes ?? 0} />
          </span>
        </div>
      ) : null}

      <div className="omra-section">
        <h2>Voyageur</h2>
        <div className="omra-defs">
          <Definition label="Prénom et nom">
            <TexteArabe>{`${recu.prenom} ${recu.nom}`}</TexteArabe>
          </Definition>
          <Definition label="Téléphone">
            <Telephone>{recu.telephone}</Telephone>
          </Definition>
          <Definition label="Groupe">{recu.groupe || '—'}</Definition>
          <Definition label="Note">{recu.note || '—'}</Definition>
        </div>
      </div>

      <div className="omra-section">
        <h2>Programme</h2>
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
          <Definition label="Prix d’origine">
            <Montant centimes={recu.tarifCentimes} />
          </Definition>
          <Definition label="Réduction">
            <Montant centimes={recu.reductionCentimes} />
          </Definition>
        </div>
      </div>

      <div className="omra-section">
        <h2>
          Versements enregistrés — {recu.versements.length} / {MAX_VERSEMENTS}
        </h2>
        <table className="omra-mini-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Heure</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Référence</th>
              <th>Banque</th>
              <th>Payeur</th>
              <th>Restant après</th>
              <th>Employé</th>
            </tr>
          </thead>
          <tbody>
            {recu.versements.map((versement) => (
              <tr key={versement.id}>
                <td className="mono">{versement.rang}</td>
                <td>
                  <DateValeur>{versement.date}</DateValeur>
                </td>
                <td className="mono">{versement.heure}</td>
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
                <td>{versement.banque ? <TexteArabe>{versement.banque}</TexteArabe> : '—'}</td>
                <td>{versement.payeur ? <TexteArabe>{versement.payeur}</TexteArabe> : '—'}</td>
                <td>
                  <Montant centimes={versement.instantane.restantApresCentimes} />
                </td>
                <td>
                  <TexteArabe>{versement.enregistrePar}</TexteArabe>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="omra-hint" style={{ marginTop: 10 }}>
          Chaque versement conserve un instantané figé de la situation du reçu au moment de son
          enregistrement. Une modification ultérieure ne réécrit jamais cet historique.
        </p>
      </div>

      <div className="omra-section">
        <h2>Reçu papier</h2>
        <p className="omra-hint" style={{ margin: 0 }}>
          L&apos;aperçu imprimable, calé sur le papier à en-tête, sera ajouté au lot L3. Le compteur
          d&apos;impressions de ce reçu est actuellement à{' '}
          <Reference>{recu.impressions}</Reference>.
        </p>
      </div>
    </div>
  )
}
