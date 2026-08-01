/**
 * Jeu de données de démonstration.
 *
 * ⚠️ ISOLATION — Ce fichier est le **seul** endroit du module contenant des
 * données fictives. Il n'est importé que par l'adaptateur de démonstration.
 * Aucun fichier de `domain/` ni d'`ui/` ne doit y faire référence.
 *
 * Les valeurs reprennent celles du fichier de référence pour rester réalistes.
 * Elles sont volontairement peu nombreuses au lot L0 : le jeu complet des 72
 * clients répartis sur trois journées sera généré au lot où les écrans
 * concernés seront construits.
 *
 * Les cas représentés sont ceux qui portent une règle :
 *  - espèces simple, soldé et non soldé ;
 *  - chèque unique avec image ;
 *  - virement partagé entre deux reçus, sans image ;
 *  - annulation avec sortie de caisse espèces ;
 *  - annulation sans sortie de caisse ;
 *  - reçu comportant plusieurs versements.
 */

import { construireJourneeVolumineuse } from './dataset-volume'
import type {
  Client,
  EntreeAudit,
  ImpressionFinance,
  MouvementCaisse,
  OperationPartagee,
  Recu,
  Versement,
} from '../../domain/types'

export interface JeuDemonstration {
  prochainNumero: number
  recus: Recu[]
  clients: Client[]
  operationsPartagees: OperationPartagee[]
  mouvementsCaisse: MouvementCaisse[]
  impressionsFinance: ImpressionFinance[]
  audit: EntreeAudit[]
}

/** Décale une date de `delta` jours et renvoie ses deux représentations. */
function jour(delta: number, reference: Date) {
  const d = new Date(reference)
  d.setDate(d.getDate() + delta)
  const annee = d.getFullYear()
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jourDuMois = String(d.getDate()).padStart(2, '0')
  return {
    cle: `${annee}-${mois}-${jourDuMois}`,
    fr: `${jourDuMois}/${mois}/${annee}`,
  }
}

interface OptionsVersement {
  rang: number
  montantCentimes: number
  nature: string
  date: string
  heure: string
  enregistrePar: string
  referenceInstrument?: string
  dateInstrument?: string
  banque?: string
  portee?: 'unique' | 'shared'
  operationPartageeId?: string
  payeur?: string
  montantOperationCentimes?: number
  instantane: Versement['instantane']
}

function versement(id: string, o: OptionsVersement): Versement {
  return {
    id,
    rang: o.rang,
    montantCentimes: o.montantCentimes,
    nature: o.nature,
    date: o.date,
    heure: o.heure,
    dateHeure: `${o.date} ${o.heure}`,
    enregistrePar: o.enregistrePar,
    referenceInstrument: o.referenceInstrument ?? '',
    dateInstrument: o.dateInstrument ?? '',
    banque: o.banque ?? '',
    portee: o.portee ?? 'unique',
    operationPartageeId: o.operationPartageeId ?? '',
    payeur: o.payeur ?? '',
    montantOperationCentimes: o.montantOperationCentimes ?? 0,
    image: null,
    instantane: o.instantane,
  }
}

/**
 * Construit le jeu de démonstration.
 *
 * @param reference Date servant d'« aujourd'hui ». Injectée pour que les tests
 *   soient déterministes et pour que la démonstration reste toujours actuelle.
 */
