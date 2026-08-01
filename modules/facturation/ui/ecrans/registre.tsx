'use client'

/**
 * Écran « Reçus » — le registre.
 *
 * Reproduit la structure de référence : barre d'outils (actions à gauche,
 * recherches, titre à droite), puis un grand tableau dense à colonnes fixes,
 * en-têtes collants et actions en fin de ligne.
 *
 * Les colonnes sont celles du fichier de référence, dans le même ordre :
 * numéro, nom, convenu, payé, restant, date, nombre de versements, dernier
 * versement, méthode, statut, hôtel, chambre, vol, intermédiaire, note,
 * employé, réduction, téléphone, groupe, actions.
 */

import { MAX_VERSEMENTS } from '../../domain/constants'
import { codeCouleurNature, natureNormalisee } from '../../domain/payment-method'
import { motifRefusVersement } from '../../domain/rules/payment'
import { dernierVersement, restantDu, statutAffiche, totalPaye } from '../../domain/rules/receipt'
import type { Recu, Saison } from '../../domain/types'
import { DateValeur, Montant, Reference, Telephone, TexteArabe } from '../bidi'

function libelleNature(valeur: string): string {
  const nature = natureNormalisee(valeur)
  if (nature === 'نقد') return 'Espèces'
  if (nature === 'شيك') return 'Chèque'
  if (nature === 'تحويل بنكي') return 'Virement'
  return '—'
}

function statut(recu: Recu): { texte: string; classe: string } {
  const valeur = statutAffiche(recu)
  if (valeur === 'ملغى') return { texte: 'Annulé', classe: 'annule' }
  if (valeur === 'مسدد') return { texte: 'Soldé', classe: 'solde' }
  return { texte: 'Incomplet', classe: 'incomplet' }
}

interface Proprietes {
  recus: Recu[]
  saison: Saison
  rechercheNom: string
  rechercheNumero: string
  afficherAnnules: boolean
  onRechercheNom: (valeur: string) => void
  onRechercheNumero: (valeur: string) => void
  onAfficherAnnules: (valeur: boolean) => void
  onNouveauRecu: () => void
  onNouveauVersement: (numero?: string) => void
  onOuvrirDetail: (recu: Recu) => void
  onOuvrirFiche: (recu: Recu) => void
  onAnnuler: (recu: Recu) => void
  onModifier: (recu: Recu) => void
}

