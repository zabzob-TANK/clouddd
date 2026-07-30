'use client'

import { Btn, Icon, css } from '../ui'
import type { Vals } from '../useZemzem'

const LBL = 'display:block;font-size:11.5px;color:#6E7565;margin-bottom:4px'
const CELL = 'margin-bottom:11px'

export function PassportModal({ v }: { v: Vals }) {
  const { passportDraft: p, passportH: h } = v
  const inputStyle = css(v.passportInputStyle)
  return (
    <div
      onClick={v.passportOverlayClick}
      style={css(
        'position:fixed;inset:0;background:rgba(20,23,15,.6);z-index:130;display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto',
      )}
    >
      <div
        dir="rtl"
        style={css(
          'background:#fff;border-radius:16px;width:100%;max-width:900px;box-shadow:0 22px 65px -15px rgba(0,0,0,.45);margin:auto;overflow:hidden',
        )}
      >
        <div style={css('display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid #E7E3D6')}>
          <div style={css('width:36px;height:36px;border-radius:9px;background:#EDF0E5;color:#47593C;display:grid;place-items:center')}>
            <Icon size={18} width="1.8">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <circle cx="12" cy="9" r="2.4" />
              <path d="M8 16c1.2-2 2.6-3 4-3s2.8 1 4 3" />
            </Icon>
          </div>
          <div style={css('flex:1')}>
            <h2 style={css('font-size:16.5px;font-weight:700')}>مسح جواز السفر</h2>
            <p style={css('font-size:11px;color:#6E7565;margin-top:2px')}>
              محاكاة وظيفية للربط المستقبلي مع خدمة الذكاء الاصطناعي
            </p>
          </div>
          <Btn
            onClick={v.backToNewFromPassport}
            s="width:31px;height:31px;border-radius:8px;display:grid;place-items:center;color:#6E7565"
            sh="background:#EDF0E5"
          >
            ✕
          </Btn>
        </div>
        <div style={css('padding:18px 20px 20px')}>
          <div
            style={css(
              'background:#FFF7E8;border:1px solid #E4C98B;border-radius:10px;padding:10px 12px;font-size:11.5px;color:#7A5A18;line-height:1.65;margin-bottom:14px',
            )}
          >
            في النسخة النهائية، سيرسل زر المسح الصورة إلى خدمة خارجية، ثم تعود جميع بيانات الجواز. هنا يمكنك تحميل صورة
            وتجربة نفس مسار التحقق والحفظ.
          </div>
          <div style={css('display:grid;grid-template-columns:220px 1fr;gap:18px;align-items:start')}>
            <div style={css('border:1px solid #E7E3D6;border-radius:12px;background:#F9F7F2;padding:12px;text-align:center')}>
              {v.passportHasOriginal ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={v.passportOriginal}
                  alt="صورة الجواز"
                  style={css('width:100%;height:170px;border-radius:9px;object-fit:cover;background:#fff;border:1px solid #E7E3D6')}
                />
              ) : null}
              {v.passportNoOriginal ? (
                <div
                  style={css(
                    'height:170px;border:1px dashed #CFCBBE;border-radius:9px;background:#fff;display:grid;place-items:center;color:#9CA28F;font-size:11.5px',
                  )}
                >
                  لم يتم اختيار صورة بعد
                </div>
              ) : null}
              <label
                style={css(
                  'display:block;margin-top:10px;padding:9px 11px;border-radius:8px;background:#47593C;color:#fff;font-size:12px;font-weight:700;cursor:pointer',
                )}
              >
                اختيار صورة الجواز
                <input accept="image/*" capture="environment" onChange={v.onPassportFile} style={css('display:none')} type="file" />
              </label>
              <button
                type="button"
                onClick={v.fillPassportDemo}
                style={css(
                  'width:100%;margin-top:8px;padding:9px 11px;border-radius:8px;background:#fff;border:1px solid #D9D5C8;color:#47593C;font-size:12px;font-weight:700',
                )}
              >
                ملء بيانات تجريبية
              </button>
              <div style={css('font-size:10.5px;color:#8C9185;line-height:1.5;margin-top:9px')}>
                الصورة المختارة تمثل النسخة الأصلية. تُنشأ منها صورة مصغرة للملف.
              </div>
            </div>
            <div>
              <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:0 12px')}>
                <div style={css(CELL)}>
                  <label style={css(LBL)}>الاسم</label>
                  <input onChange={h.pre} style={inputStyle} value={p.pre} />
                </div>
                <div style={css(CELL)}>
                  <label style={css(LBL)}>النسب</label>
                  <input onChange={h.nom} style={inputStyle} value={p.nom} />
                </div>
                <div style={css(CELL)}>
                  <label style={css(LBL)}>رقم الجواز</label>
                  <input dir="ltr" onChange={h.number} style={inputStyle} value={p.number} />
                </div>
                <div style={css(CELL)}>
                  <label style={css(LBL)}>الجنسية</label>
                  <input onChange={h.nationality} style={inputStyle} value={p.nationality} />
                </div>
                <div style={css(CELL)}>
                  <label style={css(LBL)}>تاريخ الميلاد</label>
                  <input dir="ltr" onChange={h.birthDate} placeholder="DD/MM/YYYY" style={inputStyle} value={p.birthDate} />
                </div>
                <div style={css(CELL)}>
                  <label style={css(LBL)}>مكان الميلاد</label>
                  <input onChange={h.birthPlace} style={inputStyle} value={p.birthPlace} />
                </div>
                <div style={css(CELL)}>
                  <label style={css(LBL)}>تاريخ الإصدار</label>
                  <input dir="ltr" onChange={h.issueDate} style={inputStyle} value={p.issueDate} />
                </div>
                <div style={css(CELL)}>
                  <label style={css(LBL)}>تاريخ الانتهاء</label>
                  <input dir="ltr" onChange={h.expiryDate} style={inputStyle} value={p.expiryDate} />
                </div>
                <div style={css(CELL)}>
                  <label style={css(LBL)}>بلد الإصدار</label>
                  <input onChange={h.issuingCountry} style={inputStyle} value={p.issuingCountry} />
                </div>
                <div style={css(CELL)}>
                  <label style={css(LBL)}>الجنس</label>
                  <input onChange={h.sex} style={inputStyle} value={p.sex} />
                </div>
              </div>
              <div style={css(CELL)}>
                <label style={css(LBL)}>منطقة MRZ / النتيجة الخام</label>
                <textarea onChange={h.mrz} style={css(v.passportTextareaStyle)} value={p.mrz} />
              </div>
            </div>
          </div>
        </div>
        <div style={css('display:flex;gap:9px;padding:13px 20px;border-top:1px solid #E7E3D6;background:#F9F7F2')}>
          <button
            type="button"
            onClick={v.backToNewFromPassport}
            style={css('padding:10px 15px;border-radius:8px;background:#fff;border:1px solid #D9D5C8;font-size:12.5px;font-weight:700')}
          >
            رجوع
          </button>
          <button
            type="button"
            onClick={v.applyPassportScan}
            style={css(
              'margin-inline-start:auto;padding:10px 16px;border-radius:8px;background:#47593C;color:#fff;font-size:12.5px;font-weight:800',
            )}
          >
            استعمال البيانات في الوصل
          </button>
        </div>
      </div>
    </div>
  )
}
