import { MAX_VERS } from './constants'
import { dhs, esc, paye, receiptMethodLabel, rest } from './helpers'
import { RECEIPT_PROTO_TEMPLATE } from './receipt-template'
import type { Recu } from './types'

/** Construit le document du reçu — même logique que le prototype. */
export function buildReceiptHtml(r: Recu | null | undefined): string {
  if (!r) return '<!doctype html><html><body></body></html>'
  const payments = Array.isArray(r.vers) ? r.vers : []
  const shown = payments.slice(0, MAX_VERS)
  const upperRows: string[] = [],
    stubRows: string[] = []
  for (let i = 0; i < MAX_VERS; i++) {
    const v = shown[i]
    if (!v) {
      upperRows.push(
        '<tr data-empty-payment-row="true" style="opacity:0" aria-hidden="true"><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td class="amount">&nbsp;</td><td class="seq ltr">&nbsp;</td></tr>',
      )
      stubRows.push(
        '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td class="amt">&nbsp;</td></tr>',
      )
      continue
    }
    const mode = receiptMethodLabel(v.mode),
      fallback = '¤--------¤'
    const bank = esc(v.cb || fallback),
      checkDate = esc(v.cd || fallback),
      checkNo = esc(v.cn || fallback)
    const payDate = esc(v.date || ''),
      amount = esc(dhs(Number(v.montant) || 0))
    upperRows.push(
      '<tr><td>' +
        bank +
        '</td><td>' +
        checkDate +
        '</td><td>' +
        checkNo +
        '</td><td>' +
        esc(mode) +
        '</td><td class="ltr">' +
        payDate +
        '</td><td class="amount ltr">' +
        amount +
        '</td><td class="seq ltr">' +
        (i + 1) +
        '</td></tr>',
    )
    stubRows.push(
      '<tr><td>' +
        bank +
        '</td><td>' +
        checkDate +
        '</td><td>' +
        checkNo +
        '</td><td class="method">' +
        esc(mode) +
        '</td><td class="ltr">' +
        payDate +
        '</td><td class="amt ltr">' +
        amount +
        '</td></tr>',
    )
  }
  const overflow = payments.length > MAX_VERS
  const values: Record<string, string> = {
    __DATE__: esc(r.date || ''),
    __FULL_NAME__: esc((r.prenom || '') + ' ' + (r.nom || '')),
    __RECEIPT_NUMBER__: esc(r.numero),
    __PROGRAM__: esc(r.hotel || ''),
    __ROOM__: esc(r.chambre || ''),
    __AGREED_AMOUNT__: esc(dhs(Number(r.convenu) || 0)),
    __TOTAL_PAID__: esc(dhs(paye(r))),
    __RECEIVER__: esc((r.vers && r.vers[0] && r.vers[0].par) || r.employe || '—'),
    __DISCOUNT__: esc(dhs(Number(r.reduction) || 0)),
    __REMAINING__: esc(dhs(rest(r))),
    __NOTE__: esc(r.note || ' '),
    __LAST_NAME__: esc(r.nom || ''),
    __FIRST_NAME__: esc(r.prenom || ''),
    __PHONE__: esc(r.tel || ''),
    __PAYMENT_OVERFLOW__: overflow ? 'true' : 'false',
    __OVERFLOW_DISPLAY__: overflow ? 'inline-flex' : 'none',
    __OVERFLOW_MESSAGE__: overflow
      ? esc('Anomalie : ' + payments.length + ' paiements enregistrés. Maximum prévu : ' + MAX_VERS + '.')
      : '',
  }
  let html = RECEIPT_PROTO_TEMPLATE.replace('<!--UPPER_PAYMENT_ROWS-->', upperRows.join('')).replace(
    '<!--STUB_PAYMENT_ROWS-->',
    stubRows.join(''),
  )
  Object.keys(values).forEach((k) => {
    html = html.split(k).join(values[k])
  })
  return html
}
