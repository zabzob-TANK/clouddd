/** Structures de données du prototype (mêmes noms de champs, mêmes unités : centimes). */

export interface PassportScan {
  pre: string
  nom: string
  number: string
  nationality: string
  birthDate: string
  birthPlace: string
  issueDate: string
  expiryDate: string
  issuingCountry: string
  sex: string
  mrz: string
  originalImage: string
  portraitImage: string
  rawResult: unknown
  scanId: string
  scannedAt?: string
  scannedBy?: string
  status?: string
  linkedClientId?: string
  linkedReceiptNumber?: number
  linkedAt?: string
}

export interface Snapshot {
  client: string
  hotel: string
  room: string
  flight: string
  program: string
  agreed: number
  rabatteur: string
  remainingAfter: number
  statusAfter: string
}

export interface Versement {
  id: string
  n: number
  montant: number
  mode: string
  date: string
  heure: string
  dateHeure: string
  cn: string
  cd: string
  cb: string
  par: string
  qui: string
  colAmt: number
  sharedOperationId: string
  snapshot: Snapshot
}

export interface Changement {
  champ: string
  ancienne: string
  nouvelle: string
}

export interface Modification {
  id: string
  rubrique: string
  rubriqueLabel: string
  changements: Changement[]
  motif: string
  employe: string
  dateHeure: string
}

export interface Recu {
  id: string
  numero: number
  clientId: string
  passport: PassportScan | null
  prenom: string
  nom: string
  tel: string
  hotel: string
  vol: string
  chambre: string
  tarif: number
  reduction: number
  convenu: number
  rabatteur: string
  groupe: string
  date: string
  heure: string
  employe: string
  statut: string
  motif: string
  note: string
  impressions: number
  modifications: Modification[]
  vers: Versement[]
  derniereModification?: string
  modifiePar?: string
  annulePar?: string
  annuleLe?: string
  refundMode?: string
  refundAmount?: number
}

export interface Client {
  id: string
  nom: string
  prenom: string
  photoUrl: string
  passport: PassportScan | null
  createdAt: string
  createdBy: string
  receiptIds: string[]
}

export interface CashMovement {
  id: string
  type: string
  dayKey: string
  date: string
  time: string
  amount: number
  receipt: number
  client: string
  employee: string
}

export interface FinancePrint {
  id: string
  dayKey: string
  printedAt: string
  employee: string
  printNo: number
  movementIds: string[]
  rowCount: number
}

export interface AuditEntry {
  t: string
  a: string
  d: string
  u: string
}

export interface Db {
  prochainNumero: number
  recus: Recu[]
  clients: Client[]
  cashMovements: CashMovement[]
  financePrints: FinancePrint[]
  financeAnomalyAcks: Record<string, { movementIds: string[]; seenAt: string; user: string }>
  audit: AuditEntry[]
}

export interface SessionUser {
  id: string
  pwd: string
  nom: string
  role: string
  ini: string
}

export interface FieldError {
  id: string
  m: string
}

export interface NewForm {
  pre: string
  nom: string
  tel: string
  h: string
  v: string
  c: string
  rab: string
  red: string
  grpChk: boolean
  grp: string
  pay: string
  mode: string
  cn: string
  cd: string
  cb: string
  col: boolean
  colWho: string
  colAmt: string
  note: string
  passportScan: PassportScan | null
}

export interface PayForm {
  no: string
  amt: string
  mode: string
  cn: string
  cd: string
  cb: string
  col: boolean
  colWho: string
  colAmt: string
}

export interface CancelForm {
  m: string
  p: string
  refundMode: string
}

export interface EditForm {
  pre: string
  nom: string
  tel: string
  h: string
  v: string
  c: string
  red: string
  grpChk: boolean
  grp: string
  note: string
  mode: string
  cn: string
  cd: string
  cb: string
  col: boolean
  colWho: string
  colAmt: string
  reason: string
}

export type ScreenName = 'login' | 'home' | 'stats' | 'finance' | 'recu'
export type ModalName = null | 'detail' | 'financeAnomaly' | 'new' | 'passport' | 'pay' | 'cx' | 'log' | 'edit'
