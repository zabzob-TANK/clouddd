import { dateKey, getTarif, nowStr } from './helpers'
import type { Db, Recu, Snapshot, Versement } from './types'

/** Jeu de démonstration du prototype : 50 personnes réparties sur trois jours. */
export function seed(): Db {
  const day = (delta: number) => {
    const d = new Date()
    d.setDate(d.getDate() + delta)
    return { key: dateKey(d), fr: d.toLocaleDateString('fr-FR') }
  }
  const days = [day(-2), day(-1), day(0)]
  const people: [string, string][] = [
    ['سعيدة', 'شقير'],
    ['خديجة', 'فهمي'],
    ['فاطمة', 'بنعاشي'],
    ['محمد', 'العلوي'],
    ['خدوج', 'مستوي'],
    ['مباركة', 'الإدريسي'],
    ['لبنى', 'الطاهري'],
    ['الزوهرة', 'طنين'],
    ['إسماعيل', 'الأنواري'],
    ['نادية', 'المرابط'],
    ['حسن', 'المودن'],
    ['مريم', 'السباعي'],
    ['أمينة', 'بوزيان'],
    ['عبد الرحيم', 'المنصوري'],
    ['سميرة', 'العماري'],
    ['يوسف', 'الكتاني'],
    ['نعيمة', 'الوردي'],
    ['عائشة', 'بناني'],
    ['رشيد', 'الحسني'],
    ['صفاء', 'الزهراء'],
    ['عبد الله', 'العثماني'],
    ['حياة', 'الناصري'],
    ['سلوى', 'الحداد'],
    ['كمال', 'الشرقاوي'],
    ['زينب', 'الفقير'],
    ['حمزة', 'العلوي'],
    ['كوثر', 'العلمي'],
    ['سناء', 'الرباطي'],
    ['مصطفى', 'البركاني'],
    ['إلهام', 'الداودي'],
    ['نجاة', 'المراكشي'],
    ['جمال', 'الصديقي'],
    ['رقية', 'الأمين'],
    ['طارق', 'الوزاني'],
    ['وفاء', 'الحاجي'],
    ['يونس', 'الخمليشي'],
    ['ابتسام', 'العرجوني'],
    ['عمر', 'الفاسي'],
    ['نورة', 'السوسي'],
    ['أيوب', 'المغربي'],
    ['هاجر', 'التازي'],
    ['خالد', 'بن جلون'],
    ['حنان', 'بلمقدم'],
    ['أنس', 'الركراكي'],
    ['مليكة', 'البقالي'],
    ['سفيان', 'الإدريسي'],
    ['دنيا', 'المريني'],
    ['سعيد', 'أمزيان'],
    ['شيماء', 'العروسي'],
    ['مهدي', 'بن عمر'],
  ]
  const hotels = ['منار الشروق', 'رايا مبارك', 'واحة احياد'],
    flights = ['الخطوط السعودية', 'القطرية'],
    rooms = ['2', '3', '4', '5', '6']
  const rabs = ['zemzem', 'صفية', 'بن سليمان', 'بن شريفة', 'بهي'],
    emps = ['سمير بنعلي', 'عادل المريني']
  const receipts: Recu[] = [],
    paymentsByDay: string[][] = [[], [], []]
  let nextNo = 262
  const makePay = (
    r: Recu,
    idx: number,
    amount: number,
    mode: string,
    date: string,
    time: string,
    extra: Partial<Versement> = {},
  ): Versement => {
    const paidBefore = (r.vers || []).reduce((s, v) => s + v.montant, 0),
      remaining = Math.max(0, r.convenu - paidBefore - amount)
    const p: Versement = {
      id: 'p_' + r.numero + '_' + idx + '_' + date.replace(/\D/g, ''),
      n: idx,
      montant: amount,
      mode,
      date,
      heure: time,
      dateHeure: date + ' ' + time,
      cn: extra.cn || '',
      cd: extra.cd || '',
      cb: extra.cb || '',
      par: extra.par || r.employe,
      qui: extra.qui || '',
      colAmt: extra.colAmt || 0,
      sharedOperationId: extra.sharedOperationId || '',
      snapshot: {} as Snapshot,
    }
    p.snapshot = {
      client: r.prenom + ' ' + r.nom,
      hotel: r.hotel,
      room: r.chambre,
      flight: r.vol,
      program: r.hotel + ' / غرفة ' + r.chambre + ' / ' + r.vol,
      agreed: r.convenu,
      rabatteur: r.rabatteur,
      remainingAfter: remaining,
      statusAfter: remaining === 0 ? '✓' : '•',
    }
    r.vers.push(p)
    return p
  }
  people.forEach((person, i) => {
    const di = i < 16 ? 0 : i < 33 ? 1 : 2,
      d = days[di],
      h = hotels[i % 3],
      vol = flights[i % 2],
      room = rooms[i % rooms.length],
      tar = getTarif(h, vol, room) || (24000 + (i % 5) * 2500) * 100,
      red = (i % 7 === 0 ? 1000 : 0) * 100,
      convenu = tar - red
    const r: Recu = {
      id: 'r_demo_' + (i + 1),
      numero: nextNo++,
      clientId: '',
      passport: null,
      prenom: person[0],
      nom: person[1],
      tel: '06' + String(11000000 + i * 137).padStart(8, '0').slice(-8),
      hotel: h,
      vol,
      chambre: room,
      tarif: tar,
      reduction: red,
      convenu,
      rabatteur: rabs[i % rabs.length],
      groupe: i % 9 === 0 ? 'GRP-2027-' + String(i + 1).padStart(4, '0') : '',
      date: d.fr,
      heure: '',
      employe: emps[i % 2],
      statut: 'نشط',
      motif: '',
      note: '',
      impressions: 0,
      modifications: [],
      vers: [],
    }
    const localIndex = di === 0 ? i : di === 1 ? i - 16 : i - 33,
      mins = localIndex * 22,
      hh = String(9 + Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0')
    const mode = i % 6 === 0 ? 'تحويل بنكي' : i % 3 === 0 ? 'شيك' : 'نقد'
    let amount = Math.min(convenu, (5000 + (i % 7) * 1500) * 100)
    if (i % 13 === 0) amount = convenu
    const extra: Partial<Versement> = { par: r.employe }
    if (mode === 'شيك') {
      extra.cn = 'CH' + String(7000 + i)
      extra.cd = d.fr
      extra.cb = ['CIH', 'التجاري وفا', 'BMCE'][i % 3]
    }
    if (mode === 'تحويل بنكي') {
      extra.cn = 'VIR-' + String(202700 + i)
      extra.cd = d.fr
      extra.cb = ['CIH', 'التجاري وفا', 'BMCE'][i % 3]
    }
    const p = makePay(r, 1, amount, mode, d.fr, hh, extra)
    paymentsByDay[di].push(p.id)
    if (i % 10 === 2) {
      const t = '16:' + String((i * 9) % 60).padStart(2, '0'),
        a = Math.min(r.convenu - amount, 3000 * 100)
      if (a > 0) {
        const p2 = makePay(r, 2, a, 'نقد', d.fr, t, { par: r.employe })
        paymentsByDay[di].push(p2.id)
      }
    }
    receipts.push(r)
  })
  // Deux chèques collectifs : chaque chèque physique n'est compté qu'une fois.
  const shared1 = receipts.slice(5, 8),
    real1 = 1800000
  shared1.forEach((r, j) => {
    const p = r.vers[0]
    p.mode = 'شيك'
    p.cn = 'CH-P-9001'
    p.cb = 'التجاري وفا'
    p.cd = days[0].fr
    p.qui = 'دفع عائلي'
    p.colAmt = real1
    p.sharedOperationId = 'CHP-DEMO-9001'
    p.montant = [700000, 600000, 500000][j]
    p.snapshot.remainingAfter = Math.max(0, r.convenu - p.montant)
  })
  const shared2 = receipts.slice(35, 38),
    real2 = 2400000
  shared2.forEach((r, j) => {
    const p = r.vers[0]
    p.mode = 'شيك'
    p.cn = 'CH-P-9017'
    p.cb = 'CIH'
    p.cd = days[2].fr
    p.qui = 'دفع جماعي'
    p.colAmt = real2
    p.sharedOperationId = 'CHP-DEMO-9017'
    p.montant = [900000, 800000, 700000][j]
    p.snapshot.remainingAfter = Math.max(0, r.convenu - p.montant)
  })
  // Modifications présentes uniquement pour illustrer le compteur du jour :
  // elles ne changent jamais les totaux de caisse.
  receipts[3].modifications.push({
    id: 'mod_demo_1',
    rubrique: 'contact',
    rubriqueLabel: 'الهاتف',
    changements: [{ champ: 'رقم الهاتف', ancienne: '0611000000', nouvelle: '0611000011' }],
    motif: 'تصحيح',
    employe: 'سمير بنعلي',
    dateHeure: days[0].fr + ' 12:15',
  })
  receipts[18].modifications.push({
    id: 'mod_demo_2',
    rubrique: 'program',
    rubriqueLabel: 'البرنامج والسعر',
    changements: [{ champ: 'الغرفة', ancienne: '3', nouvelle: '2' }],
    motif: 'تغيير الغرفة',
    employe: 'عادل المريني',
    dateHeure: days[1].fr + ' 11:20',
  })
  receipts[40].modifications.push({
    id: 'mod_demo_3',
    rubrique: 'note',
    rubriqueLabel: 'الملاحظة',
    changements: [{ champ: 'الملاحظة', ancienne: '', nouvelle: 'تأكيد لاحق' }],
    motif: 'إضافة ملاحظة',
    employe: 'سمير بنعلي',
    dateHeure: days[2].fr + ' 10:05',
  })

  // Une annulation remboursée depuis la caisse, hier.
  const cancelled = receipts[20]
  cancelled.statut = 'ملغى'
  cancelled.motif = 'إلغاء السفر'
  cancelled.annulePar = 'سمير بنعلي'
  cancelled.annuleLe = days[1].fr + ' 17:40'
  cancelled.refundMode = 'cash'
  cancelled.refundAmount = cancelled.vers.reduce((s, v) => s + v.montant, 0)
  const cashMovements = [
    {
      id: 'refund_demo_1',
      type: 'refund_cash',
      dayKey: days[1].key,
      date: days[1].fr,
      time: '17:40',
      amount: cancelled.refundAmount,
      receipt: cancelled.numero,
      client: cancelled.prenom + ' ' + cancelled.nom,
      employee: 'سمير بنعلي',
    },
  ]
  // Empreintes d'impression : le jour le plus ancien a été imprimé à 14:20.
  const oldestPrinted: string[] = []
  receipts.forEach((r) =>
    (r.vers || []).forEach((v) => {
      if (v.date === days[0].fr && String(v.heure || '00:00') <= '14:20') oldestPrinted.push(v.id)
    }),
  )
  oldestPrinted.sort()
  // Aucune impression préchargée pour aujourd'hui : un reçu créé aujourd'hui
  // n'est pas une anomalie tant que la journée n'a pas été imprimée une fois.
  const financePrints = [
    {
      id: 'fp_demo_old',
      dayKey: days[0].key,
      printedAt: days[0].fr + ' 14:20',
      employee: 'سمير بنعلي',
      printNo: 1,
      movementIds: oldestPrinted,
      rowCount: oldestPrinted.length,
    },
    {
      id: 'fp_demo_y1',
      dayKey: days[1].key,
      printedAt: days[1].fr + ' 18:10',
      employee: 'سمير بنعلي',
      printNo: 1,
      movementIds: paymentsByDay[1].concat(['refund_demo_1']).slice().sort(),
      rowCount: paymentsByDay[1].length + 1,
    },
    {
      id: 'fp_demo_y2',
      dayKey: days[1].key,
      printedAt: days[1].fr + ' 18:35',
      employee: 'سمير بنعلي',
      printNo: 2,
      movementIds: paymentsByDay[1].concat(['refund_demo_1']).slice().sort(),
      rowCount: paymentsByDay[1].length + 1,
    },
  ]
  return {
    prochainNumero: nextNo,
    recus: receipts,
    clients: [],
    cashMovements,
    financePrints,
    financeAnomalyAcks: {},
    audit: [{ t: nowStr(), a: 'بيانات تجريبية', d: '50 شخصاً موزعين على ثلاثة أيام', u: 'النظام' }],
  }
}
