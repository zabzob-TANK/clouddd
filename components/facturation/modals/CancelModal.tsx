'use client'

import { Btn, css } from '../ui'
import type { Vals } from '../useZemzem'

const LBL = 'display:block;font-size:12.5px;font-weight:500;color:#6E7565;margin-bottom:5px'

export function CancelModal({ v }: { v: Vals }) {
  const { cxf, cxH, cxSty } = v
  return (
    <div
      onClick={v.overlayClick}
      style={css(
        'position:fixed;inset:0;background:rgba(20,23,15,.55);z-index:100;display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto',
      )}
    >
      <div
        style={css(
          'background:#fff;border-radius:16px;width:100%;max-width:490px;box-shadow:0 20px 60px -12px rgba(0,0,0,.4);margin:auto',
        )}
      >
        <div style={css('display:flex;align-items:center;gap:12px;padding:16px 24px;border-bottom:1px solid #E7E3D6')}>
          <h2 style={css('font-size:16.5px;font-weight:600;flex:1')}>إلغاء الوصل</h2>
          <Btn
            onClick={v.closeAll}
            s="width:31px;height:31px;border-radius:8px;display:grid;place-items:center;color:#6E7565"
            sh="background:#EDF0E5"
          >
            ✕
          </Btn>
        </div>
        <div style={css('padding:20px 24px')}>
          {v.cxErrShow ? (
            <div
              style={css(
                'background:#F7E8E5;color:#9C3B32;border-radius:9px;padding:10px 13px;font-size:12.5px;font-weight:500;margin-bottom:13px;text-align:right',
              )}
            >
              <b>يجب إكمال ما يلي:</b>
              <ul style={css('margin:0;padding-inline-start:18px')}>
                {v.cxErr.map((e, i) => (
                  <li key={i} style={css('margin:2px 0')}>
                    {e.m}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p style={css('font-size:13px;color:#6E7565;margin-bottom:15px')}>
            الوصل لا يُحذف أبدًا. اختر فقط هل الاسترجاع يخرج من الصندوق أم يُدار خارجه.
          </p>
          <div
            style={css(
              'background:#F9F7F2;border:1px solid #E7E3D6;border-radius:9px;padding:10px 12px;margin-bottom:13px;display:flex;justify-content:space-between;gap:10px',
            )}
          >
            <span style={css('font-size:12px;color:#6E7565')}>المبلغ المدفوع</span>
            <strong className="money-ltr">{v.cancelPaidAmount}</strong>
          </div>
          <div style={css('text-align:right;margin-bottom:14px')}>
            <label style={css(LBL)}>طريقة الاسترجاع *</label>
            <select onChange={cxH.refundMode} style={css(cxSty.refundMode)} value={cxf.refundMode}>
              <option value="">اختر</option>
              <option value="cash">من الصندوق</option>
              <option value="outside">خارج الصندوق</option>
            </select>
          </div>
          <div style={css('text-align:right;margin-bottom:14px')}>
            <label style={css(LBL)}>سبب الإلغاء *</label>
            <textarea onChange={cxH.m} rows={3} style={css(cxSty.m)} value={cxf.m} />
          </div>
          <div style={css('text-align:right')}>
            <label style={css(LBL)}>كلمة المرور *</label>
            <input onChange={cxH.p} style={css(cxSty.p)} type="password" value={cxf.p} />
          </div>
        </div>
        <div style={css('display:flex;gap:9px;padding:14px 24px;border-top:1px solid #E7E3D6;background:#F9F7F2;border-radius:0 0 16px 16px')}>
          <div style={css('margin-inline-start:auto;display:flex;gap:9px')}>
            <Btn
              onClick={v.closeAll}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;background:#fff;border:1px solid #E7E3D6"
              sh="background:#F9F7F2"
            >
              تراجع
            </Btn>
            <Btn
              onClick={v.doCancel}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;background:#9C3B32;color:#fff"
              sh="background:#7c2f28"
            >
              تأكيد الإلغاء
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
