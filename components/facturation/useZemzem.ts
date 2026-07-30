'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  LEGACY_STORAGE_KEY,
  MAX_VERS,
  SAISON,
  STORAGE_KEY,
  USERS,
  badInputStyle,
  okInputStyle,
} from './constants'
import {
  cleanAr,
  dateKey,
  dh,
  dhs,
  fmtDate,
  fmtMoney,
  fmtTel,
  frDateKey,
  getTarif,
  keyToFr,
  makePassportPortrait,
  nowStr,
  nowTime,
  okDate,
  paye,
  receiptMethodLabel,
  resizeImageFile,
  rest,
  same,
  sharedChequeId,
  stat,
  today,
} from './helpers'
import { buildReceiptHtml } from './receipt'
import { seed } from './seed'
import type {
  CancelForm,
  Changement,
  Db,
  EditForm,
  FieldError,
  ModalName,
  Modification,
  NewForm,
  PassportScan,
  PayForm,
  Recu,
  ScreenName,
  SessionUser,
  Snapshot,
  Versement,
} from './types'

interface State {
  screen: ScreenName
  loginU: string
  loginP: string
  loginErr: string
  user: SessionUser | null
  db: Db | null
  qn: string
  qr: string
  showCx: boolean
  curRecu: string | null
  curOriginal: boolean
  modal: ModalName
  detailId: string | null
  nf: NewForm
  nErr: FieldError[]
  passportDraft: PassportScan
  pf: PayForm
  pErr: FieldError[]
  cxf: CancelForm
  cxErr: FieldError[]
  editId: string | null
  editSection: string
  ef: EditForm
  eErr: FieldError[]
  financeFilter: string
  financeDay: string
  financeFrom: string
  financeTo: string
  toast: { msg: string; bad: boolean; show: boolean }
}

function blankPassport(): PassportScan {
  return {
    pre: '',
    nom: '',
    number: '',
    nationality: '',
    birthDate: '',
    birthPlace: '',
    issueDate: '',
    expiryDate: '',
    issuingCountry: '',
    sex: '',
    mrz: '',
    originalImage: '',
    portraitImage: '',
    rawResult: null,
    scanId: '',
  }
}

function blankNewForm(): NewForm {
  return {
    pre: '',
    nom: '',
    tel: '',
    h: '',
    v: '',
    c: '',
    rab: '',
    red: '',
    grpChk: false,
    grp: '',
    pay: '',
    mode: 'نقد',
    cn: '',
    cd: '',
    cb: '',
    col: false,
    colWho: '',
    colAmt: '',
    note: '',
    passportScan: null,
  }
}

function initialState(): State {
  return {
    screen: 'login',
    loginU: '',
    loginP: '',
    loginErr: '',
    user: null,
    db: null,
    qn: '',
    qr: '',
    showCx: false,
    curRecu: null,
    curOriginal: false,
    modal: null,
    detailId: null,
    nf: blankNewForm(),
    nErr: [],
    passportDraft: blankPassport(),
    pf: { no: '', amt: '', mode: 'نقد', cn: '', cd: '', cb: '', col: false, colWho: '', colAmt: '' },
    pErr: [],
    cxf: { m: '', p: '', refundMode: '' },
    cxErr: [],
    editId: null,
    editSection: '',
    ef: {
      pre: '',
      nom: '',
      tel: '',
      h: '',
      v: '',
      c: '',
      red: '0',
      grpChk: false,
      grp: '',
      note: '',
      mode: 'نقد',
      cn: '',
      cd: '',
      cb: '',
      col: false,
      colWho: '',
      colAmt: '',
      reason: '',
    },
    eErr: [],
    financeFilter: 'day',
    financeDay: dateKey(new Date()),
    financeFrom: '',
    financeTo: '',
    toast: { msg: '', bad: false, show: false },
  }
}

const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* quota ou mode privé : on ignore, comme le prototype */
    }
  },
}