export function EcranRegistre({
  recus,
  saison,
  rechercheNom,
  rechercheNumero,
  afficherAnnules,
  onRechercheNom,
  onRechercheNumero,
  onAfficherAnnules,
  onNouveauRecu,
  onNouveauVersement,
  onOuvrirDetail,
  onOuvrirFiche,
  onAnnuler,
  onModifier,
}: Proprietes) {
  const lignes = recus
    .filter((recu) => (afficherAnnules ? true : recu.statut !== 'ملغى'))
    .filter((recu) =>
      rechercheNom.trim()
        ? `${recu.prenom} ${recu.nom}`.includes(rechercheNom.trim())
        : true,
    )
    .filter((recu) =>
      rechercheNumero.trim() ? String(recu.numero).includes(rechercheNumero.trim()) : true,
    )
    .sort((a, b) => b.numero - a.numero)

  return (
    <div className="omra-page">
      <div className="omra-tools">
        <div className="omra-actions">
          <button className="omra-action primary" onClick={onNouveauRecu}>
            Nouveau reçu
          </button>
          <button className="omra-action" onClick={() => onNouveauVersement()}>
            Ajouter un versement
          </button>
        </div>

        <div className="omra-searches">
          <div className="omra-search name">
            <label htmlFor="recherche-nom">Nom</label>
            <input
              id="recherche-nom"
              type="search"
              placeholder="Rechercher…"
              dir="rtl"
              style={{ unicodeBidi: 'plaintext', textAlign: 'right' }}
              value={rechercheNom}
              onChange={(evenement) => onRechercheNom(evenement.target.value)}
            />
          </div>
          <div className="omra-search receipt">
            <label htmlFor="recherche-numero">Numéro de reçu</label>
            <input
              id="recherche-numero"
              type="search"
              className="mono"
              placeholder="N°"
              value={rechercheNumero}
              onChange={(evenement) =>
                onRechercheNumero(evenement.target.value.replace(/\D/g, ''))
              }
            />
          </div>
          <label className="omra-toggle">
            <input
              type="checkbox"
              checked={afficherAnnules}
              onChange={(evenement) => onAfficherAnnules(evenement.target.checked)}
            />
            Afficher les reçus annulés
          </label>
        </div>

        <div className="omra-title">
          <h1>Reçus</h1>
          <p>
            {lignes.length} reçu{lignes.length > 1 ? 's' : ''} · <TexteArabe>{saison.nom}</TexteArabe>
          </p>
        </div>
      </div>

      <div className="omra-card">
        {lignes.length === 0 ? (
          <div className="omra-empty">
            <strong>Aucun reçu ne correspond</strong>
            <span>Modifiez le nom ou le numéro dans la zone de recherche.</span>
          </div>
        ) : (
          <div className="omra-scroll">
            <table className="omra-table">
              <thead>
                <tr>
                  <th className="centre" style={{ width: 52 }}>
                    N°
                  </th>
                  <th style={{ width: 232 }}>Prénom / Nom</th>
                  <th className="centre">Montant convenu</th>
                  <th className="centre">Total versé</th>
                  <th className="centre">Restant</th>
                  <th className="centre">Date d&apos;enregistrement</th>
                  <th className="centre">Versements</th>
                  <th className="centre">Dernier versement</th>
                  <th className="centre">Méthode</th>
                  <th>Situation</th>
                  <th>Hôtel</th>
                  <th className="centre">Chambre</th>
                  <th>Vol</th>
                  <th>Intermédiaire</th>
                  <th className="secondaire">Note</th>
                  <th className="secondaire">Employé</th>
                  <th className="secondaire centre">Réduction</th>
                  <th className="secondaire">Téléphone</th>
                  <th className="secondaire">Groupe</th>
                  <th className="centre" style={{ width: 136 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((recu) => {
                  const annule = recu.statut === 'ملغى'
                  const paye = totalPaye(recu)
                  const restant = restantDu(recu)
                  const dernier = dernierVersement(recu)
                  const situation = statut(recu)
                  const versementImpossible = Boolean(motifRefusVersement(recu))

                  return (
                    <tr
                      key={recu.id}
                      className={annule ? 'annule' : ''}
                      title="Double-cliquez pour ouvrir le dossier complet"
                      onDoubleClick={() => onOuvrirDetail(recu)}
                    >
                      <td className="centre">
                        <Reference>{recu.numero}</Reference>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 13.5 }}>
                        <TexteArabe>{`${recu.prenom} ${recu.nom}`}</TexteArabe>
                      </td>
                      <td className="centre">
                        <Montant centimes={recu.convenuCentimes} avecDevise={false} />
                      </td>
                      <td className="centre">
                        <Montant centimes={paye} avecDevise={false} />
                      </td>
                      <td className="centre">
                        <span
                          style={{
                            color: restant === 0 ? 'var(--muted)' : 'var(--danger)',
                            fontWeight: restant === 0 ? 400 : 600,
                          }}
                        >
                          <Montant centimes={restant} avecDevise={false} />
                        </span>
                      </td>
                      <td className="centre">
                        <DateValeur>{recu.date}</DateValeur>
                      </td>
                      <td className="centre">
                        <span className="mono" style={{ fontWeight: 600 }}>
                          {recu.versements.length}
                          <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 10.5 }}>
                            /{MAX_VERSEMENTS}
                          </span>
                        </span>
                      </td>
                      <td className="centre" style={{ color: '#7c8374' }}>
                        {dernier ? (
                          <Montant centimes={dernier.montantCentimes} avecDevise={false} />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="centre">
                        {dernier ? (
                          <span className={`omra-method ${codeCouleurNature(dernier.nature)}`}>
                            {libelleNature(dernier.nature)}
                          </span>
                        ) : (
                          <span className="omra-method none">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`omra-pill ${situation.classe}`}>{situation.texte}</span>
                      </td>
                      <td>
                        <TexteArabe>{recu.hotel}</TexteArabe>
                      </td>
                      <td className="centre">
                        <Reference>{recu.chambre}</Reference>
                      </td>
                      <td>
                        <TexteArabe>{recu.vol}</TexteArabe>
                      </td>
                      <td>
                        <TexteArabe>{recu.rabatteur}</TexteArabe>
                      </td>
                      <td className="omra-cell-muted">
                        <span className="omra-note">{recu.note || '—'}</span>
                      </td>
                      <td className="omra-cell-muted">
                        <TexteArabe>{recu.employe}</TexteArabe>
                      </td>
                      <td className="omra-cell-muted centre">
                        <Montant centimes={recu.reductionCentimes} avecDevise={false} />
                      </td>
                      <td className="omra-cell-muted">
                        <Telephone>{recu.telephone}</Telephone>
                      </td>
                      <td className="omra-cell-muted">{recu.groupe || '—'}</td>
                      <td onDoubleClick={(evenement) => evenement.stopPropagation()}>
                        <div className="omra-row-actions">
                          <button
                            className="omra-row-btn danger"
                            title="Annuler le reçu"
                            disabled={annule}
                            onClick={() => onAnnuler(recu)}
                          >
                            ⨯
                          </button>
                          <button
                            className="omra-row-btn warn"
                            title="Modifier"
                            disabled={annule}
                            onClick={() => onModifier(recu)}
                          >
                            ✎
                          </button>
                          <button
                            className="omra-row-btn accent"
                            title="Ajouter un versement"
                            disabled={versementImpossible}
                            onClick={() => onNouveauVersement(String(recu.numero))}
                          >
                            +
                          </button>
                          <button
                            className="omra-row-btn accent"
                            title="Voir le reçu"
                            onClick={() => onOuvrirFiche(recu)}
                          >
                            ↗
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
