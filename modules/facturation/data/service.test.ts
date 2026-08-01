import { beforeEach, describe, expect, it } from 'vitest'

import { passeportVierge } from '../ui/modales/passeport'
import { instrumentVierge } from '../ui/instrument-panel'
import type { SaisieNouveauRecu } from '../domain/rules/create-receipt'
import { reinitialiserSourceDonnees } from './index'
import {
  acquitterAnomalies,
  ajouterVersement,
  annulerRecu,
  chargerEtat,
  creerRecu,
  enregistrerImpressionFinance,
  journalFinancier,
  modifierRecu,
} from './service'

/**
 * Tests d'intégration du service : noyau métier + adaptateur de démonstration.
 * Chaque test repart d'un état neuf.
 */
beforeEach(() => {
  reinitialiserSourceDonnees()
})

function nouveauRecu(partiel: Partial<SaisieNouveauRecu> = {}): SaisieNouveauRecu {
  return {
    prenom: 'نورة',
    nom: 'السوسي',
    telephone: '0611-22.33.44',
    hotel: 'منار الشروق',
    vol: 'الخطوط السعودية',
    chambre: '4',
    rabatteur: 'zemzem',
    reduction: '',
    groupeCoche: false,
    groupe: '',
    premierVersement: '12000',
    note: '',
    instrument: instrumentVierge(),
    passeport: null,
    ...partiel,
  }
}

describe('création d’un reçu de bout en bout', () => {
  it('enregistre le reçu et le rend visible dans l’état', async () => {
    const avant = await chargerEtat()
    const resultat = await creerRecu(nouveauRecu(), false)
    expect(resultat.statut).toBe('ok')

    const apres = await chargerEtat()
    expect(apres.recus).toHaveLength(avant.recus.length + 1)
  })

  it('R-11 — attribue le numéro suivant de la séquence', async () => {
    const premier = await creerRecu(nouveauRecu(), false)
    const second = await creerRecu(nouveauRecu(), false)
    expect(premier.statut).toBe('ok')
    expect(second.statut).toBe('ok')
    if (premier.statut !== 'ok' || second.statut !== 'ok') return
    expect(second.valeur.numero).toBe(premier.valeur.numero + 1)
  })

  it('remonte les erreurs du noyau sans rien enregistrer', async () => {
    const avant = await chargerEtat()
    const resultat = await creerRecu(nouveauRecu({ prenom: '', nom: '' }), false)
    expect(resultat.statut).toBe('erreurs')

    const apres = await chargerEtat()
    expect(apres.recus).toHaveLength(avant.recus.length)
  })

  it('R-13 — rattache le passeport saisi au reçu', async () => {
    const passeport = { ...passeportVierge(), prenom: 'نورة', nom: 'السوسي', numero: 'MA4827391' }
    const resultat = await creerRecu(nouveauRecu({ passeport }), false)
    expect(resultat.statut).toBe('ok')
    if (resultat.statut !== 'ok') return

    const etat = await chargerEtat()
    const cree = etat.recus.find((r) => r.id === resultat.valeur.recuId)
    expect(cree?.passeport?.numero).toBe('MA4827391')
  })

  it('R-90 — le passeport conserve ses onze champs et l’origine de la saisie', async () => {
    const passeport = {
      ...passeportVierge(),
      prenom: 'نورة',
      nom: 'السوسي',
      numero: 'MA4827391',
      nationalite: 'مغربية',
      dateNaissance: '14/03/1986',
      lieuNaissance: 'الدار البيضاء',
      dateEmission: '09/05/2023',
      dateExpiration: '08/05/2028',
      paysEmission: 'المغرب',
      sexe: 'M',
      mrz: 'P<MARALAOUI<<MOHAMED<AMINE',
      resultatBrut: { source: 'saisie-manuelle', recuLe: '2026-08-01' },
    }
    const resultat = await creerRecu(nouveauRecu({ passeport }), false)
    if (resultat.statut !== 'ok') throw new Error('création refusée')

    const etat = await chargerEtat()
    const cree = etat.recus.find((r) => r.id === resultat.valeur.recuId)
    expect(cree?.passeport?.nationalite).toBe('مغربية')
    expect(cree?.passeport?.mrz).toContain('P<MAR')
    // Aucune lecture automatique : l'origine reste une saisie manuelle.
    expect(cree?.passeport?.resultatBrut?.source).toBe('saisie-manuelle')
  })
})

