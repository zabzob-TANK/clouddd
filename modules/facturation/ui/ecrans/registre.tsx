'use client'

/**
 * Écran « الوصل » — le registre des reçus.
 *
 * Structure, langue, orientation, colonnes et ordre repris du fichier de
 * référence : barre d'outils (actions, recherches, titre), puis un tableau
 * dense de vingt colonnes en arabe, de droite à gauche, avec en-têtes collants
 * et actions en fin de ligne.
 *
 * Les colonnes suivent exactement l'ordre du fichier :
 * رقم · الاسم / النسب · المبلغ المتفق عليه · مجموع الدفعات · الباقي ·
 * تاريخ التسجيل · عدد الدفعات · آخر دفعة · الطريقة · الحالة · الفندق ·
 * الغرفة · الرحلة · الوسيط · ملاحظة · الموظف · التخفيض · رقم الهاتف ·
 * المجموعة · الإجراءات
 */

import { MAX_VERSEMENTS } from '../../domain/constants'
import { codeCouleurNature, natureNormalisee } from '../../domain/payment-method'
import { motifRefusVersement } from '../../domain/rules/payment'
import { dernierVersement, restantDu, statutAffiche, totalPaye } from '../../domain/rules/receipt'
import type { Recu } from '../../domain/types'
import { DateValeur, Montant, Reference, Telephone, TexteArabe } from '../bidi'
import { T } from '../textes'

/** Libellé abrégé de la méthode, comme `receiptMethodDisplay()`. */
function libelleMethode(valeur: string): string {
  const nature = natureNormalisee(valeur)
  if (nature === 'نقد') return T.methodes.especes
  if (nature === 'شيك') return T.methodes.cheque
  if (nature === 'تحويل بنكي') return T.methodes.virement
  return '—'
}

function situation(recu: Recu): { texte: string; classe: string } {
  const valeur = statutAffiche(recu)
  if (valeur === 'ملغى') return { texte: T.statuts.annule, classe: 'annule' }
  if (valeur === 'مسدد') return { texte: T.statuts.solde, classe: 'solde' }
  return { texte: T.statuts.incomplet, classe: 'incomplet' }
}

interface Proprietes {
  recus: Recu[]
  rechercheNom: string
  rechercheNumero: string
  afficherAnnules: boolean
  onRechercheNom: (valeur: string) => void
  onRechercheNumero: (valeur: string) => void
  onAfficherAnnules: (valeur: boolean) => void
  onNouveauRecu: () => void
  onNouveauVersement: (numero?: string) => void
  onOuvrirDetail: (recu: Recu) => void
  onOuvrirRecu: (recu: Recu) => void
  onAnnuler: (recu: Recu) => void
  onModifier: (recu: Recu) => void
}

