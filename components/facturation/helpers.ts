import { AR_RE, TARIFS } from './constants'
import type { Recu } from './types'

/* Formatage — repris à l'identique du prototype (montants stockés en centimes). */

export function dh(c: number): string {
  return (c / 100).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')
}
export function dhs(c: number): string {
  return '\u2066' + dh(c) + ' DH\u2069'
}
export function today(): string {
  return new Date().toLocaleDateString('fr-FR')
}
export function nowTime(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
export function nowStr(): string {
  return new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
export function dateKey(d: Date): string {
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, '0'),
    day = String(d.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + day
}
export function frDateKey(v: string): string {
  const m = String(v || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return m ? m[3] + '-' + m[2] + '-' + m[1] : ''
}
export function keyToFr(v: string): string {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '—'
}
export function paye(r: Recu): number {
  return r.vers.reduce((s, v) => s + v.montant, 0)
}
export function rest(r: Recu): number {
  return r.convenu - paye(r)
}
export function stat(r: Recu): string {
  return r.statut === 'ملغى' ? 'ملغى' : rest(r) === 0 ? 'مسدد' : 'غير مكتمل'
}
export function okDate(v: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(v)
}
export function fmtTel(v: string): string {
  let d = v.replace(/\D/g, '')
  if (d.length && d[0] !== '0') d = '0' + d
  d = d.slice(0, 10)
  let o = d.slice(0, 4)
  if (d.length > 4) o += '-' + d.slice(4, 6)
  if (d.length > 6) o += '.' + d.slice(6, 8)
  if (d.length > 8) o += '.' + d.slice(8, 10)
  return o
}
export function fmtDate(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8)
  let o = d.slice(0, 2)
  if (d.length > 2) o += '/' + d.slice(2, 4)
  if (d.length > 4) o += '/' + d.slice(4, 8)
  return o
}
export function fmtMoney(v: string): string {
  return v.replace(/\D/g, '')
}
export function cleanAr(v: string): string {
  return v.replace(AR_RE, '')
}
export function esc(v: unknown): string {
  return String(v == null ? '' : v).replace(
    /[&<>"']/g,
    (ch) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }) as Record<string, string>)[ch],
  )
}
export function receiptMethodLabel(v: string): string {
  const m = String(v || '').toLowerCase()
  if (m === 'cash' || m.includes('esp') || m.includes('نقد')) return 'نقد'
  if (m === 'cheque' || m.includes('chèque') || m.includes('cheque') || m.includes('شيك')) return 'شيك'
  if (m === 'transfer' || m.includes('virement') || m.includes('تحويل')) return 'تحويل بنكي'
  return String(v || '')
}
export function sharedChequeId(cn?: string, cd?: string, cb?: string): string {
  const clean = (v?: string) =>
    String(v || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
  return 'shared|' + clean(cb) + '|' + clean(cn) + '|' + clean(cd)
}
export function getTarif(h: string, v: string, c: string): number | null {
  if (!h || !v || !c) return null
  const g = TARIFS[h + '|' + v]
  return g && g[c] ? g[c] * 100 : null
}
export function same(a: unknown, b: unknown): boolean {
  return String(a == null ? '' : a) === String(b == null ? '' : b)
}
export function makePassportPortrait(label: string): string {
  const safe = String(label || 'P')
    .trim()
    .slice(0, 2) || 'P'
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="320" viewBox="0 0 260 320"><rect width="260" height="320" fill="#edf0e5"/><circle cx="130" cy="112" r="55" fill="#c8d0bd"/><path d="M42 292c12-74 52-112 88-112s76 38 88 112" fill="#9cab8d"/><text x="130" y="305" text-anchor="middle" font-family="Arial" font-size="22" fill="#47593c">' +
    safe +
    '</text></svg>'
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}
export function resizeImageFile(file: File, maxW: number, maxH: number, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const rd = new FileReader()
    rd.onerror = reject
    rd.onload = () => {
      const im = new Image()
      im.onerror = reject
      im.onload = () => {
        let w = im.width,
          h = im.height
        const scale = Math.min(1, maxW / w, maxH / h)
        w = Math.max(1, Math.round(w * scale))
        h = Math.max(1, Math.round(h * scale))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const x = c.getContext('2d')
        x?.drawImage(im, 0, 0, w, h)
        resolve(c.toDataURL('image/jpeg', quality))
      }
      im.src = String(rd.result)
    }
    rd.readAsDataURL(file)
  })
}
