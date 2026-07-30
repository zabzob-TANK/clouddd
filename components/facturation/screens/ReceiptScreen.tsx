'use client'

import { Btn, Icon, css } from '../ui'
import type { Vals } from '../useZemzem'

export function ReceiptScreen({ v }: { v: Vals }) {
  const c = v.cur
  return (
    <div data-screen-label="الوصل" style={css('background:#eef1f4;min-height:100vh;padding:14px 16px 20px')}>
      <div
        className="no-print"
        style={css(
          "max-width:1180px;margin:0 auto 12px;display:flex;gap:9px;align-items:center;flex-wrap:wrap;direction:rtl;font-family:'IBM Plex Sans Arabic',system-ui,sans-serif",
        )}
      >
        <Btn
          onClick={v.goHome}
          s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid #E7E3D6"
          sh="background:#F9F7F2"
        >
          <Icon size={15}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </Icon>
          رجوع
        </Btn>
        <div style={css('margin-inline-start:auto;display:flex;gap:9px;flex-wrap:wrap')}>
          {c?.showCancelBtn ? (
            <Btn
              onClick={v.openCancel}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;background:#fff;border:1px solid #E7E3D6"
              sh="background:#F9F7F2"
            >
              إلغاء الوصل
            </Btn>
          ) : null}
          {c?.showAddPayBtn ? (
            <Btn
              onClick={v.openPayForCur}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;background:#fff;border:1px solid #E7E3D6"
              sh="background:#F9F7F2"
            >
              إضافة دفعة
            </Btn>
          ) : null}
          {c?.showEditBtn ? (
            <Btn
              onClick={v.openEditCur}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid #E7E3D6"
              sh="background:#F9F7F2"
            >
              <Icon size={14}>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
              </Icon>
              تعديل البيانات
            </Btn>
          ) : null}
        </div>
      </div>
      <iframe
        id="zemzemReceiptFrame"
        srcDoc={c?.receiptFrameHtml || ''}
        style={css(
          'display:block;width:100%;height:calc(100vh - 82px);min-height:790px;border:0;background:#eef1f4;border-radius:10px',
        )}
        title="Reçu Zemzem Asfar en lecture seule"
      />
    </div>
  )
}