export function useZemzem() {
  const [state, setStateRaw] = useState<State>(initialState)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const financePageStyle = useRef<HTMLStyleElement | null>(null)
  const curRecuRef = useRef<string | null>(null)
  const dbRef = useRef<Db | null>(null)
  curRecuRef.current = state.curRecu
  dbRef.current = state.db

  const setState = useCallback((patch: Partial<State> | ((s: State) => Partial<State>), cb?: () => void) => {
    setStateRaw((s) => {
      const p = typeof patch === 'function' ? patch(s) : patch
      return { ...s, ...p }
    })
    if (cb) setTimeout(cb, 0)
  }, [])

  const save = useCallback((db: Db) => {
    storage.set(STORAGE_KEY, JSON.stringify(db))
  }, [])

  /* ---------- chargement / persistance ---------- */
  const loadDB = useCallback(() => {
    let raw = storage.get(STORAGE_KEY)
    if (!raw) raw = storage.get(LEGACY_STORAGE_KEY)
    let db: Db
    try {
      db = raw ? (JSON.parse(raw) as Db) : seed()
    } catch {
      db = seed()
    }
    if (!db || !db.recus) db = seed()
    db.audit = Array.isArray(db.audit) ? db.audit : []
    db.financePrints = Array.isArray(db.financePrints) ? db.financePrints : []
    // On ne retire que l'ancienne impression de démonstration du jour (V9).
    db.financePrints = db.financePrints.filter((p) => p && p.id !== 'fp_demo_today')
    db.cashMovements = Array.isArray(db.cashMovements) ? db.cashMovements : []
    db.financeAnomalyAcks =
      db.financeAnomalyAcks && typeof db.financeAnomalyAcks === 'object' ? db.financeAnomalyAcks : {}
    db.clients = Array.isArray(db.clients) ? db.clients : []
    const knownClients = new Map(db.clients.map((c) => [c.id, c]))
    db.recus.forEach((r) => {
      r.vers = Array.isArray(r.vers) ? r.vers : []
      r.modifications = Array.isArray(r.modifications) ? r.modifications : []
      r.note = r.note || ''
      r.groupe = r.groupe || ''
      if (!r.clientId) r.clientId = 'CLI-' + String(r.numero || '').padStart(6, '0')
      if (r.passport === undefined) r.passport = null
      if (!knownClients.has(r.clientId)) {
        const client = {
          id: r.clientId,
          nom: r.nom || '',
          prenom: r.prenom || '',
          photoUrl: r.passport && r.passport.portraitImage ? r.passport.portraitImage : '',
          passport: r.passport || null,
          createdAt: r.heure || r.date || '',
          createdBy: r.employe || '—',
          receiptIds: [r.id],
        }
        db.clients.push(client)
        knownClients.set(r.clientId, client)
      } else {
        const c = knownClients.get(r.clientId)!
        c.receiptIds = Array.isArray(c.receiptIds) ? c.receiptIds : []
        if (!c.receiptIds.includes(r.id)) c.receiptIds.push(r.id)
      }
      let cumul = 0
      r.vers.forEach((v, i) => {
        cumul += Number(v.montant) || 0
        if (v.id == null) v.id = 'pay_' + r.id + '_' + i
        if (v.qui == null) v.qui = ''
        if (v.colAmt == null) v.colAmt = 0
        if (v.cn == null) v.cn = ''
        if (v.cd == null) v.cd = ''
        if (v.cb == null) v.cb = ''
        if (v.sharedOperationId == null)
          v.sharedOperationId = Number(v.colAmt) > 0 ? sharedChequeId(v.cn, v.cd, v.cb) : ''
        if (v.heure == null) v.heure = ''
        if (v.dateHeure == null) v.dateHeure = ''
        if (!v.snapshot)
          v.snapshot = {
            client: (r.prenom || '') + ' ' + (r.nom || ''),
            hotel: r.hotel || '',
            room: r.chambre || '',
            flight: r.vol || '',
            program: (r.hotel || '') + ' / غرفة ' + (r.chambre || '') + ' / ' + (r.vol || ''),
            agreed: Number(r.convenu) || 0,
            rabatteur: r.rabatteur || '—',
            remainingAfter: Math.max(0, (Number(r.convenu) || 0) - cumul),
            statusAfter: (Number(r.convenu) || 0) - cumul <= 0 ? '✓' : '•',
          }
      })
    })
    setState({ db })
  }, [setState])

  const cleanupFinancePrint = useCallback(() => {
    document.body.classList.remove('finance-printing')
    if (financePageStyle.current) {
      financePageStyle.current.remove()
      financePageStyle.current = null
    }
  }, [])

  const recordReceiptPrint = useCallback(() => {
    const db = dbRef.current
    const r = (db?.recus || []).find((x) => x.id === curRecuRef.current)
    if (!r || !db) return
    r.impressions = (r.impressions || 0) + 1
    db.audit = Array.isArray(db.audit) ? db.audit : []
    db.audit.unshift({
      t: nowStr(),
      a: 'طباعة',
      d: 'وصل ' + r.numero + ' — طباعة رقم ' + r.impressions,
      u: state.user ? state.user.nom : '—',
    })
    save(db)
  }, [save, state.user])

  useEffect(() => {
    loadDB()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeAll = useCallback(() => setState({ modal: null, detailId: null }), [setState])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll()
    }
    const onMessage = (e: MessageEvent) => {
      if (e && e.data && e.data.type === 'zemzem-receipt-print') recordReceiptPrint()
    }
    const afterPrint = () => cleanupFinancePrint()
    window.addEventListener('keydown', esc)
    window.addEventListener('message', onMessage)
    window.addEventListener('afterprint', afterPrint)
    return () => {
      window.removeEventListener('keydown', esc)
      window.removeEventListener('message', onMessage)
      window.removeEventListener('afterprint', afterPrint)
      cleanupFinancePrint()
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [closeAll, recordReceiptPrint, cleanupFinancePrint])

  /* ---------- journal & notifications ---------- */
  const log = (a: string, d: string) => {
    const db = state.db
    if (!db) return
    db.audit.unshift({ t: nowStr(), a, d, u: state.user ? state.user.nom : '—' })
    setState({ db })
    save(db)
  }
  const showToast = (msg: string, bad?: boolean) => {
    setState({ toast: { msg, bad: !!bad, show: true } })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setState((s) => ({ toast: { ...s.toast, show: false } })), 2800)
  }

  /* ---------- session ---------- */
  const doLogin = () => {
    const id = state.loginU.trim(),
      pw = state.loginP,
      u = USERS[id]
    if (!u || u.pwd !== pw) return setState({ loginErr: 'اسم المستخدم أو كلمة المرور غير صحيحة.' })
    setState({ user: { id, ...u }, loginErr: '', loginP: '', screen: 'home' })
    const db = state.db
    if (db) {
      db.audit.unshift({ t: nowStr(), a: 'دخول', d: 'اتصال بالنظام', u: u.nom })
      save(db)
    }
  }
  const logout = () => {
    log('خروج', 'قطع الاتصال')
    setState({ user: null, loginU: '', loginP: '', screen: 'login' })
  }
  const goHome = () => setState({ screen: 'home', modal: null, detailId: null })
  const goFinance = () =>
    setState({ screen: 'finance', modal: null, detailId: null, financeFilter: 'day', financeDay: dateKey(new Date()) })
  const goStats = () => setState({ screen: 'stats', modal: null, detailId: null })

  /* ---------- caisse : filtres ---------- */
  const shiftFinanceDay = (delta: number) => {
    const base = state.financeDay ? new Date(state.financeDay + 'T12:00:00') : new Date()
    base.setDate(base.getDate() + delta)
    setState({ financeDay: dateKey(base), financeFilter: 'day' })
  }
  const selectedFinanceDayKey = () =>
    state.financeFilter === 'day' ? state.financeDay || dateKey(new Date()) : ''
  const financeMovementId = (r: Recu, v: Versement, i: number) => String(v.id || 'pay_' + r.id + '_' + i)
  const collectFinanceMovementIds = (dayKey: string) => {
    const ids: string[] = []
    ;(state.db?.recus || []).forEach((r) =>
      (r.vers || []).forEach((v, i) => {
        if (frDateKey(v.date) === dayKey) ids.push(financeMovementId(r, v, i))
      }),
    )
    ;(state.db?.cashMovements || []).forEach((m) => {
      if (m.dayKey === dayKey) ids.push(m.id)
    })
    return ids.sort()
  }
  const financeAnomalyCandidateIds = (dayKey: string) => {
    const db = state.db
    if (!db || !dayKey) return []
    const prints = (db.financePrints || [])
      .filter((p) => p.dayKey === dayKey)
      .slice()
      .sort(
        (a, b) =>
          (Number(a.printNo) || 0) - (Number(b.printNo) || 0) ||
          String(a.printedAt || '').localeCompare(String(b.printedAt || '')),
      )
    if (!prints.length) return []
    const candidates = new Set<string>()
    for (let i = 1; i < prints.length; i++) {
      const previous = new Set(prints[i - 1].movementIds || [])
      ;(prints[i].movementIds || []).forEach((id) => {
        if (!previous.has(id)) candidates.add(String(id))
      })
    }
    const latest = new Set(prints[prints.length - 1].movementIds || [])
    collectFinanceMovementIds(dayKey).forEach((id) => {
      if (!latest.has(id)) candidates.add(String(id))
    })
    return [...candidates].sort()
  }
  const financePendingAnomalyIds = (dayKey: string) => {
    const db = state.db || ({} as Db)
    const ack = (db.financeAnomalyAcks || {})[dayKey] || { movementIds: [] as string[], seenAt: '', user: '' }
    const acknowledged = new Set(Array.isArray(ack.movementIds) ? ack.movementIds.map(String) : [])
    return financeAnomalyCandidateIds(dayKey).filter((id) => !acknowledged.has(String(id)))
  }
  const printFinance = () => {
    const key = selectedFinanceDayKey(),
      db = state.db,
      user = state.user,
      todayKey = dateKey(new Date()),
      yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = dateKey(yesterday)
    if (!key) return showToast('اختر يوماً واحداً للطباعة.', true)
    if (!db) return
    const admin = user && (user.id === 'admin' || user.role === 'مدير')
    if (!admin && key !== todayKey && key !== yesterdayKey)
      return showToast('يمكن للموظف طباعة اليوم أو أمس فقط.', true)
    db.financePrints = Array.isArray(db.financePrints) ? db.financePrints : []
    const count = db.financePrints.filter((p) => p.dayKey === key).length + 1
    const movementIds = collectFinanceMovementIds(key)
    const rec = {
      id: 'fp_' + Date.now(),
      dayKey: key,
      printedAt: nowStr(),
      employee: user ? user.nom : '—',
      printNo: count,
      movementIds,
      rowCount: movementIds.length,
    }
    db.financePrints.push(rec)
    db.audit.unshift({
      t: nowStr(),
      a: 'طباعة الصندوق',
      d: keyToFr(key) + ' — ' + String(count).padStart(2, '0') + ' — ' + movementIds.length + ' حركة',
      u: user ? user.nom : '—',
    })
    save(db)
    setState({ db }, () => {
      document.body.classList.add('finance-printing')
      financePageStyle.current = document.createElement('style')
      financePageStyle.current.textContent = '@page{size:A4 landscape;margin:5mm}'
      document.head.appendChild(financePageStyle.current)
      setTimeout(() => window.print(), 80)
    })
  }
  const acknowledgeFinanceAnomaly = () => {
    const key = selectedFinanceDayKey(),
      user = state.user
    const admin = user && (user.id === 'admin' || user.role === 'مدير')
    if (!admin) return showToast('تأكيد مراجعة التنبيه متاح للمدير فقط.', true)
    if (!key || !financePendingAnomalyIds(key).length) return
    setState({ modal: 'financeAnomaly' })
  }
  const confirmFinanceAnomaly = () => {
    const key = selectedFinanceDayKey(),
      db = state.db,
      user = state.user
    if (!key || !db) return
    const admin = user && (user.id === 'admin' || user.role === 'مدير')
    if (!admin) return showToast('تأكيد مراجعة التنبيه متاح للمدير فقط.', true)
    const pending = financePendingAnomalyIds(key)
    if (!pending.length) return setState({ modal: null })
    db.financeAnomalyAcks = db.financeAnomalyAcks || {}
    const previous = db.financeAnomalyAcks[key] || { movementIds: [] as string[], seenAt: '', user: '' }
    const all = [
      ...new Set([...(Array.isArray(previous.movementIds) ? previous.movementIds : []), ...pending].map(String)),
    ].sort()
    const stamp = nowStr(),
      name = user ? user.nom : '—'
    db.financeAnomalyAcks[key] = { movementIds: all, seenAt: stamp, user: name }
    db.audit = Array.isArray(db.audit) ? db.audit : []
    db.audit.unshift({
      t: stamp,
      a: 'مراجعة',
      d: 'تأكيد مراجعة ' + pending.length + ' عملية مالية ليوم ' + keyToFr(key),
      u: name,
    })
    save(db)
    setState({ db, modal: null })
    showToast('تم تأكيد مراجعة التنبيه وحفظها في السجل.')
  }

  /* ---------- passeport ---------- */
  const setPassportDraft = (k: keyof PassportScan, val: string) =>
    setState((st) => ({ passportDraft: { ...st.passportDraft, [k]: val } }))
  const openPassportScan = () => {
    const linked = state.nf && state.nf.passportScan
    setState({ modal: 'passport', passportDraft: linked ? { ...linked } : blankPassport() })
  }
  const backToNewFromPassport = () => setState({ modal: 'new' })
  const onPassportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    try {
      const original = await resizeImageFile(file, 1100, 760, 0.78)
      const portrait = await resizeImageFile(file, 260, 320, 0.72)
      setState((st) => ({
        passportDraft: {
          ...st.passportDraft,
          originalImage: original,
          portraitImage: portrait,
          rawResult: {
            source: 'prototype-upload',
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            receivedAt: nowStr(),
          },
          scanId: st.passportDraft.scanId || 'SCAN-' + Date.now(),
        },
      }))
    } catch {
      showToast('تعذر قراءة صورة الجواز.', true)
    }
  }
  const fillPassportDemo = () => {
    const d: PassportScan = {
      pre: 'محمد أمين',
      nom: 'العلوي',
      number: 'MA4827391',
      nationality: 'مغربية',
      birthDate: '14/03/1986',
      birthPlace: 'الدار البيضاء',
      issueDate: '09/05/2023',
      expiryDate: '08/05/2028',
      issuingCountry: 'المغرب',
      sex: 'M',
      mrz: 'P<MARALAOUI<<MOHAMED<AMINE<<<<<<<<<<<<\nMA4827391MAR8603147M2805089<<<<<<<<<<<<<<04',
      originalImage: makePassportPortrait('MA'),
      portraitImage: makePassportPortrait('MA'),
      scanId: 'SCAN-DEMO-' + Date.now(),
      rawResult: { source: 'prototype-ai-simulation', confidence: 0.97, fieldsDetected: 10, receivedAt: nowStr() },
    }
    setState({ passportDraft: d })
  }
  const applyPassportScan = () => {
    const d = state.passportDraft || blankPassport()
    if (!String(d.pre || '').trim() || !String(d.nom || '').trim())
      return showToast('الاسم والنسب ضروريان لاستعمال نتيجة المسح.', true)
    const scan: PassportScan = {
      ...d,
      scanId: d.scanId || 'SCAN-' + Date.now(),
      scannedAt: nowStr(),
      scannedBy: state.user ? state.user.nom : '—',
      status: 'verified-in-form',
    }
    if (!scan.portraitImage)
      scan.portraitImage = makePassportPortrait((scan.pre || 'P').slice(0, 1) + (scan.nom || '').slice(0, 1))
    setState((st) => ({ modal: 'new', nf: { ...st.nf, pre: scan.pre, nom: scan.nom, passportScan: scan } }))
    showToast('تم نقل الاسم والنسب والصورة إلى الوصل. ستُحفظ بقية البيانات عند الحفظ.')
  }
  const removePassportScan = () => setState((st) => ({ nf: { ...st.nf, passportScan: null } }))

  /* ---------- vosl jadid / nouveau reçu ---------- */
  const openNew = () => setState({ modal: 'new', nErr: [], nf: blankNewForm() })
  const setNf = (k: keyof NewForm, val: string | boolean) => setState((s) => ({ nf: { ...s.nf, [k]: val } }))
  const nfH = {
    pre: (e: React.ChangeEvent<HTMLInputElement>) => setNf('pre', cleanAr(e.target.value)),
    nom: (e: React.ChangeEvent<HTMLInputElement>) => setNf('nom', cleanAr(e.target.value)),
    tel: (e: React.ChangeEvent<HTMLInputElement>) => setNf('tel', fmtTel(e.target.value)),
    h: (e: React.ChangeEvent<HTMLSelectElement>) => setNf('h', e.target.value),
    v: (e: React.ChangeEvent<HTMLSelectElement>) => setNf('v', e.target.value),
    c: (e: React.ChangeEvent<HTMLSelectElement>) => setNf('c', e.target.value),
    rab: (e: React.ChangeEvent<HTMLSelectElement>) => setNf('rab', e.target.value),
    red: (e: React.ChangeEvent<HTMLInputElement>) => setNf('red', fmtMoney(e.target.value)),
    grpChk: (e: React.ChangeEvent<HTMLInputElement>) => setNf('grpChk', e.target.checked),
    grp: (e: React.ChangeEvent<HTMLInputElement>) => setNf('grp', e.target.value),
    pay: (e: React.ChangeEvent<HTMLInputElement>) => setNf('pay', fmtMoney(e.target.value)),
    mode: (e: React.ChangeEvent<HTMLSelectElement>) => setNf('mode', e.target.value),
    cn: (e: React.ChangeEvent<HTMLInputElement>) => setNf('cn', e.target.value),
    cd: (e: React.ChangeEvent<HTMLInputElement>) => setNf('cd', fmtDate(e.target.value)),
    cb: (e: React.ChangeEvent<HTMLInputElement>) => setNf('cb', e.target.value),
    col: (e: React.ChangeEvent<HTMLInputElement>) => setNf('col', e.target.checked),
    colWho: (e: React.ChangeEvent<HTMLInputElement>) => setNf('colWho', cleanAr(e.target.value)),
    colAmt: (e: React.ChangeEvent<HTMLInputElement>) => setNf('colAmt', fmtMoney(e.target.value)),
    note: (e: React.ChangeEvent<HTMLInputElement>) => setNf('note', e.target.value),
  }

  const saveNew = () => {
    const nf = state.nf,
      E: FieldError[] = []
    if (!nf.pre.trim()) E.push({ id: 'pre', m: 'الاسم إجباري.' })
    if (!nf.nom.trim()) E.push({ id: 'nom', m: 'النسب إجباري.' })
    const telD = nf.tel.replace(/\D/g, '')
    if (!nf.tel.trim()) E.push({ id: 'tel', m: 'رقم الهاتف إجباري.' })
    else if (telD.length !== 10) E.push({ id: 'tel', m: 'رقم الهاتف يجب أن يتكون من 10 أرقام.' })
    if (!nf.h) E.push({ id: 'h', m: 'اختر الفندق.' })
    if (!nf.v) E.push({ id: 'v', m: 'اختر الرحلة.' })
    if (!nf.c) E.push({ id: 'c', m: 'اختر الغرفة.' })
    if (!nf.pay.trim()) E.push({ id: 'pay', m: 'الدفعة الأولى إجبارية.' })
    if (!nf.rab) E.push({ id: 'rab', m: 'اختر الوسيط.' })
    if (nf.mode !== 'نقد') {
      if (!nf.cn.trim()) E.push({ id: 'cn', m: 'رقم الشيك أو مرجع التحويل إجباري.' })
      if (!nf.cd.trim()) E.push({ id: 'cd', m: 'تاريخ الشيك إجباري.' })
      else if (!okDate(nf.cd)) E.push({ id: 'cd', m: 'تاريخ الشيك غير صحيح. الشكل: 02/07/2025' })
      if (!nf.cb.trim()) E.push({ id: 'cb', m: 'البنك إجباري.' })
    }
    if (nf.col) {
      if (!nf.colWho.trim()) E.push({ id: 'colWho', m: 'اسم الشخص الذي قام بالدفع إجباري.' })
      if (!nf.colAmt.trim()) E.push({ id: 'colAmt', m: 'المبلغ الحقيقي للشيك إجباري.' })
    }
    if (nf.grpChk && !nf.grp.trim()) E.push({ id: 'grp', m: 'رمز المجموعة إجباري.' })
    if (E.length) return setState({ nErr: E })

    const t = getTarif(nf.h, nf.v, nf.c)
    if (t === null)
      return setState({ nErr: [{ id: 'h', m: 'لا يوجد ثمن لهذا الاختيار. غيّر الفندق أو الرحلة أو الغرفة.' }] })
    const red = Math.max(0, +nf.red || 0) * 100
    if (red > SAISON.reductionMax)
      return setState({ nErr: [{ id: 'red', m: 'التخفيض الأقصى لهذا الموسم هو ' + dhs(SAISON.reductionMax) + '.' }] })
    if (red >= t) return setState({ nErr: [{ id: 'red', m: 'التخفيض لا يمكن أن يساوي أو يفوق الثمن.' }] })
    const conv = t - red,
      pay = Math.max(0, +nf.pay || 0) * 100
    if (pay <= 0) return setState({ nErr: [{ id: 'pay', m: 'الدفعة الأولى يجب أن تفوق 0 درهم.' }] })
    if (pay > conv)
      return setState({
        nErr: [{ id: 'pay', m: 'المبلغ المدفوع يفوق المبلغ المتفق عليه (' + dhs(conv) + '). الدفع الزائد ممنوع.' }],
      })

    const db = state.db,
      user = state.user
    if (!db || !user) return
    const n = db.prochainNumero
    db.prochainNumero = n + 1
    db.clients = Array.isArray(db.clients) ? db.clients : []
    const clientId = 'CLI-' + Date.now().toString(36).toUpperCase() + '-' + String(n).padStart(6, '0')
    const passport: PassportScan | null = nf.passportScan
      ? { ...nf.passportScan, linkedClientId: clientId, linkedReceiptNumber: n, linkedAt: nowStr() }
      : null
    const r: Recu = {
      id: 'r' + n + '_' + Date.now(),
      numero: n,
      clientId,
      passport,
      prenom: nf.pre.trim(),
      nom: nf.nom.trim(),
      tel: nf.tel,
      hotel: nf.h,
      vol: nf.v,
      chambre: nf.c,
      tarif: t,
      reduction: red,
      convenu: conv,
      rabatteur: nf.rab,
      groupe: nf.grpChk ? nf.grp.trim() : '',
      date: today(),
      heure: nowStr(),
      employe: user.nom,
      statut: 'نشط',
      motif: '',
      note: nf.note,
      impressions: 0,
      modifications: [],
      vers: [
        {
          id: 'p_' + n + '_' + Date.now(),
          n: 1,
          montant: pay,
          mode: nf.mode,
          date: today(),
          heure: nowTime(),
          dateHeure: nowStr(),
          cn: nf.cn,
          cd: nf.cd,
          cb: nf.cb,
          par: user.nom,
          qui: nf.col ? nf.colWho : '',
          colAmt: nf.col ? Math.max(0, +nf.colAmt || 0) * 100 : 0,
          sharedOperationId: nf.col ? sharedChequeId(nf.cn, nf.cd, nf.cb) : '',
          snapshot: {
            client: nf.pre.trim() + ' ' + nf.nom.trim(),
            hotel: nf.h,
            room: nf.c,
            flight: nf.v,
            program: nf.h + ' / غرفة ' + nf.c + ' / ' + nf.v,
            agreed: conv,
            rabatteur: nf.rab,
            remainingAfter: Math.max(0, conv - pay),
            statusAfter: conv - pay === 0 ? '✓' : '•',
          },
        },
      ],
    }
    db.recus.push(r)
    db.clients.push({
      id: clientId,
      nom: r.nom,
      prenom: r.prenom,
      photoUrl: passport && passport.portraitImage ? passport.portraitImage : '',
      passport,
      createdAt: nowStr(),
      createdBy: user.nom,
      receiptIds: [r.id],
    })
    log('إنشاء', 'وصل ' + n + ' — ' + r.prenom + ' ' + r.nom + ' — ' + dhs(pay))
    save(db)
    setState({ modal: null, curRecu: r.id, curOriginal: true, screen: 'recu' })
    showToast('تم حفظ الوصل رقم ' + n)
  }

  /* ---------- ajout de versement ---------- */
  const blankPf = (): PayForm => ({
    no: '',
    amt: '',
    mode: 'نقد',
    cn: '',
    cd: '',
    cb: '',
    col: false,
    colWho: '',
    colAmt: '',
  })
  const openPay = () => setState({ modal: 'pay', pErr: [], pf: blankPf() })
  const openPayFor = (id: string) => {
    const r = (state.db?.recus || []).find((x) => x.id === id)
    if (!r) return
    setState({ modal: 'pay', pErr: [], pf: { ...blankPf(), no: String(r.numero) } })
  }
  const openPayForCur = () => {
    if (state.curRecu) openPayFor(state.curRecu)
  }
  const setPf = (k: keyof PayForm, val: string | boolean) => setState((s) => ({ pf: { ...s.pf, [k]: val } }))
  const pfH = {
    no: (e: React.ChangeEvent<HTMLInputElement>) => setPf('no', e.target.value.replace(/\D/g, '')),
    amt: (e: React.ChangeEvent<HTMLInputElement>) => setPf('amt', fmtMoney(e.target.value)),
    mode: (e: React.ChangeEvent<HTMLSelectElement>) => setPf('mode', e.target.value),
    cn: (e: React.ChangeEvent<HTMLInputElement>) => setPf('cn', e.target.value),
    cd: (e: React.ChangeEvent<HTMLInputElement>) => setPf('cd', fmtDate(e.target.value)),
    cb: (e: React.ChangeEvent<HTMLInputElement>) => setPf('cb', e.target.value),
    col: (e: React.ChangeEvent<HTMLInputElement>) => setPf('col', e.target.checked),
    colWho: (e: React.ChangeEvent<HTMLInputElement>) => setPf('colWho', cleanAr(e.target.value)),
    colAmt: (e: React.ChangeEvent<HTMLInputElement>) => setPf('colAmt', fmtMoney(e.target.value)),
  }
  const savePay = () => {
    const pf = state.pf,
      db = state.db,
      user = state.user
    if (!db || !user) return
    const raw = pf.no.trim()
    if (!raw) return setState({ pErr: [{ id: 'no', m: 'اكتب رقم الوصل.' }] })
    const r = (db.recus || []).find((x) => String(x.numero) === raw)
    if (!r) return setState({ pErr: [{ id: 'no', m: 'هذا الرقم غير موجود.' }] })
    if (r.statut === 'ملغى') return setState({ pErr: [{ id: 'no', m: 'هذا الوصل ملغى.' }] })
    if (rest(r) === 0) return setState({ pErr: [{ id: 'no', m: 'هذا الوصل مسدد بالكامل.' }] })
    if (r.vers.length >= MAX_VERS)
      return setState({ pErr: [{ id: 'no', m: 'بلغ هذا الوصل الحد الأقصى: ' + MAX_VERS + ' دفعات.' }] })

    const E: FieldError[] = []
    if (!pf.amt.trim()) E.push({ id: 'amt', m: 'المبلغ إجباري.' })
    if (pf.mode !== 'نقد') {
      if (!pf.cn.trim()) E.push({ id: 'cn', m: 'رقم الشيك أو مرجع التحويل إجباري.' })
      if (!pf.cd.trim()) E.push({ id: 'cd', m: 'تاريخ الشيك إجباري.' })
      else if (!okDate(pf.cd)) E.push({ id: 'cd', m: 'تاريخ الشيك غير صحيح. الشكل: 02/07/2025' })
      if (!pf.cb.trim()) E.push({ id: 'cb', m: 'البنك إجباري.' })
    }
    if (pf.col) {
      if (!pf.colWho.trim()) E.push({ id: 'colWho', m: 'اسم الشخص الذي قام بالدفع إجباري.' })
      if (!pf.colAmt.trim()) E.push({ id: 'colAmt', m: 'المبلغ الحقيقي للشيك إجباري.' })
    }
    if (E.length) return setState({ pErr: E })

    const amt = Math.max(0, +pf.amt || 0) * 100
    if (amt <= 0) return setState({ pErr: [{ id: 'amt', m: 'المبلغ يجب أن يفوق 0 درهم.' }] })
    const remaining = rest(r)
    const isSixthPayment = r.vers.length === MAX_VERS - 1
    if (isSixthPayment && amt !== remaining)
      return setState({
        pErr: [
          {
            id: 'amt',
            m:
              'الدفعة السادسة يجب أن تساوي كامل الباقي بالضبط (' +
              dhs(remaining) +
              '). لا يُقبل مبلغ أقل أو أكبر.',
          },
        ],
      })
    if (amt > remaining)
      return setState({
        pErr: [{ id: 'amt', m: 'المبلغ يفوق الباقي (' + dhs(remaining) + '). الدفع الزائد ممنوع.' }],
      })

    const payIndex = r.vers.length + 1,
      remainingAfter = Math.max(0, remaining - amt)
    r.vers.push({
      id: 'p_' + r.numero + '_' + Date.now(),
      n: payIndex,
      montant: amt,
      mode: pf.mode,
      date: today(),
      heure: nowTime(),
      dateHeure: nowStr(),
      cn: pf.cn,
      cd: pf.cd,
      cb: pf.cb,
      par: user.nom,
      qui: pf.col ? pf.colWho : '',
      colAmt: pf.col ? Math.max(0, +pf.colAmt || 0) * 100 : 0,
      sharedOperationId: pf.col ? sharedChequeId(pf.cn, pf.cd, pf.cb) : '',
      snapshot: {
        client: r.prenom + ' ' + r.nom,
        hotel: r.hotel,
        room: r.chambre,
        flight: r.vol,
        program: r.hotel + ' / غرفة ' + r.chambre + ' / ' + r.vol,
        agreed: r.convenu,
        rabatteur: r.rabatteur,
        remainingAfter,
        statusAfter: remainingAfter === 0 ? '✓' : '•',
      },
    })
    log('دفعة', 'وصل ' + r.numero + ' — دفعة ' + r.vers.length + ' — ' + dhs(amt))
    save(db)
    const reste = rest(r)
    setState({ modal: null, curRecu: r.id, curOriginal: true, screen: 'recu' })
    showToast(
      reste === 0 ? 'تم — الوصل ' + r.numero + ' مسدد بالكامل' : 'تم تسجيل الدفعة — الباقي ' + dhs(reste),
    )
  }

  /* ---------- modification par rubrique ---------- */
  const editSectionName = (sec: string) =>
    (
      ({
        identity: 'الهوية',
        contact: 'الهاتف',
        program: 'البرنامج والسعر',
        group: 'المجموعة / العائلة',
        note: 'الملاحظة',
        firstPayment: 'طريقة الدفعة الأولى',
      }) as Record<string, string>
    )[sec] || ''
  const openEdit = (id: string) => {
    const r = (state.db?.recus || []).find((x) => x.id === id)
    if (!r) return
    if (r.statut === 'ملغى') return showToast('الوصل الملغى يبقى محفوظًا ولا يمكن تعديله.', true)
    const v = r.vers[0] || ({ mode: 'نقد', cn: '', cd: '', cb: '', qui: '', colAmt: 0 } as Versement)
    setState({
      modal: 'edit',
      editId: r.id,
      editSection: '',
      eErr: [],
      ef: {
        pre: r.prenom || '',
        nom: r.nom || '',
        tel: r.tel || '',
        h: r.hotel || '',
        v: r.vol || '',
        c: r.chambre || '',
        red: String(Math.round((r.reduction || 0) / 100)),
        grpChk: !!r.groupe,
        grp: r.groupe || '',
        note: r.note || '',
        mode: v.mode || 'نقد',
        cn: v.cn || '',
        cd: v.cd || '',
        cb: v.cb || '',
        col: !!(v.qui || v.colAmt),
        colWho: v.qui || '',
        colAmt: v.colAmt ? String(Math.round(v.colAmt / 100)) : '',
        reason: '',
      },
    })
  }
  const openEditCur = () => {
    if (state.curRecu) openEdit(state.curRecu)
  }
  const chooseEditSection = (sec: string) => setState({ editSection: sec, eErr: [] })
  const setEf = (k: keyof EditForm, val: string | boolean) => setState((s) => ({ ef: { ...s.ef, [k]: val } }))
  const efH = {
    pre: (e: React.ChangeEvent<HTMLInputElement>) => setEf('pre', cleanAr(e.target.value)),
    nom: (e: React.ChangeEvent<HTMLInputElement>) => setEf('nom', cleanAr(e.target.value)),
    tel: (e: React.ChangeEvent<HTMLInputElement>) => setEf('tel', fmtTel(e.target.value)),
    h: (e: React.ChangeEvent<HTMLSelectElement>) => setEf('h', e.target.value),
    v: (e: React.ChangeEvent<HTMLSelectElement>) => setEf('v', e.target.value),
    c: (e: React.ChangeEvent<HTMLSelectElement>) => setEf('c', e.target.value),
    red: (e: React.ChangeEvent<HTMLInputElement>) => setEf('red', fmtMoney(e.target.value)),
    grpChk: (e: React.ChangeEvent<HTMLInputElement>) => setEf('grpChk', e.target.checked),
    grp: (e: React.ChangeEvent<HTMLInputElement>) => setEf('grp', e.target.value),
    note: (e: React.ChangeEvent<HTMLTextAreaElement>) => setEf('note', e.target.value),
    mode: (e: React.ChangeEvent<HTMLSelectElement>) => setEf('mode', e.target.value),
    cn: (e: React.ChangeEvent<HTMLInputElement>) => setEf('cn', e.target.value),
    cd: (e: React.ChangeEvent<HTMLInputElement>) => setEf('cd', fmtDate(e.target.value)),
    cb: (e: React.ChangeEvent<HTMLInputElement>) => setEf('cb', e.target.value),
    col: (e: React.ChangeEvent<HTMLInputElement>) => setEf('col', e.target.checked),
    colWho: (e: React.ChangeEvent<HTMLInputElement>) => setEf('colWho', cleanAr(e.target.value)),
    colAmt: (e: React.ChangeEvent<HTMLInputElement>) => setEf('colAmt', fmtMoney(e.target.value)),
    reason: (e: React.ChangeEvent<HTMLTextAreaElement>) => setEf('reason', e.target.value),
  }
  const pushChange = (list: Changement[], field: string, oldVal: unknown, newVal: unknown) => {
    if (!same(oldVal, newVal))
      list.push({
        champ: field,
        ancienne: String(oldVal == null ? '' : oldVal),
        nouvelle: String(newVal == null ? '' : newVal),
      })
  }
  const saveEdit = () => {
    const db = state.db
    const r = (db?.recus || []).find((x) => x.id === state.editId)
    const ef = state.ef,
      sec = state.editSection,
      user = state.user
    if (!r || !sec || !db) return
    const E: FieldError[] = [],
      changes: Changement[] = []
    if (!ef.reason.trim()) E.push({ id: 'reason', m: 'سبب التعديل إجباري.' })

    if (sec === 'identity') {
      if (!ef.pre.trim()) E.push({ id: 'pre', m: 'الاسم إجباري.' })
      if (!ef.nom.trim()) E.push({ id: 'nom', m: 'النسب إجباري.' })
      pushChange(changes, 'الاسم', r.prenom, ef.pre.trim())
      pushChange(changes, 'النسب', r.nom, ef.nom.trim())
    }
    if (sec === 'contact') {
      const d = ef.tel.replace(/\D/g, '')
      if (!ef.tel.trim()) E.push({ id: 'tel', m: 'رقم الهاتف إجباري.' })
      else if (d.length !== 10) E.push({ id: 'tel', m: 'رقم الهاتف يجب أن يتكون من 10 أرقام.' })
      pushChange(changes, 'رقم الهاتف', r.tel, ef.tel)
    }
    let newTarif: number | null = r.tarif,
      newRed = r.reduction,
      newConv = r.convenu
    if (sec === 'program') {
      if (!ef.h) E.push({ id: 'h', m: 'اختر الفندق.' })
      if (!ef.v) E.push({ id: 'v', m: 'اختر الرحلة.' })
      if (!ef.c) E.push({ id: 'c', m: 'اختر الغرفة.' })
      newTarif = getTarif(ef.h, ef.v, ef.c)
      newRed = Math.max(0, +ef.red || 0) * 100
      if (newTarif === null) E.push({ id: 'h', m: 'لا يوجد ثمن لهذه التركيبة.' })
      else {
        if (newRed > SAISON.reductionMax)
          E.push({ id: 'red', m: 'التخفيض الأقصى لهذا الموسم هو ' + dhs(SAISON.reductionMax) + '.' })
        if (newRed >= newTarif) E.push({ id: 'red', m: 'التخفيض لا يمكن أن يساوي أو يفوق الثمن.' })
        newConv = newTarif - newRed
        if (newConv < paye(r))
          E.push({
            id: 'red',
            m: 'المبلغ المتفق عليه الجديد أقل من المبلغ المدفوع بالفعل (' + dhs(paye(r)) + ').',
          })
      }
      pushChange(changes, 'الفندق', r.hotel, ef.h)
      pushChange(changes, 'الرحلة', r.vol, ef.v)
      pushChange(changes, 'الغرفة', r.chambre, ef.c)
      pushChange(changes, 'الثمن الأصلي', dhs(r.tarif), newTarif === null ? '—' : dhs(newTarif))
      pushChange(changes, 'التخفيض', dhs(r.reduction), dhs(newRed))
      pushChange(changes, 'المبلغ المتفق عليه', dhs(r.convenu), newTarif === null ? '—' : dhs(newConv))
    }
    if (sec === 'group') {
      if (ef.grpChk && !ef.grp.trim()) E.push({ id: 'grp', m: 'رمز المجموعة إجباري.' })
      const ng = ef.grpChk ? ef.grp.trim() : ''
      pushChange(changes, 'المجموعة', r.groupe || '', ng)
    }
    if (sec === 'note') pushChange(changes, 'الملاحظة', r.note || '', ef.note || '')
    if (sec === 'firstPayment') {
      const v = r.vers[0]
      if (!v) E.push({ id: 'mode', m: 'لا توجد دفعة أولى مرتبطة بهذا الوصل.' })
      if (ef.mode !== 'نقد') {
        if (!ef.cn.trim()) E.push({ id: 'cn', m: 'رقم الشيك أو مرجع التحويل إجباري.' })
        if (!ef.cd.trim()) E.push({ id: 'cd', m: 'التاريخ إجباري.' })
        else if (!okDate(ef.cd)) E.push({ id: 'cd', m: 'صيغة التاريخ غير صحيحة. مثال: 02/07/2025' })
        if (!ef.cb.trim()) E.push({ id: 'cb', m: 'البنك إجباري.' })
        if (ef.col) {
          if (!ef.colWho.trim()) E.push({ id: 'colWho', m: 'اسم الشخص الذي قام بالدفع إجباري.' })
          if (!ef.colAmt.trim()) E.push({ id: 'colAmt', m: 'المبلغ الحقيقي للعملية إجباري.' })
        }
      }
      if (v) {
        const ncn = ef.mode === 'نقد' ? '' : ef.cn.trim(),
          ncd = ef.mode === 'نقد' ? '' : ef.cd.trim(),
          ncb = ef.mode === 'نقد' ? '' : ef.cb.trim()
        const nwho = ef.mode === 'نقد' || !ef.col ? '' : ef.colWho.trim(),
          namt = ef.mode === 'نقد' || !ef.col ? 0 : Math.max(0, +ef.colAmt || 0) * 100
        pushChange(changes, 'طريقة الدفعة الأولى', v.mode, ef.mode)
        pushChange(changes, 'رقم الشيك / مرجع التحويل', v.cn || '', ncn)
        pushChange(changes, 'تاريخ الشيك / التحويل', v.cd || '', ncd)
        pushChange(changes, 'البنك', v.cb || '', ncb)
        pushChange(changes, 'الشخص الذي قام بالدفع', v.qui || '', nwho)
        pushChange(changes, 'المبلغ الحقيقي للعملية', v.colAmt ? dhs(v.colAmt) : '', namt ? dhs(namt) : '')
      }
    }
    if (!changes.length) E.push({ id: 'none', m: 'لم يتم تغيير أي قيمة في هذا القسم.' })
    if (E.length) return setState({ eErr: E })

    if (sec === 'identity') {
      r.prenom = ef.pre.trim()
      r.nom = ef.nom.trim()
    }
    if (sec === 'contact') r.tel = ef.tel
    if (sec === 'program') {
      r.hotel = ef.h
      r.vol = ef.v
      r.chambre = ef.c
      r.tarif = newTarif as number
      r.reduction = newRed
      r.convenu = newConv
    }
    if (sec === 'group') r.groupe = ef.grpChk ? ef.grp.trim() : ''
    if (sec === 'note') r.note = ef.note || ''
    if (sec === 'firstPayment') {
      const v = r.vers[0]
      v.mode = ef.mode
      if (ef.mode === 'نقد') {
        v.cn = ''
        v.cd = ''
        v.cb = ''
        v.qui = ''
        v.colAmt = 0
        v.sharedOperationId = ''
      } else {
        v.cn = ef.cn.trim()
        v.cd = ef.cd.trim()
        v.cb = ef.cb.trim()
        v.qui = ef.col ? ef.colWho.trim() : ''
        v.colAmt = ef.col ? Math.max(0, +ef.colAmt || 0) * 100 : 0
        v.sharedOperationId = ef.col ? sharedChequeId(v.cn, v.cd, v.cb) : ''
      }
    }

    const mod: Modification = {
      id: 'mod_' + Date.now(),
      rubrique: sec,
      rubriqueLabel: editSectionName(sec),
      changements: changes,
      motif: ef.reason.trim(),
      employe: user ? user.nom : '—',
      dateHeure: nowStr(),
    }
    r.modifications = Array.isArray(r.modifications) ? r.modifications : []
    r.modifications.unshift(mod)
    r.derniereModification = mod.dateHeure
    r.modifiePar = mod.employe
    db.audit = Array.isArray(db.audit) ? db.audit : []
    db.audit.unshift({
      t: mod.dateHeure,
      a: 'تعديل',
      d:
        'وصل ' +
        r.numero +
        ' — ' +
        mod.rubriqueLabel +
        ' — ' +
        changes.map((c) => c.champ + ': ' + (c.ancienne || '—') + ' ← ' + (c.nouvelle || '—')).join(' · ') +
        ' — السبب: ' +
        mod.motif,
      u: mod.employe,
    })
    save(db)
    setState({ db, modal: null, editId: null, editSection: '', eErr: [] })
    showToast('تم حفظ تعديل ' + mod.rubriqueLabel + ' مع الاحتفاظ بالتاريخ الكامل.')
  }

  /* ---------- annulation ---------- */
  const openCancel = () => setState({ modal: 'cx', cxErr: [], cxf: { m: '', p: '', refundMode: '' } })
  const openCancelFor = (id: string) =>
    setState({ curRecu: id, modal: 'cx', cxErr: [], cxf: { m: '', p: '', refundMode: '' } })
  const setCxf = (k: keyof CancelForm, val: string) => setState((s) => ({ cxf: { ...s.cxf, [k]: val } }))
  const cxH = {
    m: (e: React.ChangeEvent<HTMLTextAreaElement>) => setCxf('m', e.target.value),
    p: (e: React.ChangeEvent<HTMLInputElement>) => setCxf('p', e.target.value),
    refundMode: (e: React.ChangeEvent<HTMLSelectElement>) => setCxf('refundMode', e.target.value),
  }
  const doCancel = () => {
    const db = state.db
    const r = (db?.recus || []).find((x) => x.id === state.curRecu)
    if (!r || !db) return
    const cxf = state.cxf,
      user = state.user,
      E: FieldError[] = []
    if (!cxf.m.trim()) E.push({ id: 'm', m: 'سبب الإلغاء إجباري.' })
    if (!cxf.refundMode) E.push({ id: 'refundMode', m: 'اختر طريقة الاسترجاع.' })
    if (!cxf.p) E.push({ id: 'p', m: 'كلمة المرور إجبارية.' })
    if (E.length) return setState({ cxErr: E })
    if (!user || cxf.p !== user.pwd) return setState({ cxErr: [{ id: 'p', m: 'كلمة المرور غير صحيحة.' }] })
    r.statut = 'ملغى'
    r.motif = cxf.m.trim()
    r.annulePar = user.nom
    r.annuleLe = nowStr()
    r.refundMode = cxf.refundMode
    r.refundAmount = paye(r)
    db.cashMovements = Array.isArray(db.cashMovements) ? db.cashMovements : []
    if (cxf.refundMode === 'cash')
      db.cashMovements.push({
        id: 'refund_' + r.id + '_' + Date.now(),
        type: 'refund_cash',
        dayKey: dateKey(new Date()),
        date: today(),
        time: nowTime(),
        amount: r.refundAmount,
        receipt: r.numero,
        client: r.prenom + ' ' + r.nom,
        employee: user.nom,
      })
    log(
      'إلغاء',
      'وصل ' + r.numero + ' — ' + r.motif + ' — ' + (cxf.refundMode === 'cash' ? 'من الصندوق' : 'خارج الصندوق'),
    )
    save(db)
    setState({ modal: null, screen: 'home' })
    showToast('تم إلغاء الوصل ' + r.numero + '. الرقم لن يُستعمل مجددًا.')
  }

  /* ---------- affichage / impression du reçu ---------- */
  const openRecu = (id: string, original: boolean) =>
    setState({ curRecu: id, curOriginal: !!original, screen: 'recu' })
  const doPrint = () => {
    const db = state.db
    const r = (db?.recus || []).find((x) => x.id === state.curRecu)
    if (r && db) {
      r.impressions = (r.impressions || 0) + 1
      log('طباعة', 'وصل ' + r.numero + ' — طباعة رقم ' + r.impressions)
      save(db)
    }
    setState({}, () => window.print())
  }

  /* =====================================================================
     Valeurs de rendu — équivalent de renderVals() du prototype.
     ===================================================================== */
  const s = state,
    db: Db = s.db || {
      prochainNumero: 1,
      recus: [],
      clients: [],
      cashMovements: [],
      financePrints: [],
      financeAnomalyAcks: {},
      audit: [],
    }
  const inp = (bad: boolean) => (bad ? badInputStyle : okInputStyle)

  let rows = (db.recus || []).filter((r) => (s.showCx ? true : r.statut !== 'ملغى'))
  if (s.qn.trim()) rows = rows.filter((r) => (r.prenom + ' ' + r.nom).includes(s.qn.trim()))
  if (s.qr.trim()) rows = rows.filter((r) => String(r.numero).includes(s.qr.trim()))
  rows = rows.slice().sort((a, b) => b.numero - a.numero)
  const viewRows = rows.map((r) => {
    const p = paye(r),
      rs = rest(r),
      st = stat(r),
      cxd = r.statut === 'ملغى'
    const noPay = cxd || rs === 0 || r.vers.length >= MAX_VERS
    const B = (
      {
        'غير مكتمل': { bg: '#E6EEF2', c: '#2E5870' },
        مسدد: { bg: '#EDF0E5', c: '#2E3B27' },
        ملغى: { bg: '#F7E8E5', c: '#9C3B32' },
      } as Record<string, { bg: string; c: string }>
    )[st]
    return {
      id: r.id,
      numero: r.numero,
      fullname: r.prenom + ' ' + r.nom,
      convenu: dh(r.convenu),
      payeStr: dh(p),
      restStr: dh(rs),
      restColor: rs === 0 ? '#6E7565' : '#9C3B32',
      restWeight: rs === 0 ? 400 : 600,
      date: r.date,
      versCount: r.vers.length,
      maxVers: MAX_VERS,
      statusLabel: st,
      statusBg: B.bg,
      statusColor: B.c,
      hotel: r.hotel,
      chambre: r.chambre,
      vol: r.vol,
      rabatteur: r.rabatteur,
      note: r.note || '—',
      employe: r.employe || '—',
      reduction: r.reduction ? dh(r.reduction) : '—',
      tel: r.tel,
      groupe: r.groupe || '—',
      cx: cxd,
      noPay,
      noEdit: cxd,
      noCancel: cxd,
      rowOpacity: cxd ? 0.5 : 1,
      noColor: cxd ? '#6E7565' : '#A3801F',
      payOpacity: noPay ? 0.3 : 1,
      editOpacity: cxd ? 0.3 : 1,
      cancelOpacity: cxd ? 0.3 : 1,
      openDetail: () => setState({ modal: 'detail', detailId: r.id }),
      stopRowEvent: (e: React.SyntheticEvent) => {
        e?.stopPropagation?.()
      },
      openPrint: (e: React.SyntheticEvent) => {
        e?.stopPropagation?.()
        openRecu(r.id, false)
      },
      openPayRow: (e: React.SyntheticEvent) => {
        e.stopPropagation()
        if (!noPay) openPayFor(r.id)
      },
      openEditRow: (e: React.SyntheticEvent) => {
        e.stopPropagation()
        if (!cxd) openEdit(r.id)
      },
      openCancelRow: (e: React.SyntheticEvent) => {
        e.stopPropagation()
        if (!cxd) openCancelFor(r.id)
      },
    }
  })
  const actCount = (db.recus || []).filter((r) => r.statut !== 'ملغى').length,
    cxCount = (db.recus || []).length - actCount

  const nf = s.nf
  const passportDraft = s.passportDraft || blankPassport()
  const passportH = {
    pre: (e: React.ChangeEvent<HTMLInputElement>) => setPassportDraft('pre', e.target.value),
    nom: (e: React.ChangeEvent<HTMLInputElement>) => setPassportDraft('nom', e.target.value),
    number: (e: React.ChangeEvent<HTMLInputElement>) => setPassportDraft('number', e.target.value),
    nationality: (e: React.ChangeEvent<HTMLInputElement>) => setPassportDraft('nationality', e.target.value),
    birthDate: (e: React.ChangeEvent<HTMLInputElement>) => setPassportDraft('birthDate', e.target.value),
    birthPlace: (e: React.ChangeEvent<HTMLInputElement>) => setPassportDraft('birthPlace', e.target.value),
    issueDate: (e: React.ChangeEvent<HTMLInputElement>) => setPassportDraft('issueDate', e.target.value),
    expiryDate: (e: React.ChangeEvent<HTMLInputElement>) => setPassportDraft('expiryDate', e.target.value),
    issuingCountry: (e: React.ChangeEvent<HTMLInputElement>) => setPassportDraft('issuingCountry', e.target.value),
    sex: (e: React.ChangeEvent<HTMLInputElement>) => setPassportDraft('sex', e.target.value),
    mrz: (e: React.ChangeEvent<HTMLTextAreaElement>) => setPassportDraft('mrz', e.target.value),
  }
  const nBad = new Set(s.nErr.map((e) => e.id))
  const nSty = {
    pre: inp(nBad.has('pre')),
    nom: inp(nBad.has('nom')),
    tel: inp(nBad.has('tel')),
    h: inp(nBad.has('h')),
    v: inp(nBad.has('v')),
    c: inp(nBad.has('c')),
    rab: inp(nBad.has('rab')),
    red: inp(nBad.has('red')),
    grp: inp(nBad.has('grp')),
    pay: inp(nBad.has('pay')),
    mode: inp(false),
    cn: inp(nBad.has('cn')),
    cd: inp(nBad.has('cd')),
    cb: inp(nBad.has('cb')),
    colWho: inp(nBad.has('colWho')),
    colAmt: inp(nBad.has('colAmt')),
  }
  const nTarC = getTarif(nf.h, nf.v, nf.c),
    nRed = Math.max(0, +nf.red || 0) * 100
  const nAll = !!(nf.h && nf.v && nf.c)
  const nConvC = nTarC === null ? null : nTarC - nRed,
    nPayC = Math.max(0, +nf.pay || 0) * 100

  const pf = s.pf
  const pBad = new Set(s.pErr.map((e) => e.id))
  const pSty = {
    no: inp(pBad.has('no')),
    amt: inp(pBad.has('amt')),
    mode: inp(false),
    cn: inp(pBad.has('cn')),
    cd: inp(pBad.has('cd')),
    cb: inp(pBad.has('cb')),
    colWho: inp(pBad.has('colWho')),
    colAmt: inp(pBad.has('colAmt')),
  }
  let pWarnMsg = '',
    pFoundR: Recu | null = null
  const pnoTrim = pf.no.trim()
  if (pnoTrim) {
    pFoundR = (db.recus || []).find((x) => String(x.numero) === pnoTrim) || null
    if (!pFoundR) pWarnMsg = 'هذا الرقم غير موجود.'
    else if (pFoundR.statut === 'ملغى') pWarnMsg = 'هذا الوصل ملغى — لا يمكن إضافة دفعة.'
    else if (rest(pFoundR) === 0) pWarnMsg = 'هذا الوصل مسدد بالكامل — لا يمكن إضافة دفعة.'
    else if (pFoundR.vers.length >= MAX_VERS) pWarnMsg = 'بلغ هذا الوصل الحد الأقصى: ' + MAX_VERS + ' دفعات.'
  }
  const pOk = !!pFoundR && !pWarnMsg
  const pAmtC = Math.max(0, +pf.amt || 0) * 100
  const pPaymentRows: {
    n: number
    date: string
    amount: string
    mode: string
    details: string
    status: string
    badgeBg: string
    badgeColor: string
    rowStyle: string
  }[] = []
  if (pFoundR) {
    const existing = Array.isArray(pFoundR.vers) ? pFoundR.vers : []
    const nextIndex = existing.length
    const detailsFor = (v: Partial<Versement> | null) => {
      if (!v || receiptMethodLabel(v.mode || '') === 'نقد') return '—'
      const parts: string[] = []
      if (v.cn) parts.push(v.cn)
      if (v.cd) parts.push(v.cd)
      if (v.cb) parts.push(v.cb)
      return parts.length ? parts.join(' · ') : '—'
    }
    for (let i = 0; i < MAX_VERS; i++) {
      const saved = existing[i]
      if (saved) {
        pPaymentRows.push({
          n: i + 1,
          date: saved.date || '—',
          amount: dhs(Number(saved.montant) || 0),
          mode: receiptMethodLabel(saved.mode) || '—',
          details: detailsFor(saved),
          status: 'مسجلة',
          badgeBg: '#EDF0E5',
          badgeColor: '#47593C',
          rowStyle: 'background:#fff;color:#1C2117',
        })
      } else if (pOk && i === nextIndex) {
        const preview = { mode: pf.mode, cn: pf.cn, cd: pf.cd, cb: pf.cb }
        pPaymentRows.push({
          n: i + 1,
          date: today(),
          amount: pf.amt.trim() ? dhs(pAmtC) : '—',
          mode: receiptMethodLabel(pf.mode) || '—',
          details: detailsFor(preview),
          status: 'معاينة مباشرة',
          badgeBg: '#F6EEDA',
          badgeColor: '#A3801F',
          rowStyle: 'background:#FFF9E9;color:#1C2117',
        })
      } else {
        pPaymentRows.push({
          n: i + 1,
          date: '—',
          amount: '—',
          mode: '—',
          details: '—',
          status: 'غير مستعملة',
          badgeBg: '#F1F1EC',
          badgeColor: '#9CA28F',
          rowStyle: 'background:#FCFCFA;color:#9CA28F',
        })
      }
    }
  }

  const cxf = s.cxf
  const cxBad = new Set(s.cxErr.map((e) => e.id))

  const editR = (db.recus || []).find((x) => x.id === s.editId)
  const ef = s.ef
  const eBad = new Set((s.eErr || []).map((e) => e.id))
  const eSty = {
    pre: inp(eBad.has('pre')),
    nom: inp(eBad.has('nom')),
    tel: inp(eBad.has('tel')),
    h: inp(eBad.has('h')),
    v: inp(eBad.has('v')),
    c: inp(eBad.has('c')),
    red: inp(eBad.has('red')),
    grp: inp(eBad.has('grp')),
    note: inp(eBad.has('note')),
    mode: inp(eBad.has('mode')),
    cn: inp(eBad.has('cn')),
    cd: inp(eBad.has('cd')),
    cb: inp(eBad.has('cb')),
    colWho: inp(eBad.has('colWho')),
    colAmt: inp(eBad.has('colAmt')),
    reason: inp(eBad.has('reason')),
  }
  const eTar = getTarif(ef.h, ef.v, ef.c),
    eRed = Math.max(0, +ef.red || 0) * 100,
    eConv = eTar === null ? null : eTar - eRed

  const detailR = (db.recus || []).find((x) => x.id === s.detailId)
  let detailVals: DetailVals | null = null
  if (detailR) {
    const paid = paye(detailR),
      remaining = rest(detailR),
      status = stat(detailR),
      cancelled = detailR.statut === 'ملغى'
    const statusTheme =
      (
        {
          'غير مكتمل': { bg: '#E6EEF2', c: '#2E5870' },
          مسدد: { bg: '#EDF0E5', c: '#2E3B27' },
          ملغى: { bg: '#F7E8E5', c: '#9C3B32' },
        } as Record<string, { bg: string; c: string }>
      )[status] || { bg: '#F1F1EC', c: '#6E7565' }
    const stamp = String(detailR.heure || '').trim()
    const timeMatch = stamp.match(/(\d{2}:\d{2})/)
    const registrationTime = timeMatch ? timeMatch[1] : stamp || 'غير متوفر'
    const modifications = Array.isArray(detailR.modifications) ? detailR.modifications : []
    const payments = (Array.isArray(detailR.vers) ? detailR.vers : []).map((v, i) => ({
      n: v.n || i + 1,
      date: v.date || '—',
      amount: dhs(Number(v.montant) || 0),
      mode: receiptMethodLabel(v.mode) || '—',
      reference: v.cn || '—',
      instrumentDate: v.cd || '—',
      bank: v.cb || '—',
      payer: v.qui || '—',
      operationAmount: v.colAmt ? dhs(Number(v.colAmt) || 0) : '—',
      employee: v.par || '—',
    }))
    detailVals = {
      detailNumber: detailR.numero,
      detailDate: detailR.date || '—',
      detailTime: registrationTime,
      detailStatus: status,
      detailStatusBg: statusTheme.bg,
      detailStatusColor: statusTheme.c,
      detailFullName: (detailR.prenom || '') + ' ' + (detailR.nom || ''),
      detailClientId: detailR.clientId || '—',
      detailHasPhoto: !!(detailR.passport && detailR.passport.portraitImage),
      detailNoPhoto: !(detailR.passport && detailR.passport.portraitImage),
      detailPhoto: detailR.passport && detailR.passport.portraitImage ? detailR.passport.portraitImage : '',
      detailPassportStatus: detailR.passport ? 'مسجل ومحفوظ' : 'غير مضاف بعد',
      detailPassportColor: detailR.passport ? '#47593C' : '#9CA28F',
      detailPhone: detailR.tel || '—',
      detailGroup: detailR.groupe || '—',
      detailReferrer: detailR.rabatteur || '—',
      detailNote: detailR.note || '—',
      detailHotel: detailR.hotel || '—',
      detailRoom: detailR.chambre || '—',
      detailFlight: detailR.vol || '—',
      detailSeason: SAISON.nom,
      detailOriginalAmount: dhs(Number(detailR.tarif) || 0),
      detailDiscount: dhs(Number(detailR.reduction) || 0),
      detailAgreed: dhs(Number(detailR.convenu) || 0),
      detailPaid: dhs(paid),
      detailRemaining: dhs(remaining),
      detailRemainingBg: remaining > 0 ? '#F7E8E5' : '#EDF0E5',
      detailRemainingColor: remaining > 0 ? '#9C3B32' : '#47593C',
      detailPaymentCount: payments.length + ' / ' + MAX_VERS,
      detailEmployee: detailR.employe || '—',
      detailPrintCount: String(detailR.impressions || 0),
      detailModified: modifications.length > 0,
      detailNotModified: modifications.length === 0,
      detailModCount: modifications.length,
      detailLastModification: detailR.derniereModification || '—',
      detailModifiedBy: detailR.modifiePar || '—',
      detailPayments: payments,
      detailModifications: modifications.map((m) => ({
        section: m.rubriqueLabel || m.rubrique || 'تعديل',
        dateTime: m.dateHeure || '—',
        employee: m.employe || '—',
        reason: m.motif || '—',
        changes: (Array.isArray(m.changements) ? m.changements : []).map((c) => ({
          field: c.champ || 'الحقل',
          oldValue: c.ancienne || '—',
          newValue: c.nouvelle || '—',
        })),
      })),
      detailCancelled: cancelled,
      detailCancelReason: detailR.motif || '—',
      detailCancelledBy: detailR.annulePar || '—',
      detailCancelledAt: detailR.annuleLe || '—',
    }
  }

  /* ---------- page المالية / الصندوق ---------- */
  const now = new Date(),
    todayKey = dateKey(now)
  const yday = new Date(now)
  yday.setDate(yday.getDate() - 1)
  const yesterdayKey = dateKey(yday)
  const weekendStart = new Date(now)
  const dow = weekendStart.getDay()
  if (dow === 6) {
    /* déjà samedi */
  } else if (dow === 0) weekendStart.setDate(weekendStart.getDate() - 1)
  else weekendStart.setDate(weekendStart.getDate() - (dow + 1))
  const weekendEnd = new Date(weekendStart)
  weekendEnd.setDate(weekendEnd.getDate() + 1)
  const weekendStartKey = dateKey(weekendStart),
    weekendEndKey = dateKey(weekendEnd)
  const inFinanceRange = (key: string) => {
    if (!key) return false
    if (s.financeFilter === 'day') return key === (s.financeDay || todayKey)
    if (s.financeFilter === 'weekend') return key >= weekendStartKey && key <= weekendEndKey
    if (s.financeFilter === 'custom') {
      const a = s.financeFrom || s.financeTo,
        b = s.financeTo || s.financeFrom
      if (!a && !b) return false
      const lo = a <= b ? a : b,
        hi = a <= b ? b : a
      return key >= lo && key <= hi
    }
    return true
  }
  interface FinanceRaw {
    id: string
    r: Recu
    v: Versement
    i: number
    snap: Partial<Snapshot>
    mode: string
    key: string
    time: string
    operationKey: string
    sortDateTime: string
    idStamp: number
    sortSequence: number
  }
  const allFinanceRows: FinanceRaw[] = []
  let financeSequence = 0
  ;(db.recus || []).forEach((r) =>
    (r.vers || []).forEach((v, i) => {
      const snap = v.snapshot || {},
        mode = receiptMethodLabel(v.mode),
        dateTimeText = String(v.dateHeure || ''),
        dateMatch = dateTimeText.match(/(\d{2}\/\d{2}\/\d{4})/),
        key = frDateKey(v.date || (dateMatch ? dateMatch[1] : ''))
      let time = String(v.heure || '').trim()
      if (!time) {
        const mt = dateTimeText.match(/(\d{2}:\d{2})/)
        if (mt) time = mt[1]
      }
      if (!time && i === 0) {
        const mt = String(r.heure || '').match(/(\d{2}:\d{2})/)
        if (mt) time = mt[1]
      }
      let operationKey = ''
      if (mode === 'شيك') {
        if (Number(v.colAmt) > 0) {
          operationKey = String(v.sharedOperationId || sharedChequeId(v.cn, v.cd, v.cb))
        } else {
          operationKey = 'cheque|' + financeMovementId(r, v, i)
        }
      }
      const idMatch = String(v.id || '').match(/(\d{10,})$/),
        idStamp = idMatch ? Number(idMatch[1]) : 0,
        sortDateTime = (key || '0000-00-00') + 'T' + (time || '00:00')
      allFinanceRows.push({
        id: financeMovementId(r, v, i),
        r,
        v,
        i,
        snap,
        mode,
        key,
        time: time || '—',
        operationKey,
        sortDateTime,
        idStamp,
        sortSequence: financeSequence++,
      })
    }),
  )
  const filteredFinance = allFinanceRows
    .filter((x) => inFinanceRange(x.key))
    .sort((a, b) => {
      if (a.sortDateTime !== b.sortDateTime) return a.sortDateTime < b.sortDateTime ? 1 : -1
      if (a.idStamp !== b.idStamp) return b.idStamp - a.idStamp
      return b.sortSequence - a.sortSequence
    })
  const cashRefundRows = (db.cashMovements || []).filter(
    (m) => m.type === 'refund_cash' && inFinanceRange(m.dayKey),
  )
  const sumMode = (mode: string) =>
    filteredFinance.filter((x) => x.mode === mode).reduce((sum, x) => sum + (Number(x.v.montant) || 0), 0)
  const financeCashC = sumMode('نقد'),
    financeTransferC = sumMode('تحويل بنكي'),
    financeCashRefundC = cashRefundRows.reduce((sum, m) => sum + (Number(m.amount) || 0), 0),
    financeCashNetC = financeCashC - financeCashRefundC
  const chequeMap = new Map<string, FinanceRaw[]>()
  filteredFinance
    .filter((x) => x.mode === 'شيك')
    .forEach((x) => {
      const k = x.operationKey
      if (!chequeMap.has(k)) chequeMap.set(k, [])
      chequeMap.get(k)!.push(x)
    })
  let financeChequeActualC = 0
  Array.from(chequeMap.values()).forEach((group) => {
    const distributed = group.reduce((sum, x) => sum + (Number(x.v.montant) || 0), 0),
      declared = group.map((x) => Number(x.v.colAmt) || 0).filter(Boolean),
      actual = declared.length ? Math.max(...declared) : distributed
    financeChequeActualC += actual
  })
  const financeGrandTotalC = financeCashNetC + financeChequeActualC + financeTransferC
  const financeModificationCount = (db.recus || []).reduce(
    (count, r) =>
      count +
      (Array.isArray(r.modifications)
        ? r.modifications.filter((m) => {
            const md = String(m.dateHeure || '').match(/(\d{2}\/\d{2}\/\d{4})/)
            return !!(md && inFinanceRange(frDateKey(md[1])))
          }).length
        : 0),
    0,
  )
  const cancelledInRange = (db.recus || []).filter((r) => {
    if (r.statut !== 'ملغى') return false
    const md = String(r.annuleLe || '').match(/(\d{2}\/\d{2}\/\d{4})/)
    return !!(md && inFinanceRange(frDateKey(md[1])))
  })
  const financeCancelRows = cancelledInRange.map((r) => {
    const md = String(r.annuleLe || '').match(/(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}))?/),
      modes = [...new Set((r.vers || []).map((v) => receiptMethodLabel(v.mode)))],
      cash = (r.vers || [])
        .filter((v) => receiptMethodLabel(v.mode) === 'نقد')
        .reduce((sum, v) => sum + (Number(v.montant) || 0), 0),
      bank = (r.vers || [])
        .filter((v) => receiptMethodLabel(v.mode) !== 'نقد')
        .reduce((sum, v) => sum + (Number(v.montant) || 0), 0),
      real = Math.max(0, ...(r.vers || []).map((v) => Number(v.colAmt) || 0)),
      infos = [
        ...new Set(
          (r.vers || [])
            .filter((v) => receiptMethodLabel(v.mode) !== 'نقد')
            .map((v) => (v.cb || '—') + ' / ' + (v.cn || '—')),
        ),
      ],
      route = r.refundMode === 'cash' ? 'من الصندوق' : 'خارج الصندوق'
    return {
      time: md && md[2] ? md[2] : '—',
      date: md ? md[1] : '—',
      receipt: r.numero,
      client: (r.prenom || '') + ' ' + (r.nom || ''),
      cashAmount: cash ? dh(cash) : '—',
      bankAmount: bank ? dh(bank) : '—',
      modeCode: modes.map((m) => (m === 'نقد' ? 'E' : m === 'تحويل بنكي' ? 'V' : 'CH')).join('/'),
      realCheque: real ? dh(real) : '—',
      checkInfo: route + ' / ' + (infos.length ? infos.join(' · ') : r.motif || '—'),
      employee: r.annulePar || r.employe || '—',
      rabatteur: r.rabatteur || '—',
      hotel: r.hotel || '—',
      room: r.chambre || '—',
      flight: r.vol || '—',
      agreed: dh(Number(r.convenu) || 0),
      remaining: '0',
    }
  })
  const selectedDayKey = s.financeFilter === 'day' ? s.financeDay || todayKey : ''
  const isAdmin = !!s.user && (s.user.id === 'admin' || s.user.role === 'مدير')
  const printsForDay = selectedDayKey
    ? (db.financePrints || [])
        .filter((p) => p.dayKey === selectedDayKey)
        .slice()
        .sort(
          (a, b) =>
            (Number(b.printNo) || 0) - (Number(a.printNo) || 0) ||
            String(b.printedAt || '').localeCompare(String(a.printedAt || '')),
        )
    : []
  const lastPrint = printsForDay[0] || null
  const pendingAnomalyIds = selectedDayKey ? financePendingAnomalyIds(selectedDayKey) : []
  const anomalyPending = !!(isAdmin && selectedDayKey && lastPrint && pendingAnomalyIds.length)
  const financeRows = filteredFinance.map((x) => {
    const sp = x.snap || {},
      isNew = x.i === 0,
      payBadge = isNew ? 'N' : String(x.i + 1),
      modeCode =
        x.mode === 'نقد' ? 'E' : x.mode === 'تحويل بنكي' ? 'V' : Number(x.v.colAmt) > 0 ? 'CH-P' : 'CH',
      isCheque = x.mode === 'شيك',
      isTransfer = x.mode === 'تحويل بنكي',
      after = anomalyPending && pendingAnomalyIds.includes(x.id)
    return {
      time: x.time,
      date: x.v.date || '—',
      receipt: x.r.numero,
      paymentBadge: payBadge,
      paymentBadgeClass: isNew ? 'gray' : 'plain',
      client: sp.client || (x.r.prenom || '') + ' ' + (x.r.nom || ''),
      modeCode,
      cashAmount: x.mode === 'نقد' ? dh(Number(x.v.montant) || 0) : '—',
      bankAmount: isCheque || isTransfer ? dh(Number(x.v.montant) || 0) : '—',
      realCheque: isCheque && Number(x.v.colAmt) > 0 ? dh(Number(x.v.colAmt) || 0) : '—',
      checkInfo: isCheque || isTransfer ? (x.v.cb || '—') + ' / ' + (x.v.cn || '—') : '—',
      employee: x.v.par || x.r.employe || '—',
      rabatteur: sp.rabatteur || x.r.rabatteur || '—',
      hotel: sp.hotel || x.r.hotel || '—',
      room: sp.room || x.r.chambre || '—',
      flight: sp.flight || x.r.vol || '—',
      agreed: dh(Number(sp.agreed != null ? sp.agreed : x.r.convenu) || 0),
      remaining: dh(Number(sp.remainingAfter != null ? sp.remainingAfter : Math.max(0, rest(x.r))) || 0),
      statusSymbol: sp.statusAfter || ((sp.remainingAfter || 0) === 0 ? '✓' : '•'),
      statusBadgeClass: sp.statusAfter === '✓' || Number(sp.remainingAfter) === 0 ? 'gray' : 'plain',
      rowClass: after ? 'finance-anomaly-row' : '',
      afterLastPrint: after,
      opacity: 1,
      openClient: () => setState({ modal: 'detail', detailId: x.r.id }),
    }
  })
  const financeNewClientCount = filteredFinance.filter((x) => x.i === 0).length,
    financeLastReceipt = filteredFinance.length
      ? Math.max(...filteredFinance.map((x) => Number(x.r.numero) || 0))
      : '—'
  let financeRangeLabel = 'كل الفترات'
  if (s.financeFilter === 'day') financeRangeLabel = keyToFr(s.financeDay || todayKey)
  if (s.financeFilter === 'weekend')
    financeRangeLabel = keyToFr(weekendStartKey) + ' إلى ' + keyToFr(weekendEndKey)
  if (s.financeFilter === 'custom')
    financeRangeLabel =
      s.financeFrom || s.financeTo
        ? keyToFr(s.financeFrom || s.financeTo) + ' إلى ' + keyToFr(s.financeTo || s.financeFrom)
        : 'اختر فترة'
  const filterTheme = (name: string) =>
    s.financeFilter === name
      ? { bg: '#47593C', c: '#fff', b: '#47593C' }
      : { bg: '#fff', c: '#47593C', b: '#E7E3D6' }
  const fw = filterTheme('weekend'),
    fc = filterTheme('custom'),
    fa = filterTheme('all')
  const printCount = printsForDay.length,
    printCode = String(printCount || 1).padStart(2, '0'),
    financeCanPrint =
      !!selectedDayKey && (isAdmin || selectedDayKey === todayKey || selectedDayKey === yesterdayKey)
  let financePrintStateSymbol = '●',
    financeStatusColor = '#2E78B7',
    indicator = '#2E78B7'
  if (anomalyPending) {
    financePrintStateSymbol = '?'
    financeStatusColor = '#D6A300'
    indicator = '#D6A300'
  } else if (selectedDayKey === todayKey) {
    financePrintStateSymbol = '✓'
    financeStatusColor = '#45D600'
    indicator = '#45D600'
  }

  const cur = (db.recus || []).find((x) => x.id === s.curRecu)
  let curVals: CurVals | null = null
  if (cur) {
    const rs = rest(cur),
      st = stat(cur),
      cxd = cur.statut === 'ملغى'
    curVals = {
      curNum: cur.numero,
      curDate: cur.date,
      curName: cur.prenom + ' ' + cur.nom,
      curConv: dhs(cur.convenu),
      curPaye: dhs(paye(cur)),
      curRest: dhs(rs),
      curRestColor: rs > 0 ? '#9C3B32' : '#1C2117',
      curChambre: cur.chambre,
      curHotel: cur.hotel,
      curVol: cur.vol,
      curDuree: SAISON.duree,
      curRab: cur.rabatteur,
      curRed: dhs(cur.reduction),
      curTel: cur.tel,
      curVersLabel: cur.vers.length + ' / ' + MAX_VERS,
      curCancelled: cxd,
      curCancelLabel: 'ملغى — ' + cur.motif,
      curSolde: st === 'مسدد',
      curPrinted: cur.impressions > 0,
      curPrintLabel: 'طُبع ' + cur.impressions + ' مرة',
      curWaiting: cur.vers.length < MAX_VERS && rs > 0 && !cxd,
      curNextVersNum: cur.vers.length + 1,
      isCopy: !s.curOriginal,
      copyLabel: 'نسخة' + (cur.impressions > 0 ? ' — طباعة رقم ' + (cur.impressions + 1) : ''),
      showCancelBtn: !cxd,
      showEditBtn: !cxd,
      showAddPayBtn: !(cxd || rs === 0 || cur.vers.length >= MAX_VERS),
      verRows: cur.vers.map((v) => ({
        n: v.n,
        montant: dh(v.montant),
        date: v.date,
        mode: v.mode,
        cn: v.cn || '—',
        cd: v.cd || '—',
        cb: v.cb || '—',
        qui: v.qui ? v.qui + (v.colAmt ? ' · شيك ' + dhs(v.colAmt) : '') : '—',
      })),
      receiptFrameHtml: buildReceiptHtml(cur),
    }
  }

  return {
    isLogin: s.screen === 'login',
    isHome: s.screen === 'home',
    isStats: s.screen === 'stats',
    isFinance: s.screen === 'finance',
    isRecu: s.screen === 'recu',
    loginU: s.loginU,
    loginP: s.loginP,
    loginErr: s.loginErr,
    onLoginU: (e: React.ChangeEvent<HTMLInputElement>) => setState({ loginU: e.target.value }),
    onLoginP: (e: React.ChangeEvent<HTMLInputElement>) => setState({ loginP: e.target.value }),
    onLoginKey: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') doLogin()
    },
    doLogin,
    uav: s.user ? s.user.ini : '–',
    unm: s.user ? s.user.nom : '–',
    urole: s.user ? s.user.role : '–',
    seasonLabel: 'الموسم النشط — ' + SAISON.nom,
    openLog: () => setState({ modal: 'log' }),
    logout,
    qn: s.qn,
    qr: s.qr,
    onQn: (e: React.ChangeEvent<HTMLInputElement>) => setState({ qn: e.target.value }),
    onQr: (e: React.ChangeEvent<HTMLInputElement>) => setState({ qr: e.target.value }),
    openPay,
    openNew,
    goFinance,
    goStats,
    rows: viewRows,
    rowsEmpty: viewRows.length === 0,
    detail: detailVals,
    subLabel: actCount + ' وصل نشط · ' + cxCount + ' ملغى',
    cntLabel: 'عرض ' + viewRows.length + ' من ' + actCount,
    cxBtnLabel: s.showCx ? 'إخفاء الملغاة' : 'عرض الوصولات الملغاة (' + cxCount + ')',
    toggleCx: () => setState((st) => ({ showCx: !st.showCx })),

    goHome,
    doPrint,
    openCancel,
    openPayForCur,
    openEditCur,
    financeToday: () => setState({ financeFilter: 'day', financeDay: dateKey(new Date()) }),
    financeYesterday: () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      setState({ financeFilter: 'day', financeDay: dateKey(d) })
    },
    financeWeekend: () => setState({ financeFilter: 'weekend' }),
    financeCustom: () => setState({ financeFilter: 'custom' }),
    financeAll: () => setState({ financeFilter: 'all' }),
    financePrevDay: () => shiftFinanceDay(-1),
    financeNextDay: () => shiftFinanceDay(1),
    onFinanceDay: (e: React.ChangeEvent<HTMLInputElement>) =>
      setState({ financeDay: e.target.value, financeFilter: 'day' }),
    financeDay: s.financeDay || todayKey,
    printFinance,
    acknowledgeFinanceAnomaly,
    confirmFinanceAnomaly,
    onFinanceFrom: (e: React.ChangeEvent<HTMLInputElement>) =>
      setState({ financeFrom: e.target.value, financeFilter: 'custom' }),
    onFinanceTo: (e: React.ChangeEvent<HTMLInputElement>) =>
      setState({ financeTo: e.target.value, financeFilter: 'custom' }),
    financeFrom: s.financeFrom,
    financeTo: s.financeTo,
    financeCustomVisible: s.financeFilter === 'custom',
    financeRangeLabel,
    financeTodayBg: selectedDayKey === todayKey ? '#47593C' : '#fff',
    financeTodayColor: selectedDayKey === todayKey ? '#fff' : '#47593C',
    financeTodayBorder: selectedDayKey === todayKey ? '#47593C' : '#E7E3D6',
    financeYesterdayBg: selectedDayKey === yesterdayKey ? '#47593C' : '#fff',
    financeYesterdayColor: selectedDayKey === yesterdayKey ? '#fff' : '#47593C',
    financeYesterdayBorder: selectedDayKey === yesterdayKey ? '#47593C' : '#E7E3D6',
    financeWeekendBg: fw.bg,
    financeWeekendColor: fw.c,
    financeWeekendBorder: fw.b,
    financeCustomBg: fc.bg,
    financeCustomColor: fc.c,
    financeCustomBorder: fc.b,
    financeAllBg: fa.bg,
    financeAllColor: fa.c,
    financeAllBorder: fa.b,
    financeIndicatorBg: indicator,
    financePrintStateSymbol,
    financeStatusColor,
    financePrintDisabled: !financeCanPrint,
    financePrintBg: financeCanPrint ? '#47593C' : '#9CA28F',
    financePrintOpacity: financeCanPrint ? 1 : 0.45,
    financeCopyShow: printCount > 0,
    financeCopyDisplay: (printCount > 1 ? '⧉ ' : '') + printCode,
    financePrintCode: printCode,
    financePrintMark: printCount ? (printCount > 1 ? '⧉ ' : '') + printCode : '',
    financePrintFooterCode: printCount ? printCode : '',
    financeAnomalyShow: anomalyPending,
    financeAnomalyText: pendingAnomalyIds.length + ' عملية مالية غير مراجعة بعد الطباعة',
    financeAnomalyCount: pendingAnomalyIds.length,
    financeAnomalyDay: keyToFr(selectedDayKey),
    financeCashNet: dhs(financeCashNetC),
    financeCash: dhs(financeCashC),
    financeCashRefunds: dhs(financeCashRefundC),
    financeChequeActual: dhs(financeChequeActualC),
    financeTransfer: dhs(financeTransferC),
    financeGrandTotal: dhs(financeGrandTotalC),
    financeCashCount: filteredFinance.filter((x) => x.mode === 'نقد').length,
    financeRefundCount: cashRefundRows.length,
    financeTransferCount: filteredFinance.filter((x) => x.mode === 'تحويل بنكي').length,
    financeChequeOperationCount: chequeMap.size,
    financeNewClientCount,
    financePaymentCount: filteredFinance.length,
    financeLastReceipt,
    financeModificationCount,
    financeRows,
    financeRowsEmpty: financeRows.length === 0,
    financeCancelRows,
    financeCancelShow: financeCancelRows.length > 0,
    financeCancelCount: financeCancelRows.length,
    cur: curVals,

    modalDetailOpen: s.modal === 'detail',
    modalFinanceAnomalyOpen: s.modal === 'financeAnomaly',
    modalNewOpen: s.modal === 'new',
    modalPassportOpen: s.modal === 'passport',
    modalPayOpen: s.modal === 'pay',
    modalCxOpen: s.modal === 'cx',
    modalLogOpen: s.modal === 'log',
    modalEditOpen: s.modal === 'edit',
    closeAll,
    overlayClick: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) closeAll()
    },
    openDetailReceipt: () => {
      const id = s.detailId
      if (id) setState({ modal: null, detailId: null, curRecu: id, curOriginal: false, screen: 'recu' })
    },
    todayLabel: today(),

    nf,
    nfH,
    nSty,
    nErr: s.nErr,
    nErrShow: s.nErr.length > 0,
    npv: db.prochainNumero,
    openPassportScan,
    backToNewFromPassport,
    passportOverlayClick: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) backToNewFromPassport()
    },
    onPassportFile,
    fillPassportDemo,
    applyPassportScan,
    removePassportScan,
    passportDraft,
    passportH,
    passportInputStyle: okInputStyle,
    passportTextareaStyle:
      okInputStyle + ';min-height:78px;resize:vertical;font-family:IBM Plex Mono,monospace;direction:ltr;text-align:left',
    passportHasOriginal: !!passportDraft.originalImage,
    passportNoOriginal: !passportDraft.originalImage,
    passportOriginal: passportDraft.originalImage || '',
    passportLinkedShow: !!nf.passportScan,
    passportPortrait:
      nf.passportScan && nf.passportScan.portraitImage ? nf.passportScan.portraitImage : makePassportPortrait('P'),
    passportDisplayName: nf.passportScan ? (nf.passportScan.pre || '') + ' ' + (nf.passportScan.nom || '') : '',
    passportNumberLabel: nf.passportScan && nf.passportScan.number ? nf.passportScan.number : '—',
    noPriceShow: nAll && nTarC === null,
    nTar: nTarC === null ? '— DH' : dhs(nTarC),
    nRedLabel: dhs(nRed),
    nConv: nConvC === null ? '— DH' : dhs(nConvC),
    nChqShow: nf.mode !== 'نقد',
    nChqRefLabel: nf.mode === 'تحويل بنكي' ? 'رقم العملية أو اسم المُحوِّل *' : 'رقم الشيك *',
    nPayLabel: dhs(nPayC),
    nRestLabel: nConvC === null ? '— DH' : dhs(Math.max(0, nConvC - nPayC)),
    saveNew,

    pf,
    pfH,
    pSty,
    pErr: s.pErr,
    pErrShow: s.pErr.length > 0,
    pnv: pf.no || '—',
    nfH_pNo: pfH.no,
    pWarnShow: !!pWarnMsg,
    pWarnMsg,
    pFoundShow: pOk,
    pFoundName: pFoundR ? pFoundR.prenom + ' ' + pFoundR.nom : '',
    pFoundConv: pFoundR ? dhs(pFoundR.convenu) : '',
    pFoundPaye: pFoundR ? dhs(paye(pFoundR)) : '',
    pFoundVers: pFoundR ? pFoundR.vers.length + ' / ' + MAX_VERS : '',
    pFoundAfter: pFoundR ? dhs(Math.max(0, rest(pFoundR) - pAmtC)) : '',
    pPaymentRows,
    pFormShow: pOk,
    pChqShow: pf.mode !== 'نقد',
    pChqRefLabel: pf.mode === 'تحويل بنكي' ? 'رقم العملية أو اسم المُحوِّل *' : 'رقم الشيك *',
    savePay,

    cxf,
    cxH,
    cancelPaidAmount: cur ? dhs(paye(cur)) : '—',
    cxSty: { m: inp(cxBad.has('m')), p: inp(cxBad.has('p')), refundMode: inp(cxBad.has('refundMode')) },
    cxErr: s.cxErr,
    cxErrShow: s.cxErr.length > 0,
    doCancel,

    ef,
    efH,
    eSty,
    eErr: s.eErr || [],
    eErrShow: (s.eErr || []).length > 0,
    editNum: editR ? editR.numero : '—',
    editDate: editR ? editR.date : '—',
    editRab: editR ? editR.rabatteur : '—',
    editFirstAmt: editR && editR.vers[0] ? dhs(editR.vers[0].montant) : '—',
    editChooseSection: !s.editSection,
    editSectionChosen: !!s.editSection,
    editSectionLabel: editSectionName(s.editSection),
    editIsIdentity: s.editSection === 'identity',
    editIsContact: s.editSection === 'contact',
    editIsProgram: s.editSection === 'program',
    editIsGroup: s.editSection === 'group',
    editIsNote: s.editSection === 'note',
    editIsFirstPayment: s.editSection === 'firstPayment',
    editIdentity: () => chooseEditSection('identity'),
    editContact: () => chooseEditSection('contact'),
    editProgram: () => chooseEditSection('program'),
    editGroup: () => chooseEditSection('group'),
    editNote: () => chooseEditSection('note'),
    editFirstPayment: () => chooseEditSection('firstPayment'),
    editBack: () => setState({ editSection: '', eErr: [] }),
    editPaymentDetails: ef.mode !== 'نقد',
    editPaymentRefLabel: ef.mode === 'تحويل بنكي' ? 'مرجع التحويل *' : 'رقم الشيك *',
    editNoPrice: !!(ef.h && ef.v && ef.c && eTar === null),
    editTarif: eTar === null ? '— DH' : dhs(eTar),
    editReduction: dhs(eRed),
    editConvenu: eConv === null ? '— DH' : dhs(eConv),
    editPaid: editR ? dhs(paye(editR)) : '—',
    saveEdit,

    auditLog: db.audit || [],
    auditEmpty: !(db.audit || []).length,
    toastShow: s.toast.show,
    toastMsg: s.toast.msg,
    toastBg: s.toast.bad ? '#9C3B32' : '#47593C',
  }
}

