'use client'

import { Btn, Icon, css } from '../ui'
import type { Vals } from '../useZemzem'

const FIELD = 'text-align:right;margin-bottom:14px'
const LBL = 'display:block;font-size:12.5px;font-weight:500;color:#6E7565;margin-bottom:5px'
const G3 = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 15px'
const G2 = 'display:grid;grid-template-columns:1fr 1fr;gap:0 15px'
const ROW = 'display:flex;align-items:center;gap:10px;padding:3px 0;font-size:13px'
const AMOUNT = "margin-inline-start:auto;font-family:'IBM Plex Mono',monospace;font-weight:600;direction:ltr"
const TOTAL_ROW =
  'display:flex;align-items:center;gap:10px;padding-top:8px;margin-top:4px;border-top:1px solid #E7E3D6;font-size:15px'
const SUBTITLE =
  'font-size:11.5px;font-weight:600;color:#47593C;margin:15px 0 10px;padding-bottom:6px;border-bottom:1px solid #E7E3D6'
const CHECK = 'width:17px;height:17px;accent-color:#47593C;cursor:pointer'

export function NewModal({ v }: { v: Vals }) {
  const { nf, nfH, nSty } = v
  return (
    <div
      onClick={v.overlayClick}
      style={css(
        'position: fixed; inset: 0; background: rgba(20,23,15,.55); z-index: 100; display: flex; align-items: flex-start; justify-content: center; padding: 24px; overflow-y: auto; left: -7px; top: -25px',
      )}
    >
      <div
        style={css(
          'background:#fff;border-radius:16px;width:100%;max-width:760px;box-shadow:0 20px 60px -12px rgba(0,0,0,.4);margin:auto',
        )}
      >
        <div style={css('display:flex;align-items:center;gap:12px;padding:16px 24px;border-bottom:1px solid #E7E3D6')}>
          <h2 style={css('font-size:16.5px;font-weight:600;flex:1')}>وصل جديد</h2>
          <Btn
            onClick={v.closeAll}
            s="width:31px;height:31px;border-radius:8px;display:grid;place-items:center;color:#6E7565"
            sh="background:#EDF0E5"
          >
            ✕
          </Btn>
        </div>
        <div style={css('text-align:center;padding:18px 24px 8px;border-bottom:1px solid #E7E3D6')}>
          <div style={css('font-size:10.5px;color:#9CA28F;letter-spacing:.06em;margin-bottom:4px')}>رقم مُقترح</div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:42px;font-weight:600;color:#A3801F;line-height:1")}>
            {v.npv}
          </div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:16px;color:#6E7565;margin-top:4px;direction:ltr")}>
            {v.todayLabel}
          </div>
        </div>
        <div style={css('padding:20px 24px')}>
          {v.nErrShow ? (
            <div
              style={css(
                'background:#F7E8E5;color:#9C3B32;border-radius:9px;padding:10px 13px;font-size:12.5px;font-weight:500;margin-bottom:13px;text-align:right',
              )}
            >
              <b>يجب إكمال ما يلي:</b>
              <ul style={css('margin:0;padding-inline-start:18px')}>
                {v.nErr.map((e, i) => (
                  <li key={i} style={css('margin:2px 0')}>
                    {e.m}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div style={css('display:flex;align-items:center;gap:10px;margin:0 0 10px;padding-bottom:7px;border-bottom:1px solid #E7E3D6')}>
            <div style={css('font-size:11.5px;font-weight:700;color:#47593C')}>المسافر</div>
            <div style={css('margin-inline-start:auto;display:flex;align-items:center;gap:8px')}>
              {v.passportLinkedShow ? (
                <span className="passport-chip passport-status-ok">✓ تم ربط جواز السفر</span>
              ) : null}
              <Btn
                onClick={v.openPassportScan}
                s="padding:8px 11px;border-radius:8px;font-size:12px;font-weight:700;background:#fff;border:1px solid #D9D5C8;color:#47593C;display:inline-flex;align-items:center;gap:6px"
                sh="background:#EDF0E5"
              >
                <Icon size={14} width="1.8">
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <circle cx="12" cy="9" r="2.4" />
                  <path d="M8 16c1.2-2 2.6-3 4-3s2.8 1 4 3" />
                </Icon>
                مسح جواز السفر
              </Btn>
            </div>
          </div>
          <div style={css(G3)}>
            <div style={css(FIELD)}>
              <label style={css(LBL)}>الاسم *</label>
              <input onChange={nfH.pre} style={css(nSty.pre)} value={nf.pre} />
            </div>
            <div style={css(FIELD)}>
              <label style={css(LBL)}>النسب *</label>
              <input onChange={nfH.nom} style={css(nSty.nom)} value={nf.nom} />
            </div>
            <div style={css(FIELD)}>
              <label style={css(LBL)}>رقم الهاتف *</label>
              <input
                inputMode="numeric"
                onChange={nfH.tel}
                placeholder="0661-96.40.98"
                style={css(nSty.tel + ';direction:ltr')}
                value={nf.tel}
              />
            </div>
          </div>
          {v.passportLinkedShow ? (
            <div
              style={css(
                'display:grid;grid-template-columns:92px 1fr auto;gap:12px;align-items:center;border:1px solid #C8D0BD;background:#F5F7F1;border-radius:11px;padding:10px 12px;margin:0 0 14px',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="passport-preview" src={v.passportPortrait} alt="صورة المسافر" />
              <div>
                <div style={css('font-size:12.5px;font-weight:800;color:#2E3B27')}>{v.passportDisplayName}</div>
                <div style={css('font-size:11px;color:#6E7565;margin-top:4px')}>
                  رقم الجواز:{' '}
                  <span dir="ltr" style={css("font-family:'IBM Plex Mono',monospace")}>
                    {v.passportNumberLabel}
                  </span>
                </div>
                <div style={css('font-size:10.5px;color:#8C9185;margin-top:3px')}>
                  سيتم حفظ الصورة الأصلية وجميع البيانات عند حفظ الوصل.
                </div>
              </div>
              <button
                type="button"
                onClick={v.removePassportScan}
                style={css('padding:7px 9px;border:1px solid #D9D5C8;border-radius:7px;background:#fff;color:#9C3B32;font-size:11px;font-weight:700')}
              >
                فصل
              </button>
            </div>
          ) : null}
          <div style={css(SUBTITLE)}>البرنامج</div>
          <div style={css(G3)}>
            <div style={css(FIELD)}>
              <label style={css(LBL)}>الفندق *</label>
              <select onChange={nfH.h} style={css(nSty.h)} value={nf.h}>
                <option disabled hidden value="">
                  اختر…
                </option>
                <option>منار الشروق</option>
                <option>رايا مبارك</option>
                <option>واحة احياد</option>
              </select>
            </div>
            <div style={css(FIELD)}>
              <label style={css(LBL)}>الرحلة *</label>
              <select onChange={nfH.v} style={css(nSty.v)} value={nf.v}>
                <option disabled hidden value="">
                  اختر…
                </option>
                <option>الخطوط السعودية</option>
                <option>القطرية</option>
              </select>
            </div>
            <div style={css(FIELD)}>
              <label style={css(LBL)}>الغرفة *</label>
              <select onChange={nfH.c} style={css(nSty.c)} value={nf.c}>
                <option disabled hidden value="">
                  اختر…
                </option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6</option>
                <option>7</option>
              </select>
            </div>
          </div>
          <div style={css(G2)}>
            <div style={css(FIELD)}>
              <label style={css(LBL)}>الوسيط *</label>
              <select onChange={nfH.rab} style={css(nSty.rab)} value={nf.rab}>
                <option disabled hidden value="">
                  اختر…
                </option>
                <option>zemzem</option>
                <option>صفية</option>
                <option>بن سليمان</option>
                <option>بن شريفة</option>
                <option>بهي</option>
              </select>
            </div>
            <div style={css(FIELD)}>
              <label style={css(LBL)}>التخفيض (درهم)</label>
              <input inputMode="numeric" onChange={nfH.red} style={css(nSty.red + ';direction:ltr')} value={nf.red} />
            </div>
          </div>
          {v.noPriceShow ? (
            <div style={css('background:#F6EEDA;border-radius:9px;padding:10px 13px;font-size:12px;color:#A3801F;font-weight:500;margin-top:8px')}>
              لا يوجد ثمن محدّد لهذا الاختيار في هذا الموسم.
            </div>
          ) : null}
          <div style={css('background: #F6EEDA; border-radius: 11px; padding: 13px 16px; margin: 12px 0 13px; width: 712px; height: 112px')}>
            <div style={css(ROW)}>
              <span style={css('color:#6E7565')}>الثمن الأصلي</span>
              <span style={css(AMOUNT)}>{v.nTar}</span>
            </div>
            <div style={css(ROW)}>
              <span style={css('color:#6E7565')}>التخفيض</span>
              <span style={css(AMOUNT)}>{v.nRedLabel}</span>
            </div>
            <div style={css(TOTAL_ROW)}>
              <span style={css('color:#6E7565')}>المبلغ المتفق عليه</span>
              <span style={css(AMOUNT + ';font-size:17px;color:#47593C')}>{v.nConv}</span>
            </div>
          </div>
          <label style={css('display:flex;align-items:center;gap:9px;margin:10px 0 5px;font-size:13px;cursor:pointer')}>
            <input checked={nf.grpChk} onChange={nfH.grpChk} style={css(CHECK)} type="checkbox" />
            ينتمي إلى مجموعة / عائلة
          </label>
          {nf.grpChk ? (
            <div style={css('text-align:right;margin:8px 0 14px')}>
              <label style={css(LBL)}>رمز المجموعة</label>
              <input onChange={nfH.grp} placeholder="GRP-2027-0001" style={css(nSty.grp)} value={nf.grp} />
            </div>
          ) : null}
          <div style={css(SUBTITLE)}>الدفعة الأولى — إجبارية</div>
          <div style={css(G3)}>
            <div style={css(FIELD)}>
              <label style={css(LBL)}>المبلغ المدفوع *</label>
              <input inputMode="numeric" onChange={nfH.pay} style={css(nSty.pay + ';direction:ltr')} value={nf.pay} />
            </div>
            <div style={css(FIELD)}>
              <label style={css(LBL)}>طريقة الدفع *</label>
              <select onChange={nfH.mode} style={css(nSty.mode)} value={nf.mode}>
                <option value="نقد">نقد</option>
                <option value="شيك">شيك</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
              </select>
            </div>
          </div>
          {v.nChqShow ? (
            <>
              <div style={css(G3)}>
                <div style={css(FIELD)}>
                  <label style={css(LBL)}>{v.nChqRefLabel}</label>
                  <input onChange={nfH.cn} style={css(nSty.cn + ';direction:ltr')} value={nf.cn} />
                </div>
                <div style={css(FIELD)}>
                  <label style={css(LBL)}>تاريخه *</label>
                  <input
                    inputMode="numeric"
                    onChange={nfH.cd}
                    placeholder="02/07/2025"
                    style={css(nSty.cd + ';direction:ltr')}
                    value={nf.cd}
                  />
                </div>
                <div style={css(FIELD)}>
                  <label style={css(LBL)}>البنك *</label>
                  <input onChange={nfH.cb} style={css(nSty.cb)} value={nf.cb} />
                </div>
              </div>
              <label style={css('display:flex;align-items:center;gap:9px;margin:9px 0 4px;font-size:13px;cursor:pointer')}>
                <input checked={nf.col} onChange={nfH.col} style={css(CHECK)} type="checkbox" />
                شيك / تحويل جماعي — شخص واحد يدفع عن عدة أشخاص
              </label>
              {nf.col ? (
                <div style={css('background:#F6EEDA;border-radius:11px;padding:13px 16px;margin:7px 0 13px')}>
                  <div style={css('font-size:11.5px;font-weight:600;color:#A3801F;margin-bottom:10px')}>العملية الجماعية</div>
                  <div style={css(G2)}>
                    <div style={css('text-align:right;margin-bottom:0')}>
                      <label style={css(LBL)}>الشخص الذي قام بالدفع *</label>
                      <input onChange={nfH.colWho} style={css(nSty.colWho)} value={nf.colWho} />
                    </div>
                    <div style={css('text-align:right;margin-bottom:0')}>
                      <label style={css(LBL)}>المبلغ الحقيقي للشيك *</label>
                      <input
                        inputMode="numeric"
                        onChange={nfH.colAmt}
                        style={css(nSty.colAmt + ';direction:ltr')}
                        value={nf.colAmt}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
          <div style={css('background:#EDF0E5;border-radius:11px;padding:13px 16px;margin:12px 0 13px')}>
            <div style={css(ROW)}>
              <span style={css('color:#6E7565')}>المدفوع</span>
              <span style={css(AMOUNT)}>{v.nPayLabel}</span>
            </div>
            <div style={css(TOTAL_ROW)}>
              <span style={css('color:#6E7565')}>الباقي</span>
              <span style={css(AMOUNT + ';font-size:17px;color:#9C3B32')}>{v.nRestLabel}</span>
            </div>
          </div>
          <div style={css('text-align:right')}>
            <label style={css(LBL)}>ملاحظة</label>
            <input
              onChange={nfH.note}
              style={css('width:100%;padding:11px 13px;border:1px solid #E7E3D6;border-radius:10px;background:#F9F7F2')}
              value={nf.note}
            />
          </div>
        </div>
        <div style={css('display:flex;gap:9px;padding:14px 24px;border-top:1px solid #E7E3D6;background:#F9F7F2;border-radius:0 0 16px 16px')}>
          <div style={css('margin-inline-start:auto;display:flex;gap:9px')}>
            <Btn
              onClick={v.closeAll}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;background:#fff;border:1px solid #E7E3D6"
              sh="background:#F9F7F2"
            >
              إلغاء
            </Btn>
            <Btn
              onClick={v.saveNew}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;background:#47593C;color:#fff"
              sh="background:#2E3B27"
            >
              حفظ الوصل
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