describe('R-86 — journal d’audit', () => {
  it('trace la création, la plus récente en tête', async () => {
    await creerRecu(nouveauRecu(), false)
    const etat = await chargerEtat()
    expect(etat.audit[0].action).toBe('إنشاء')
  })

  it('trace le versement', async () => {
    const cree = await creerRecu(nouveauRecu(), false)
    if (cree.statut !== 'ok') throw new Error('création refusée')

    await ajouterVersement(
      {
        numeroRecu: String(cree.valeur.numero),
        montant: '3000',
        instrument: instrumentVierge(),
      },
      false,
    )
    const etat = await chargerEtat()
    expect(etat.audit[0].action).toBe('دفعة')
  })

  it('trace l’annulation et son mode de remboursement', async () => {
    const cree = await creerRecu(nouveauRecu(), false)
    if (cree.statut !== 'ok') throw new Error('création refusée')

    await annulerRecu(cree.valeur.recuId, {
      motif: 'إلغاء السفر',
      modeRemboursement: 'cash',
      motDePasse: 'verification',
    })
    const etat = await chargerEtat()
    expect(etat.audit[0].action).toBe('إلغاء')
    expect(etat.audit[0].detail).toContain('من الصندوق')
  })

  it('trace la modification avec son motif', async () => {
    const cree = await creerRecu(nouveauRecu(), false)
    if (cree.statut !== 'ok') throw new Error('création refusée')

    await modifierRecu(cree.valeur.recuId, {
      section: 'note',
      motif: 'précision demandée',
      prenom: 'نورة',
      nom: 'السوسي',
      telephone: '0611-22.33.44',
      hotel: 'منار الشروق',
      vol: 'الخطوط السعودية',
      chambre: '4',
      reduction: '0',
      groupeCoche: false,
      groupe: '',
      note: 'à rappeler',
      nature: 'نقد',
      reference: '',
      dateInstrument: '',
      banque: '',
      operationPartagee: false,
      payeur: '',
      montantOperation: '',
    })
    const etat = await chargerEtat()
    expect(etat.audit[0].action).toBe('تعديل')
    expect(etat.audit[0].detail).toContain('précision demandée')
  })
})

describe('annulation de bout en bout', () => {
  it('R-45, R-47 — conserve le reçu et crée le mouvement de caisse', async () => {
    const cree = await creerRecu(nouveauRecu(), false)
    if (cree.statut !== 'ok') throw new Error('création refusée')

    const resultat = await annulerRecu(cree.valeur.recuId, {
      motif: 'إلغاء السفر',
      modeRemboursement: 'cash',
      motDePasse: 'verification',
    })
    expect(resultat.statut).toBe('ok')

    const etat = await chargerEtat()
    const annule = etat.recus.find((r) => r.id === cree.valeur.recuId)
    expect(annule?.statut).toBe('ملغى')
    expect(annule?.versements).toHaveLength(1)
    expect(annule?.montantRembourseCentimes).toBe(1200000)
  })

  it('R-43 — refuse sans mot de passe', async () => {
    const cree = await creerRecu(nouveauRecu(), false)
    if (cree.statut !== 'ok') throw new Error('création refusée')

    const resultat = await annulerRecu(cree.valeur.recuId, {
      motif: 'test',
      modeRemboursement: 'cash',
      motDePasse: '',
    })
    expect(resultat.statut).toBe('erreurs')
  })
})

