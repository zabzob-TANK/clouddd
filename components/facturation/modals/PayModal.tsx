'use client'

import { Btn, css } from '../ui'
import type { Vals } from '../useZemzem'

const FIELD = 'text-align:right;margin-bottom:14px'
const LBL = 'display:block;font-size:12.5px;font-weight:500;color:#6E7565;margin-bottom:5px'
const G3 = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 15px'
const G2 = 'display:grid;grid-template-columns:1fr 1fr;gap:0 15px'
const ROW = 'display:flex;align-items:center;gap:10px;padding:3px 0'
const AMOUNT = "margin-inline-start:auto;font-family:'IBM Plex Mono',monospace;font-weight:600;direction:ltr"
const HEAD_CELL = 'padding:8px 5px;font-weight:600'
const BODY_CELL = 'padding:8px 5px;border-top:1px solid #E7E3D6'

export function PayModal({ v }: { v: Vals }) {
  const { pf, pfH, pSty } = v
  return (
    <div
      onClick={v.overlayClick}
      style={css(
        'position:fixed;inset:0;background:rgba(20,23,15,.55);z-index:100;display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto',
      )}
    >
      <div
        style={css(
          'background:#fff;border-radius:16px;width:100%;max-width:760px;box-shadow:0 20px 60px -12px rgba(0,0,0,.4);margin:auto',
        )}
      >
        <div style={css('display:flex;align-items:center;gap:12px;padding:16px 24px;border-bottom:1px solid #E7E3D6')}>
          <h2 style={css('font-size:16.5px;font-weight:600;flex:1')}>إضافة دفعة</h2>
          <Btn
            onClick={v.closeAll}
            s="width:31px;height:31px;border-radius:8px;display:grid;place-items:center;color:#6E7565"
            sh="background:#EDF0E5"
          >
            ✕
          </Btn>
        </div>
        <div style={css('text-align:center;padding:18px 24px 8px;border-bottom:1px solid #E7E3D6')}>
          <div style={css('font-size:10.5px;color:#9CA28F;letter-spacing:.06em;margin-bottom:4px')}>رقم الوصل</div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:42px;font-weight:600;color:#A3801F;line-height:1")}>
            {v.pnv}
          </div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:16px;color:#6E7565;margin-top:4px;direction:ltr")}>
            {v.todayLabel}
          </div>
        </div>
        <div style={css('padding:20px 24px')}>
          {v.pErrShow ? (
            <div
              style={css(
                'background:#F7E8E5;color:#9C3B32;border-radius:9px;padding:10px 13px;font-size:12.5px;font-weight:500;margin-bottom:13px;text-align:right',
              )}
            >
              <b>يجب إكمال ما يلي:</b>
              <ul style={css('margin:0;padding-inline-start:18px')}>
                {v.pErr.map((e, i) => (
                  <li key={i} style={css('margin:2px 0')}>
                    {e.m}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div style={css(FIELD)}>
            <label style={css(LBL)}>رقم الوصل *</label>
            <input
              autoComplete="off"
              inputMode="numeric"
              onChange={v.nfH_pNo}
              placeholder="261"
              style={css(pSty.no + ';font-size:20px;font-weight:600;text-align:center')}
              value={pf.no}
            />
            <div style={css('font-size:11px;color:#9CA28F;margin-top:3px')}>اكتب رقم الوصل مباشرة</div>
          </div>
          {v.pWarnShow ? (
            <div style={css('background:#F6EEDA;border-radius:9px;padding:10px 13px;font-size:12px;color:#A3801F;font-weight:500')}>
              {v.pWarnMsg}
            </div>
          ) : null}
          {v.pFoundShow ? (
            <>
              <div style={css('background:#EDF0E5;border-radius:11px;padding:13px 16px;margin:8px 0 13px;font-size:13px')}>
                <div style={css('font-size:15px;font-weight:600;margin-bottom:8px')}>{v.pFoundName}</div>
                <div style={css(ROW)}>
                  <span style={css('color:#6E7565')}>المبلغ المتفق عليه</span>
                  <span style={css(AMOUNT)}>{v.pFoundConv}</span>
                </div>
                <div style={css(ROW)}>
                  <span style={css('color:#6E7565')}>المدفوع سابقًا</span>
                  <span style={css(AMOUNT)}>{v.pFoundPaye}</span>
                </div>
                <div style={css(ROW)}>
                  <span style={css('color:#6E7565')}>عدد الدفعات</span>
                  <span style={css(AMOUNT)}>{v.pFoundVers}</span>
                </div>
                <div
                  style={css(
                    'display:flex;align-items:center;gap:10px;padding-top:8px;margin-top:4px;border-top:1px solid #E7E3D6;font-size:15px',
                  )}
                >
                  <span style={css('color:#6E7565')}>الباقي بعد هذه الدفعة</span>
                  <span style={css(AMOUNT + ';font-size:17px;color:#9C3B32')}>{v.pFoundAfter}</span>
                </div>
              </div>
              <div
                data-payment-summary="true"
                style={css('margin:10px 0 16px;border:1px solid #E7E3D6;border-radius:12px;overflow:hidden;background:#fff')}
              >
                <div style={css('display:flex;align-items:center;gap:10px;padding:10px 12px;background:#F9F7F2;border-bottom:1px solid #E7E3D6')}>
                  <strong style={css('font-size:12.5px')}>ملخص الدفعات الست</strong>
                  <span style={css('margin-inline-start:auto;font-size:10.5px;color:#9CA28F')}>للقراءة والمعاينة فقط</span>
                </div>
                <div style={css('overflow-x:auto')}>
                  <table
                    style={css(
                      'width:100%;min-width:680px;border-collapse:collapse;table-layout:fixed;font-size:11.5px;text-align:center',
                    )}
                  >
                    <colgroup>
                      <col style={css('width:7%')} />
                      <col style={css('width:14%')} />
                      <col style={css('width:17%')} />
                      <col style={css('width:16%')} />
                      <col style={css('width:31%')} />
                      <col style={css('width:15%')} />
                    </colgroup>
                    <thead>
                      <tr style={css('background:#47593C;color:#fff')}>
                        <th style={css(HEAD_CELL)}>الدفعة</th>
                        <th style={css(HEAD_CELL)}>التاريخ</th>
                        <th style={css(HEAD_CELL)}>المبلغ</th>
                        <th style={css(HEAD_CELL)}>طريقة الدفع</th>
                        <th style={css(HEAD_CELL)}>تفاصيل الشيك / التحويل</th>
                        <th style={css(HEAD_CELL)}>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {v.pPaymentRows.map((p) => (
                        <tr key={p.n} data-payment-row={p.n} data-payment-status={p.status} style={css(p.rowStyle)}>
                          <td style={css(BODY_CELL + ";font-family:'IBM Plex Mono',monospace;font-weight:700")}>{p.n}</td>
                          <td style={css(BODY_CELL + ';direction:ltr')}>{p.date}</td>
                          <td style={css(BODY_CELL + ";direction:ltr;font-family:'IBM Plex Mono',monospace;font-weight:600")}>
                            {p.amount}
                          </td>
                          <td style={css(BODY_CELL)}>{p.mode}</td>
                          <td style={css('padding:8px 7px;border-top:1px solid #E7E3D6;font-size:10.5px;line-height:1.35')}>
                            {p.details}
                          </td>
                          <td style={css(BODY_CELL)}>
                            <span
                              style={css(
                                'display:inline-flex;align-items:center;justify-content:center;min-width:68px;padding:3px 7px;border-radius:999px;background:' +
                                  p.badgeBg +
                                  ';color:' +
                                  p.badgeColor +
                                  ';font-size:10.5px;font-weight:600',
                              )}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {v.pFormShow ? (
                <>
                  <div style={css(G3)}>
                    <div style={css(FIELD)}>
                      <label style={css(LBL)}>المبلغ *</label>
                      <input inputMode="numeric" onChange={pfH.amt} style={css(pSty.amt + ';direction:ltr')} value={pf.amt} />
                    </div>
                    <div style={css(FIELD)}>
                      <label style={css(LBL)}>طريقة الدفع *</label>
                      <select onChange={pfH.mode} style={css(pSty.mode)} value={pf.mode}>
                        <option value="نقد">نقد</option>
                        <option value="شيك">شيك</option>
                        <option value="تحويل بنكي">تحويل بنكي</option>
                      </select>
                    </div>
                  </div>
                  {v.pChqShow ? (
                    <>
                      <div style={css(G3)}>
                        <div style={css(FIELD)}>
                          <label style={css(LBL)}>{v.pChqRefLabel}</label>
                          <input onChange={pfH.cn} style={css(pSty.cn + ';direction:ltr')} value={pf.cn} />
                        </div>
                        <div style={css(FIELD)}>
                          <label style={css(LBL)}>تاريخه *</label>
                          <input
                            inputMode="numeric"
                            onChange={pfH.cd}
                            placeholder="02/07/2025"
                            style={css(pSty.cd + ';direction:ltr')}
                            value={pf.cd}
                          />
                        </div>
                        <div style={css(FIELD)}>
                          <label style={css(LBL)}>البنك *</label>
                          <input onChange={pfH.cb} style={css(pSty.cb)} value={pf.cb} />
                        </div>
                      </div>
                      <label style={css('display:flex;align-items:center;gap:9px;margin:9px 0 4px;font-size:13px;cursor:pointer')}>
                        <input
                          checked={pf.col}
                          onChange={pfH.col}
                          style={css('width:17px;height:17px;accent-color:#47593C;cursor:pointer')}
                          type="checkbox"
                        />
                        شيك / تحويل جماعي — شخص واحد يدفع عن عدة أشخاص
                      </label>
                      {pf.col ? (
                        <div style={css('background:#F6EEDA;border-radius:11px;padding:13px 16px;margin:7px 0 13px')}>
                          <div style={css('font-size:11.5px;font-weight:600;color:#A3801F;margin-bottom:10px')}>
                            العملية الجماعية
                          </div>
                          <div style={css(G2)}>
                            <div style={css('text-align:right')}>
                              <label style={css(LBL)}>الشخص الذي قام بالدفع *</label>
                              <input onChange={pfH.colWho} style={css(pSty.colWho)} value={pf.colWho} />
                            </div>
                            <div style={css('text-align:right')}>
                              <label style={css(LBL)}>المبلغ الحقيقي للشيك *</label>
                              <input
                                inputMode="numeric"
                                onChange={pfH.colAmt}
                                style={css(pSty.colAmt + ';direction:ltr')}
                                value={pf.colAmt}
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
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
              onClick={v.savePay}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;background:#47593C;color:#fff"
              sh="background:#2E3B27"
            >
              حفظ الدفعة
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