type DetailVals = {
  detailNumber: number
  detailDate: string
  detailTime: string
  detailStatus: string
  detailStatusBg: string
  detailStatusColor: string
  detailFullName: string
  detailClientId: string
  detailHasPhoto: boolean
  detailNoPhoto: boolean
  detailPhoto: string
  detailPassportStatus: string
  detailPassportColor: string
  detailPhone: string
  detailGroup: string
  detailReferrer: string
  detailNote: string
  detailHotel: string
  detailRoom: string
  detailFlight: string
  detailSeason: string
  detailOriginalAmount: string
  detailDiscount: string
  detailAgreed: string
  detailPaid: string
  detailRemaining: string
  detailRemainingBg: string
  detailRemainingColor: string
  detailPaymentCount: string
  detailEmployee: string
  detailPrintCount: string
  detailModified: boolean
  detailNotModified: boolean
  detailModCount: number
  detailLastModification: string
  detailModifiedBy: string
  detailPayments: {
    n: number
    date: string
    amount: string
    mode: string
    reference: string
    instrumentDate: string
    bank: string
    payer: string
    operationAmount: string
    employee: string
  }[]
  detailModifications: {
    section: string
    dateTime: string
    employee: string
    reason: string
    changes: { field: string; oldValue: string; newValue: string }[]
  }[]
  detailCancelled: boolean
  detailCancelReason: string
  detailCancelledBy: string
  detailCancelledAt: string
}

type CurVals = {
  curNum: number
  curDate: string
  curName: string
  curConv: string
  curPaye: string
  curRest: string
  curRestColor: string
  curChambre: string
  curHotel: string
  curVol: string
  curDuree: string
  curRab: string
  curRed: string
  curTel: string
  curVersLabel: string
  curCancelled: boolean
  curCancelLabel: string
  curSolde: boolean
  curPrinted: boolean
  curPrintLabel: string
  curWaiting: boolean
  curNextVersNum: number
  isCopy: boolean
  copyLabel: string
  showCancelBtn: boolean
  showEditBtn: boolean
  showAddPayBtn: boolean
  verRows: {
    n: number
    montant: string
    date: string
    mode: string
    cn: string
    cd: string
    cb: string
    qui: string
  }[]
  receiptFrameHtml: string
}

export type Vals = ReturnType<typeof useZemzem>