export function EcranRegistre({
  recus,
  rechercheNom,
  rechercheNumero,
  afficherAnnules,
  onRechercheNom,
  onRechercheNumero,
  onAfficherAnnules,
  onNouveauRecu,
  onNouveauVersement,
  onOuvrirDetail,
  onOuvrirRecu,
  onAnnuler,
  onModifier,
}: Proprietes) {
  const lignes = recus
    .filter((recu) => (afficherAnnules ? true : recu.statut !== 'ملغى'))
    .filter((recu) =>
      rechercheNom.trim() ? `${recu.prenom} ${recu.nom}`.includes(rechercheNom.trim()) : true,
    )
    .filter((recu) =>
      rechercheNumero.trim() ? String(recu.numero).includes(rechercheNumero.trim()) : true,
    )
    .sort((a, b) => b.numero - a.numero)

  const actifs = recus.filter((recu) => recu.statut !== 'ملغى').length
  const annules = recus.length - actifs
  const C = T.registre.colonnes

  return (
    <div className="omra-page">
      <div className="omra-tools">
        <div className="omra-actions">
          <button className="omra-action primary" onClick={onNouveauRecu}>
            {T.registre.nouveauRecu}
          </button>
          <button className="omra-action" onClick={() => onNouveauVersement()}>
            {T.registre.ajouterDfp}
          </button>
        </div>

        <div className="omra-searches">
          <div className="omra-search name">
            <label htmlFor="recherche-nom">{T.registre.rechercheNom}</label>
            <input
              id="recherche-nom"
              type="search"
              placeholder={T.registre.rechercher}
              value={rechercheNom}
              onChange={(evenement) => onRechercheNom(evenement.target.value)}
            />
          </div>
          <div className="omra-search receipt">
            <label htmlFor="recherche-numero">{T.registre.rechercheNumero}</label>
            <input
              id="recherche-numero"
              type="search"
              className="mono"
              dir="ltr"
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
            {T.registre.afficherAnnules}
          </label>
        </div>

        <div className="omra-title">
          <p>{T.registre.sousTitre(actifs, annules)}</p>
        </div>
      </div>

      <div className="omra-card">
        {lignes.length === 0 ? (
          <div className="omra-empty">
            <strong>{T.registre.videTitre}</strong>
            <span>{T.registre.videAide}</span>
          </div>
        ) : (
          <div className="omra-scroll">
            <table className="omra-table">
              <thead>
                <tr>
                  <th className="centre" style={{ width: 52 }}>
                    {C.numero}
                  </th>
                  <th style={{ width: 232 }}>{C.nom}</th>
                  <th className="centre">{C.convenu}</th>
                  <th className="centre">{C.paye}</th>
                  <th className="centre">{C.restant}</th>
                  <th className="centre">{C.date}</th>
                  <th className="centre">{C.nbVersements}</th>
                  <th className="centre">{C.derniereDfp}</th>
                  <th className="centre">{C.methode}</th>
                  <th>{C.statut}</th>
                  <th>{C.hotel}</th>
                  <th className="centre">{C.chambre}</th>
                  <th>{C.vol}</th>
                  <th>{C.rabatteur}</th>
                  <th className="secondaire">{C.note}</th>
                  <th className="secondaire">{C.employe}</th>
                  <th className="secondaire centre">{C.reduction}</th>
                  <th className="secondaire">{C.telephone}</th>
                  <th className="secondaire">{C.groupe}</th>
                  <th className="centre" style={{ width: 136 }}>
                    {C.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((recu) => {
                  const annule = recu.statut === 'ملغى'
                  const paye = totalPaye(recu)
                  const restant = restantDu(recu)
                  const dernier = dernierVersement(recu)
                  const etat = situation(recu)
                  const versementImpossible = Boolean(motifRefusVersement(recu))

                  return (
                    <tr
                      key={recu.id}
                      className={annule ? 'annule' : ''}
                      title={T.registre.infobulleLigne}
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
                            color: restant === 0 ? '#6E7565' : 'var(--danger)',
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
                        <span className="mono" style={{ fontWeight: 600 }} dir="ltr">
                          {recu.versements.length}
                          <span style={{ fontWeight: 400, color: '#6E7565', fontSize: 10.5 }}>
                            /{MAX_VERSEMENTS}
                          </span>
                        </span>
                      </td>
                      <td className="centre" style={{ color: '#7C8374' }}>
                        {dernier ? (
                          <Montant centimes={dernier.montantCentimes} avecDevise={false} />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="centre">
                        {dernier ? (
                          <span className={`omra-method ${codeCouleurNature(dernier.nature)}`}>
                            {libelleMethode(dernier.nature)}
                          </span>
                        ) : (
                          <span className="omra-method none">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`omra-pill ${etat.classe}`}>{etat.texte}</span>
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
                            title={T.registre.actionAnnuler}
                            disabled={annule}
                            onClick={() => onAnnuler(recu)}
                          >
                            ⨯
                          </button>
                          <button
                            className="omra-row-btn warn"
                            title={T.registre.actionModifier}
                            disabled={annule}
                            onClick={() => onModifier(recu)}
                          >
                            ✎
                          </button>
                          <button
                            className="omra-row-btn accent"
                            title={T.registre.actionDfp}
                            disabled={versementImpossible}
                            onClick={() => onNouveauVersement(String(recu.numero))}
                          >
                            +
                          </button>
                          <button
                            className="omra-row-btn accent"
                            title={T.registre.actionVoir}
                            onClick={() => onOuvrirRecu(recu)}
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