describe('versement de bout en bout', () => {
  it('R-20 — impose au sixième versement de solder exactement', async () => {
    const cree = await creerRecu(nouveauRecu({ premierVersement: '1000' }), false)
    if (cree.statut !== 'ok') throw new Error('création refusée')
    const numero = String(cree.valeur.numero)

    // Versements 2 à 5.
    for (let index = 0; index < 4; index += 1) {
      const ajout = await ajouterVersement(
        { numeroRecu: numero, montant: '1000', instrument: instrumentVierge() },
        false,
      )
      expect(ajout.statut).toBe('ok')
    }

    // Le sixième doit valoir exactement le restant : 26 000 − 5 000 = 21 000.
    const insuffisant = await ajouterVersement(
      { numeroRecu: numero, montant: '20000', instrument: instrumentVierge() },
      false,
    )
    expect(insuffisant.statut).toBe('erreurs')

    const exact = await ajouterVersement(
      { numeroRecu: numero, montant: '21000', instrument: instrumentVierge() },
      false,
    )
    expect(exact.statut).toBe('ok')

    // R-18 — un septième versement est impossible.
    const septieme = await ajouterVersement(
      { numeroRecu: numero, montant: '100', instrument: instrumentVierge() },
      false,
    )
    expect(septieme.statut).toBe('erreurs')
  })

  it('R-32 — demande confirmation puis accepte le dépassement partagé', async () => {
    const cree = await creerRecu(nouveauRecu({ premierVersement: '1000' }), false)
    if (cree.statut !== 'ok') throw new Error('création refusée')

    const partage = {
      numeroRecu: String(cree.valeur.numero),
      montant: '9000',
      instrument: {
        ...instrumentVierge(),
        nature: 'شيك',
        portee: 'shared' as const,
        sourceOperation: 'new' as const,
        reference: '4471182',
        dateInstrument: '02/07/2025',
        banque: 'البنك الشعبي',
        payeur: 'عبد الله',
        montantOperation: '5000',
      },
    }

    const premier = await ajouterVersement(partage, false)
    expect(premier.statut).toBe('confirmation-requise')

    const confirme = await ajouterVersement(partage, true)
    expect(confirme.statut).toBe('ok')
  })
})

describe('journal financier de bout en bout', () => {
  it('R-60 — présente les annulations à part des versements', async () => {
    const cree = await creerRecu(nouveauRecu(), false)
    if (cree.statut !== 'ok') throw new Error('création refusée')

    await annulerRecu(cree.valeur.recuId, {
      motif: 'إلغاء السفر',
      modeRemboursement: 'cash',
      motDePasse: 'verification',
    })

    const journal = await journalFinancier({ filtre: 'all' })

    // La ligne d'annulation est dans sa propre liste, jamais mêlée aux versements.
    expect(journal.annulations.some((a) => a.numeroRecu === cree.valeur.numero)).toBe(true)
    expect(journal.lignes.every((l) => l.recuId !== cree.valeur.recuId || l.badge === 'N')).toBe(true)
    expect(journal.nombreAnnulations).toBeGreaterThan(0)
  })

  it('R-57 — les espèces affichées sont nettes du remboursement', async () => {
    const avant = await journalFinancier({ filtre: 'all' })
    const cree = await creerRecu(nouveauRecu({ premierVersement: '5000' }), false)
    if (cree.statut !== 'ok') throw new Error('création refusée')

    const apresCreation = await journalFinancier({ filtre: 'all' })
    expect(apresCreation.totaux.especesBrutCentimes).toBe(
      avant.totaux.especesBrutCentimes + 500000,
    )

    await annulerRecu(cree.valeur.recuId, {
      motif: 'test',
      modeRemboursement: 'cash',
      motDePasse: 'verification',
    })

    const apresAnnulation = await journalFinancier({ filtre: 'all' })
    expect(apresAnnulation.totaux.remboursementsCentimes).toBe(
      avant.totaux.remboursementsCentimes + 500000,
    )
    expect(apresAnnulation.totaux.especesNettesCentimes).toBe(avant.totaux.especesNettesCentimes)
  })

  it('R-61, R-62 — enregistre une impression numérotée', async () => {
    const etat = await chargerEtat()
    const jour = etat.recus[0].date.split('/').reverse().join('-')

    const premiere = await enregistrerImpressionFinance(jour)
    // Journée ancienne : refusée pour un employé, acceptée pour un administrateur.
    if (premiere.statut === 'ok') {
      expect(premiere.valeur.numeroImpression).toBeGreaterThan(0)
    } else if (premiere.statut === 'erreurs') {
      expect(premiere.erreurs[0].code).toBe('impression-hors-periode-autorisee')
    }
  })

  it('R-65 — l’acquittement des anomalies est réservé à l’administrateur', async () => {
    const resultat = await acquitterAnomalies('2026-08-01')
    expect(resultat.statut).toBe('erreurs')
    if (resultat.statut !== 'erreurs') return
    expect(resultat.erreurs[0].code).toBe('acquittement-reserve-administrateur')
  })
})
