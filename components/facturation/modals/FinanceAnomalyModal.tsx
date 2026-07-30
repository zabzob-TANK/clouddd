'use client'

import { Btn, css } from '../ui'
import type { Vals } from '../useZemzem'

export function FinanceAnomalyModal({ v }: { v: Vals }) {
  return (
    <div
      onClick={v.overlayClick}
      style={css(
        'position:fixed;inset:0;background:rgba(20,23,15,.55);z-index:140;display:flex;align-items:center;justify-content:center;padding:24px',
      )}
    >
      <div
        style={css(
          'background:#fff;border-radius:14px;width:100%;max-width:500px;box-shadow:0 20px 60px -12px rgba(0,0,0,.4);overflow:hidden',
        )}
      >
        <div style={css('display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid #E7E3D6')}>
          <div
            style={css(
              'width:34px;height:34px;border-radius:8px;background:#FFF4DF;color:#9A5908;display:grid;place-items:center;font-size:22px;font-weight:800',
            )}
          >
            ?
          </div>
          <h2 style={css('font-size:16px;font-weight:700;flex:1')}>تأكيد مراجعة التنبيه</h2>
          <Btn
            onClick={v.closeAll}
            s="width:31px;height:31px;border-radius:8px;display:grid;place-items:center;color:#6E7565"
            sh="background:#EDF0E5"
          >
            ✕
          </Btn>
        </div>
        <div style={css('padding:22px 20px;text-align:right')}>
          <p style={css('font-size:13.5px;line-height:1.8;color:#2E3B27')}>
            تم العثور على <b>{v.financeAnomalyCount}</b> عملية مالية غير مُراجعة بعد طباعة يوم{' '}
            <b dir="ltr">{v.financeAnomalyDay}</b>.
          </p>
          <p style={css('font-size:12px;line-height:1.7;color:#6E7565;margin-top:9px')}>
            لن يختفي التنبيه إلا بعد تأكيد المراجعة. ستُحفظ هوية المدير وتاريخ ووقت التأكيد في السجل.
          </p>
        </div>
        <div
          style={css(
            'display:flex;gap:9px;justify-content:flex-start;padding:13px 20px;border-top:1px solid #E7E3D6;background:#F9F7F2',
          )}
        >
          <button
            type="button"
            onClick={v.closeAll}
            style={css('padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;background:#fff;border:1px solid #E7E3D6')}
          >
            رجوع
          </button>
          <button
            type="button"
            onClick={v.confirmFinanceAnomaly}
            style={css('padding:10px 16px;border-radius:8px;font-size:13px;font-weight:700;background:#47593C;color:#fff')}
          >
            تأكيد المراجعة
          </button>
        </div>
      </div>
    </div>
  )
}