export function construireJeuDemonstration(reference: Date = new Date()): JeuDemonstration {
  const avantHier = jour(-2, reference)
  const hier = jour(-1, reference)
  const aujourdhui = jour(0, reference)

  const EMPLOYE = 'سمير بنعلي'
  const DIRECTEUR = 'المدير'

  const recus: Recu[] = []
  const clients: Client[] = []

  /** Fabrique un reçu et son client, et les enregistre. */
  function ajouterRecu(
    partiel: Omit<Recu, 'clientId' | 'passeport' | 'modifications' | 'impressions'> & {
      impressions?: number
    },
  ): Recu {
    const clientId = `CLI-DEMO-${String(partiel.numero).padStart(6, '0')}`
    const recu: Recu = {
      ...partiel,
      clientId,
      passeport: null,
      modifications: [],
      impressions: partiel.impressions ?? 0,
    }
    recus.push(recu)
    clients.push({
      id: clientId,
      nom: recu.nom,
      prenom: recu.prenom,
      photoUrl: '',
      passeport: null,
      creeLe: recu.creeLe,
      creePar: recu.employe,
      recuIds: [recu.id],
    })
    return recu
  }

  // --- Cas 1 : espèces, reçu non soldé -------------------------------------
  ajouterRecu({
    id: 'r-demo-262',
    numero: 262,
    prenom: 'سعيدة',
    nom: 'شقير',
    telephone: '0611-00.75.00',
    hotel: 'منار الشروق',
    vol: 'الخطوط السعودية',
    chambre: '4',
    tarifCentimes: 2600000,
    reductionCentimes: 0,
    convenuCentimes: 2600000,
    rabatteur: 'zemzem',
    groupe: '',
    note: '',
    date: avantHier.fr,
    creeLe: `${avantHier.fr} 09:15`,
    employe: EMPLOYE,
    statut: 'نشط',
    motifAnnulation: '',
    versements: [
      versement('p-demo-262-1', {
        rang: 1,
        montantCentimes: 1000000,
        nature: 'نقد',
        date: avantHier.fr,
        heure: '09:15',
        enregistrePar: EMPLOYE,
        instantane: {
          client: 'سعيدة شقير',
          hotel: 'منار الشروق',
          chambre: '4',
          vol: 'الخطوط السعودية',
          programme: 'منار الشروق / غرفة 4 / الخطوط السعودية',
          convenuCentimes: 2600000,
          rabatteur: 'zemzem',
          restantApresCentimes: 1600000,
          statutApres: '•',
        },
      }),
    ],
  })

  // --- Cas 2 : chèque unique, deux versements, soldé -----------------------
  ajouterRecu({
    id: 'r-demo-263',
    numero: 263,
    prenom: 'خديجة',
    nom: 'فهمي',
    telephone: '0622-10.40.31',
    hotel: 'رايا مبارك',
    vol: 'الخطوط السعودية',
    chambre: '3',
    tarifCentimes: 4050000,
    reductionCentimes: 100000,
    convenuCentimes: 3950000,
    rabatteur: 'صفية',
    groupe: '',
    note: '',
    date: avantHier.fr,
    creeLe: `${avantHier.fr} 10:02`,
    employe: EMPLOYE,
    statut: 'نشط',
    motifAnnulation: '',
    impressions: 2,
    versements: [
      versement('p-demo-263-1', {
        rang: 1,
        montantCentimes: 2000000,
        nature: 'شيك',
        date: avantHier.fr,
        heure: '10:02',
        enregistrePar: EMPLOYE,
        referenceInstrument: '4471182',
        dateInstrument: avantHier.fr,
        banque: 'البنك الشعبي',
        instantane: {
          client: 'خديجة فهمي',
          hotel: 'رايا مبارك',
          chambre: '3',
          vol: 'الخطوط السعودية',
          programme: 'رايا مبارك / غرفة 3 / الخطوط السعودية',
          convenuCentimes: 3950000,
          rabatteur: 'صفية',
          restantApresCentimes: 1950000,
          statutApres: '•',
        },
      }),
      versement('p-demo-263-2', {
        rang: 2,
        montantCentimes: 1950000,
        nature: 'نقد',
        date: hier.fr,
        heure: '11:30',
        enregistrePar: EMPLOYE,
        instantane: {
          client: 'خديجة فهمي',
          hotel: 'رايا مبارك',
          chambre: '3',
          vol: 'الخطوط السعودية',
          programme: 'رايا مبارك / غرفة 3 / الخطوط السعودية',
          convenuCentimes: 3950000,
          rabatteur: 'صفية',
          restantApresCentimes: 0,
          statutApres: '✓',
        },
      }),
    ],
  })

  // --- Cas 3 et 4 : virement partagé entre deux reçus ----------------------
  const operationPartagee: OperationPartagee = {
    id: 'SOP-DEMO-0001',
    nature: 'تحويل بنكي',
    reference: 'VIR-2026-0455',
    dateInstrument: hier.fr,
    banque: 'التجاري وفا بنك',
    payeur: 'عبد الله العثماني',
    montantTotalCentimes: 5000000,
    creeeLe: `${hier.fr} 14:05`,
    creeePar: EMPLOYE,
    statut: 'active',
    image: null,
  }

  ajouterRecu({
    id: 'r-demo-264',
    numero: 264,
    prenom: 'فاطمة',
    nom: 'بنعاشي',
    telephone: '0655-22.18.09',
    hotel: 'واحة احياد',
    vol: 'الخطوط السعودية',
    chambre: '4',
    tarifCentimes: 3850000,
    reductionCentimes: 0,
    convenuCentimes: 3850000,
    rabatteur: 'بن سليمان',
    groupe: 'FAM-OTHMANI',
    note: '',
    date: hier.fr,
    creeLe: `${hier.fr} 14:05`,
    employe: EMPLOYE,
    statut: 'نشط',
    motifAnnulation: '',
    versements: [
      versement('p-demo-264-1', {
        rang: 1,
        montantCentimes: 2500000,
        nature: 'تحويل بنكي',
        date: hier.fr,
        heure: '14:05',
        enregistrePar: EMPLOYE,
        referenceInstrument: operationPartagee.reference,
        dateInstrument: operationPartagee.dateInstrument,
        banque: operationPartagee.banque,
        portee: 'shared',
        operationPartageeId: operationPartagee.id,
        payeur: operationPartagee.payeur,
        montantOperationCentimes: operationPartagee.montantTotalCentimes,
        instantane: {
          client: 'فاطمة بنعاشي',
          hotel: 'واحة احياد',
          chambre: '4',
          vol: 'الخطوط السعودية',
          programme: 'واحة احياد / غرفة 4 / الخطوط السعودية',
          convenuCentimes: 3850000,
          rabatteur: 'بن سليمان',
          restantApresCentimes: 1350000,
          statutApres: '•',
        },
      }),
    ],
  })

  ajouterRecu({
    id: 'r-demo-265',
    numero: 265,
    prenom: 'محمد',
    nom: 'العلوي',
    telephone: '0655-22.18.10',
    hotel: 'واحة احياد',
    vol: 'الخطوط السعودية',
    chambre: '4',
    tarifCentimes: 3850000,
    reductionCentimes: 0,
    convenuCentimes: 3850000,
    rabatteur: 'بن سليمان',
    groupe: 'FAM-OTHMANI',
    note: '',
    date: hier.fr,
    creeLe: `${hier.fr} 14:12`,
    employe: EMPLOYE,
    statut: 'نشط',
    motifAnnulation: '',
    versements: [
      versement('p-demo-265-1', {
        rang: 1,
        montantCentimes: 2500000,
        nature: 'تحويل بنكي',
        date: hier.fr,
        heure: '14:12',
        enregistrePar: EMPLOYE,
        referenceInstrument: operationPartagee.reference,
        dateInstrument: operationPartagee.dateInstrument,
        banque: operationPartagee.banque,
        portee: 'shared',
        operationPartageeId: operationPartagee.id,
        payeur: operationPartagee.payeur,
        montantOperationCentimes: operationPartagee.montantTotalCentimes,
        instantane: {
          client: 'محمد العلوي',
          hotel: 'واحة احياد',
          chambre: '4',
          vol: 'الخطوط السعودية',
          programme: 'واحة احياد / غرفة 4 / الخطوط السعودية',
          convenuCentimes: 3850000,
          rabatteur: 'بن سليمان',
          restantApresCentimes: 1350000,
          statutApres: '•',
        },
      }),
    ],
  })

  // --- Cas 5 : annulation avec sortie de caisse espèces --------------------
  const annuleAvecCaisse = ajouterRecu({
    id: 'r-demo-266',
    numero: 266,
    prenom: 'خدوج',
    nom: 'مستوي',
    telephone: '0677-45.12.88',
    hotel: 'منار الشروق',
    vol: 'القطرية',
    chambre: '5',
    tarifCentimes: 2600000,
    reductionCentimes: 0,
    convenuCentimes: 2600000,
    rabatteur: 'بهي',
    groupe: '',
    note: 'DEMO — annulation avec remboursement espèces',
    date: hier.fr,
    creeLe: `${hier.fr} 09:40`,
    employe: EMPLOYE,
    statut: 'ملغى',
    motifAnnulation: 'إلغاء السفر',
    annulePar: EMPLOYE,
    annuleLe: `${hier.fr} 17:40`,
    modeRemboursement: 'cash',
    montantRembourseCentimes: 800000,
    versements: [
      versement('p-demo-266-1', {
        rang: 1,
        montantCentimes: 800000,
        nature: 'نقد',
        date: hier.fr,
        heure: '09:40',
        enregistrePar: EMPLOYE,
        instantane: {
          client: 'خدوج مستوي',
          hotel: 'منار الشروق',
          chambre: '5',
          vol: 'القطرية',
          programme: 'منار الشروق / غرفة 5 / القطرية',
          convenuCentimes: 2600000,
          rabatteur: 'بهي',
          restantApresCentimes: 1800000,
          statutApres: '•',
        },
      }),
    ],
  })

  // --- Cas 6 : annulation sans sortie de caisse ----------------------------
  ajouterRecu({
    id: 'r-demo-267',
    numero: 267,
    prenom: 'لبنى',
    nom: 'الطاهري',
    telephone: '0688-33.09.71',
    hotel: 'منار الشروق',
    vol: 'الخطوط السعودية',
    chambre: '6',
    tarifCentimes: 2400000,
    reductionCentimes: 0,
    convenuCentimes: 2400000,
    rabatteur: 'بن شريفة',
    groupe: '',
    note: 'DEMO — annulation sans sortie de caisse',
    date: aujourdhui.fr,
    creeLe: `${aujourdhui.fr} 10:20`,
    employe: DIRECTEUR,
    statut: 'ملغى',
    motifAnnulation: 'إلغاء قبل التحصيل البنكي',
    annulePar: DIRECTEUR,
    annuleLe: `${aujourdhui.fr} 15:10`,
    modeRemboursement: 'none',
    montantRembourseCentimes: 0,
    versements: [
      versement('p-demo-267-1', {
        rang: 1,
        montantCentimes: 900000,
        nature: 'شيك',
        date: aujourdhui.fr,
        heure: '10:20',
        enregistrePar: DIRECTEUR,
        referenceInstrument: '5580142',
        dateInstrument: aujourdhui.fr,
        banque: 'بنك المغرب',
        instantane: {
          client: 'لبنى الطاهري',
          hotel: 'منار الشروق',
          chambre: '6',
          vol: 'الخطوط السعودية',
          programme: 'منار الشروق / غرفة 6 / الخطوط السعودية',
          convenuCentimes: 2400000,
          rabatteur: 'بن شريفة',
          restantApresCentimes: 1500000,
          statutApres: '•',
        },
      }),
    ],
  })

  const mouvementsCaisse: MouvementCaisse[] = [
    {
      id: 'refund-demo-1',
      type: 'refund_cash',
      jour: hier.cle,
      date: hier.fr,
      heure: '17:40',
      montantCentimes: annuleAvecCaisse.montantRembourseCentimes ?? 0,
      recuNumero: annuleAvecCaisse.numero,
      client: `${annuleAvecCaisse.prenom} ${annuleAvecCaisse.nom}`,
      employe: EMPLOYE,
    },
  ]

  // Une impression sur la journée d'hier, afin que la détection d'anomalies
  // (R-63, R-64) ait une référence à comparer.
  const impressionsFinance: ImpressionFinance[] = [
    {
      id: 'fp-demo-1',
      jour: hier.cle,
      imprimeLe: `${hier.fr} 18:10`,
      employe: EMPLOYE,
      numeroImpression: 1,
      mouvementIds: ['p-demo-263-2', 'p-demo-264-1', 'p-demo-265-1', 'refund-demo-1'].sort(),
      nombreLignes: 4,
    },
  ]

  // --- Journée volumineuse : vérification de la pagination imprimée --------
  // Retirable en supprimant ce bloc et le fichier `dataset-volume.ts`.
  const volume = construireJourneeVolumineuse(avantHier.fr, EMPLOYE, 300)
  recus.push(...volume.recus)
  clients.push(...volume.clients)
  for (const recu of volume.recus) {
    if (recu.modeRemboursement !== 'cash') continue
    mouvementsCaisse.push({
      id: `refund-volume-${recu.numero}`,
      type: 'refund_cash',
      jour: avantHier.cle,
      date: avantHier.fr,
      heure: recu.annuleLe?.split(' ')[1] ?? '18:00',
      montantCentimes: recu.montantRembourseCentimes ?? 0,
      recuNumero: recu.numero,
      client: `${recu.prenom} ${recu.nom}`,
      employe: EMPLOYE,
    })
  }

  const audit: EntreeAudit[] = [
    {
      id: 'audit-demo-1',
      horodatage: `${aujourdhui.fr} 08:00`,
      action: 'Données de démonstration',
      detail: '6 reçus couvrant les cas métier caractéristiques, plus une journée de volume',
      utilisateur: 'Système',
    },
  ]

  return {
    prochainNumero: volume.prochainNumero,
    recus,
    clients,
    operationsPartagees: [operationPartagee],
    mouvementsCaisse,
    impressionsFinance,
    audit,
  }
}
