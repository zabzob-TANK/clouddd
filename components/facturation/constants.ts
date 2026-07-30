/** Données de référence — reprises telles quelles du prototype. */

export const HOTELS = ['منار الشروق', 'رايا مبارك', 'واحة احياد']
export const VOLS = ['الخطوط السعودية', 'القطرية']
export const CHAMB = ['2', '3', '4', '5', '6', '7']
export const RABAT = ['zemzem', 'صفية', 'بن سليمان', 'بن شريفة', 'بهي']

export const TARIFS: Record<string, Record<string, number>> = {
  'منار الشروق|الخطوط السعودية': { 2: 34800, 3: 33800, 4: 26000, 5: 25000, 6: 24000, 7: 24000 },
  'منار الشروق|القطرية': { 2: 35500, 3: 31500, 4: 27000, 5: 26000, 6: 25000, 7: 25000 },
  'رايا مبارك|الخطوط السعودية': { 2: 48500, 3: 40500, 4: 33500, 5: 33500 },
  'واحة احياد|الخطوط السعودية': { 2: 53500, 3: 43800, 4: 38500, 5: 35500 },
}

export const SAISON = { nom: 'عمرة رمضان 2027', reductionMax: 300000, duree: '60 يوم' }
export const MAX_VERS = 6

export const USERS: Record<string, { pwd: string; nom: string; role: string; ini: string }> = {
  admin: { pwd: 'admin', nom: 'المدير', role: 'مدير', ini: 'AD' },
  samir: { pwd: '1234', nom: 'سمير بنعلي', role: 'صندوق', ini: 'SB' },
}

export const AR_RE = /[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\s]/g

export const okInputStyle =
  'width:100%;padding:11px 13px;border:1px solid #E7E3D6;border-radius:10px;background:#F9F7F2'
export const badInputStyle =
  'width:100%;padding:11px 13px;border:1px solid #9C3B32;border-radius:10px;background:#F7E8E5'

export const STORAGE_KEY = 'omra_v9_facturation_scan_passeport'
export const LEGACY_STORAGE_KEY = 'omra_v8_regles_impression_anomalies'
