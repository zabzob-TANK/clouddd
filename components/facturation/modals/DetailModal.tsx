'use client'

import { Btn, Icon, css } from '../ui'
import type { Vals } from '../useZemzem'

const CELL = 'padding:8px 6px;white-space:nowrap'
const BODY_CELL = "padding:8px 6px;border-top:1px solid #E7E3D6;font-family:'IBM Plex Mono',monospace"
const SECTION = 'border:1px solid #E7E3D6;border-radius:13px;padding:14px 15px;background:#fff'
const SECTION_TITLE =
  'font-size:12px;color:#47593C;font-weight:700;margin-bottom:10px;padding-bottom:7px;border-bottom:1px solid #E7E3D6'
const LINE = 'display:flex;gap:8px;align-items:baseline'
const LABEL = 'color:#6E7565;min-width:86px'

export function DetailModal({ v }: { v: Vals }) {
  const d = v.detail
  if (!d) return null
  return (
    <div
      onClick={v.overlayClick}
      style={css(
        'position:fixed;inset:0;background:rgba(20,23,15,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:18px;overflow:hidden',
      )}
    >
      <div
        dir="rtl"
        style={css(
          'background:#fff;border-radius:17px;width:min(940px,calc(100vw - 36px));max-height:86vh;box-shadow:0 22px 65px -15px rgba(0,0,0,.42);display:flex;flex-direction:column;overflow:hidden;border:1px solid #E7E3D6',
        )}
      >
        <div
          style={css(
            'display:flex;align-items:center;gap:12px;padding:15px 20px;border-bottom:1px solid #E7E3D6;background:#fff;flex:0 0 auto',
          )}
        >
          <div style={css('width:36px;height:36px;border-radius:10px;background:#EDF0E5;color:#47593C;display:grid;place-items:center')}>
            <Icon size={18} width="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </Icon>
          </div>
          <div style={css('flex:1;min-width:0')}>
            <h2 style={css('font-size:17px;font-weight:700;line-height:1.25')}>الملف الكامل للمسافر</h2>
            <p style={css('font-size:11.5px;color:#6E7565;margin-top:2px')}>عرض شامل للبيانات المسجلة — للقراءة فقط</p>
          </div>
          <Btn
            onClick={v.closeAll}
            s="width:32px;height:32px;border-radius:8px;display:grid;place-items:center;color:#6E7565;flex:0 0 auto"
            sh="background:#EDF0E5;color:#1C2117"
            title="إغلاق"
          >
            ✕
          </Btn>
        </div>

        <div style={css('padding:18px 20px 20px;overflow-y:auto;overscroll-behavior:contain')}>
          <div
            style={css(
              'display:grid;grid-template-columns:136px minmax(0,1fr);gap:16px;direction:rtl;align-items:stretch;margin-bottom:15px',
            )}
          >
            <div
              style={css(
                'border:1px solid #E7E3D6;border-radius:14px;background:#F9F7F2;min-height:158px;display:grid;place-items:center;padding:12px;text-align:center',
              )}
            >
              <div>
                {d.detailHasPhoto ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.detailPhoto}
                      alt="صورة المسافر"
                      style={css(
                        'width:78px;height:94px;border-radius:12px;border:1px solid #D8D4C7;background:#fff;margin:0 auto 9px;display:block;object-fit:cover',
                      )}
                    />
                    <div style={css('font-size:11px;color:#47593C;line-height:1.4;font-weight:700')}>صورة الجواز</div>
                  </>
                ) : null}
                {d.detailNoPhoto ? (
                  <>
                    <div
                      style={css(
                        'width:78px;height:94px;border-radius:12px;border:1px dashed #CFCBBE;background:#fff;margin:0 auto 9px;display:grid;place-items:center;color:#9CA28F',
                      )}
                    >
                      <Icon size={34} width="1.4">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </Icon>
                    </div>
                    <div style={css('font-size:11px;color:#9CA28F;line-height:1.4')}>الصورة غير متوفرة</div>
                  </>
                ) : null}
              </div>
            </div>

            <div
              style={css(
                'border:1px solid #E7E3D6;border-radius:14px;background:linear-gradient(135deg,#fff,#F9F7F2);padding:15px 17px;display:flex;flex-direction:column;justify-content:center',
              )}
            >
              <div style={css('display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px')}>
                <span
                  style={css(
                    'display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:' +
                      d.detailStatusBg +
                      ';color:' +
                      d.detailStatusColor +
                      ';font-size:11px;font-weight:700',
                  )}
                >
                  {d.detailStatus}
                </span>
                {d.detailModified ? (
                  <span
                    style={css(
                      'display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:#F6EEDA;color:#A3801F;font-size:11px;font-weight:700',
                    )}
                  >
                    تم التعديل {d.detailModCount} مرة
                  </span>
                ) : null}
                {d.detailNotModified ? (
                  <span
                    style={css(
                      'display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:#F1F1EC;color:#6E7565;font-size:11px;font-weight:600',
                    )}
                  >
                    غير معدل
                  </span>
                ) : null}
              </div>
              <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:10px')}>
                <div style={css('border:1px solid #E7E3D6;border-radius:11px;padding:10px 12px;background:#fff')}>
                  <div style={css('font-size:10.5px;color:#9CA28F;margin-bottom:3px')}>رقم الوصل</div>
                  <div
                    style={css(
                      "font-family:'IBM Plex Mono',monospace;font-size:25px;font-weight:700;color:#A3801F;direction:ltr;text-align:right",
                    )}
                  >
                    {d.detailNumber}
                  </div>
                </div>
                <div style={css('border:1px solid #E7E3D6;border-radius:11px;padding:10px 12px;background:#fff')}>
                  <div style={css('font-size:10.5px;color:#9CA28F;margin-bottom:3px')}>تاريخ التسجيل</div>
                  <div
                    style={css(
                      "font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:700;direction:ltr;text-align:right",
                    )}
                  >
                    {d.detailDate}
                  </div>
                  <div
                    style={css(
                      "font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#6E7565;direction:ltr;text-align:right;margin-top:2px",
                    )}
                  >
                    الساعة: {d.detailTime}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start')}>
            <section style={css(SECTION)}>
              <h3 style={css(SECTION_TITLE)}>الهوية والاتصال</h3>
              <div dir="rtl" style={css('font-size:14.5px;font-weight:700;text-align:right;margin-bottom:9px')}>
                الاسم: <span>{d.detailFullName}</span>
              </div>
              <div style={css('display:grid;gap:7px;font-size:12.5px')}>
                <div style={css(LINE)}>
                  <span style={css(LABEL)}>الجواز:</span>
                  <span style={css('font-weight:700;color:' + d.detailPassportColor)}>{d.detailPassportStatus}</span>
                </div>
                <div style={css(LINE)}>
                  <span style={css(LABEL)}>رقم الهاتف:</span>
                  <span dir="ltr" style={css("font-family:'IBM Plex Mono',monospace;font-weight:600")}>
                    {d.detailPhone}
                  </span>
                </div>
                <div style={css(LINE)}>
                  <span style={css(LABEL)}>المجموعة:</span>
                  <span style={css('font-weight:600')}>{d.detailGroup}</span>
                </div>
                <div style={css(LINE)}>
                  <span style={css(LABEL)}>الوسيط:</span>
                  <span style={css('font-weight:600')}>{d.detailReferrer}</span>
                </div>
                <div style={css('display:flex;gap:8px;align-items:flex-start')}>
                  <span style={css(LABEL)}>الملاحظة:</span>
                  <span style={css('font-weight:500;white-space:pre-wrap')}>{d.detailNote}</span>
                </div>
              </div>
            </section>

            <section style={css(SECTION)}>
              <h3 style={css(SECTION_TITLE)}>البرنامج</h3>
              <div style={css('display:grid;gap:7px;font-size:12.5px')}>
                <div style={css(LINE)}>
                  <span style={css(LABEL)}>الفندق:</span>
                  <span style={css('font-weight:700')}>{d.detailHotel}</span>
                </div>
                <div style={css(LINE)}>
                  <span style={css(LABEL)}>الغرفة:</span>
                  <span style={css("font-family:'IBM Plex Mono',monospace;font-weight:700")}>{d.detailRoom}</span>
                </div>
                <div style={css(LINE)}>
                  <span style={css(LABEL)}>الرحلة:</span>
                  <span style={css('font-weight:600')}>{d.detailFlight}</span>
                </div>
                <div style={css(LINE)}>
                  <span style={css(LABEL)}>الموسم:</span>
                  <span style={css('font-weight:600')}>{d.detailSeason}</span>
                </div>
              </div>
            </section>

            <section style={css(SECTION)}>
              <h3 style={css(SECTION_TITLE)}>الوضعية المالية</h3>
              <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
                <div style={css('border-radius:9px;background:#F9F7F2;padding:9px 10px')}>
                  <div style={css('font-size:10.5px;color:#6E7565')}>الثمن الأصلي</div>
                  <div
                    dir="ltr"
                    style={css("font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;text-align:right")}
                  >
                    {d.detailOriginalAmount}
                  </div>
                </div>
                <div style={css('border-radius:9px;background:#F9F7F2;padding:9px 10px')}>
                  <div style={css('font-size:10.5px;color:#6E7565')}>التخفيض</div>
                  <div
                    dir="ltr"
                    style={css("font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;text-align:right")}
                  >
                    {d.detailDiscount}
                  </div>
                </div>
                <div style={css('border-radius:9px;background:#EDF0E5;padding:9px 10px')}>
                  <div style={css('font-size:10.5px;color:#47593C')}>المبلغ المتفق عليه</div>
                  <div
                    dir="ltr"
                    style={css("font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;text-align:right")}
                  >
                    {d.detailAgreed}
                  </div>
                </div>
                <div style={css('border-radius:9px;background:#EDF0E5;padding:9px 10px')}>
                  <div style={css('font-size:10.5px;color:#47593C')}>مجموع الدفعات</div>
                  <div
                    dir="ltr"
                    style={css("font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;text-align:right")}
                  >
                    {d.detailPaid}
                  </div>
                </div>
                <div style={css('border-radius:9px;background:' + d.detailRemainingBg + ';padding:9px 10px')}>
                  <div style={css('font-size:10.5px;color:' + d.detailRemainingColor)}>الباقي</div>
                  <div
                    dir="ltr"
                    style={css(
                      "font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:800;color:" +
                        d.detailRemainingColor +
                        ';text-align:right',
                    )}
                  >
                    {d.detailRemaining}
                  </div>
                </div>
                <div style={css('border-radius:9px;background:#F9F7F2;padding:9px 10px')}>
                  <div style={css('font-size:10.5px;color:#6E7565')}>عدد الدفعات</div>
                  <div
                    dir="ltr"
                    style={css("font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;text-align:right")}
                  >
                    {d.detailPaymentCount}
                  </div>
                </div>
              </div>
            </section>

            <section style={css(SECTION)}>
              <h3 style={css(SECTION_TITLE)}>معلومات التسجيل</h3>
              <div style={css('display:grid;gap:7px;font-size:12.5px')}>
                <div style={css(LINE)}>
                  <span style={css('color:#6E7565;min-width:110px')}>سجله الموظف:</span>
                  <span style={css('font-weight:700')}>{d.detailEmployee}</span>
                </div>
                <div style={css(LINE)}>
                  <span style={css('color:#6E7565;min-width:110px')}>عدد مرات الطباعة:</span>
                  <span dir="ltr" style={css("font-family:'IBM Plex Mono',monospace;font-weight:700")}>
                    {d.detailPrintCount}
                  </span>
                </div>
                {d.detailModified ? (
                  <div style={css(LINE)}>
                    <span style={css('color:#6E7565;min-width:110px')}>آخر تعديل:</span>
                    <span dir="ltr" style={css("font-family:'IBM Plex Mono',monospace;font-weight:600")}>
                      {d.detailLastModification}
                    </span>
                  </div>
                ) : null}
                {d.detailModified ? (
                  <div style={css(LINE)}>
                    <span style={css('color:#6E7565;min-width:110px')}>عدل بواسطة:</span>
                    <span style={css('font-weight:600')}>{d.detailModifiedBy}</span>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <section style={css('border:1px solid #E7E3D6;border-radius:13px;background:#fff;margin-top:12px;overflow:hidden')}>
            <div style={css('display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #E7E3D6')}>
              <h3 style={css('font-size:12.5px;color:#47593C;font-weight:700')}>الدفعات المسجلة</h3>
              <span style={css('margin-inline-start:auto;font-size:10.5px;color:#6E7565')}>{d.detailPaymentCount}</span>
            </div>
            <div style={css('overflow-x:auto')}>
              <table style={css('width:100%;min-width:940px;border-collapse:collapse;font-size:11px;text-align:center')}>
                <thead>
                  <tr style={css('background:#EDF0E5;color:#2E3B27')}>
                    <th style={css(CELL)}>الدفعة</th>
                    <th style={css(CELL)}>التاريخ</th>
                    <th style={css(CELL)}>المبلغ</th>
                    <th style={css(CELL)}>الطريقة</th>
                    <th style={css(CELL)}>الشيك / المرجع</th>
                    <th style={css(CELL)}>تاريخه</th>
                    <th style={css(CELL)}>البنك</th>
                    <th style={css(CELL)}>الدافع</th>
                    <th style={css(CELL)}>قيمة العملية</th>
                    <th style={css(CELL)}>الموظف</th>
                  </tr>
                </thead>
                <tbody>
                  {d.detailPayments.map((p, i) => (
                    <tr key={p.n + '-' + i}>
                      <td style={css(BODY_CELL + ';font-weight:700')}>{p.n}</td>
                      <td dir="ltr" style={css(BODY_CELL + ';white-space:nowrap')}>
                        {p.date}
                      </td>
                      <td dir="ltr" style={css(BODY_CELL + ';font-weight:700;white-space:nowrap')}>
                        {p.amount}
                      </td>
                      <td style={css('padding:8px 6px;border-top:1px solid #E7E3D6;font-weight:600')}>{p.mode}</td>
                      <td dir="ltr" style={css('padding:8px 6px;border-top:1px solid #E7E3D6;white-space:nowrap')}>
                        {p.reference}
                      </td>
                      <td dir="ltr" style={css('padding:8px 6px;border-top:1px solid #E7E3D6;white-space:nowrap')}>
                        {p.instrumentDate}
                      </td>
                      <td style={css('padding:8px 6px;border-top:1px solid #E7E3D6;white-space:nowrap')}>{p.bank}</td>
                      <td style={css('padding:8px 6px;border-top:1px solid #E7E3D6;white-space:nowrap')}>{p.payer}</td>
                      <td dir="ltr" style={css(BODY_CELL + ';white-space:nowrap')}>
                        {p.operationAmount}
                      </td>
                      <td style={css('padding:8px 6px;border-top:1px solid #E7E3D6;white-space:nowrap')}>
                        {p.employee}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {d.detailModified ? (
            <details style={css('margin-top:12px;border:1px solid #E7E3D6;border-radius:12px;background:#fff;overflow:hidden')}>
              <summary
                style={css(
                  'cursor:pointer;list-style:none;padding:12px 14px;font-size:12px;font-weight:700;color:#47593C;display:flex;align-items:center;gap:8px',
                )}
              >
                <span style={css('width:23px;height:23px;border-radius:7px;background:#F6EEDA;color:#A3801F;display:grid;place-items:center')}>
                  ↶
                </span>
                <span>عرض سجل التعديلات ({d.detailModCount})</span>
                <span style={css('margin-inline-start:auto;color:#9CA28F;font-size:11px')}>اضغط للفتح</span>
              </summary>
              <div style={css('padding:0 14px 14px;display:grid;gap:9px')}>
                {d.detailModifications.map((m, i) => (
                  <div key={i} style={css('border:1px solid #E7E3D6;border-radius:10px;padding:11px 12px;background:#FDFCF9')}>
                    <div style={css('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}>
                      <strong style={css('font-size:12px;color:#2E3B27')}>{m.section}</strong>
                      <span dir="ltr" style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#6E7565")}>
                        {m.dateTime}
                      </span>
                      <span style={css('font-size:10.5px;color:#6E7565')}>بواسطة {m.employee}</span>
                    </div>
                    <div style={css('font-size:11.5px;margin-top:6px')}>
                      <span style={css('color:#6E7565')}>السبب:</span> <b>{m.reason}</b>
                    </div>
                    <div style={css('margin-top:7px;display:grid;gap:5px')}>
                      {m.changes.map((c, j) => (
                        <div
                          key={j}
                          style={css('font-size:11px;border-radius:8px;background:#fff;padding:6px 8px;border:1px solid #EEEAE0')}
                        >
                          <span style={css('font-weight:700')}>{c.field}:</span>{' '}
                          <span style={css('color:#9C3B32')}>{c.oldValue}</span>
                          <span style={css('color:#9CA28F;margin:0 5px')}>←</span>
                          <span style={css('color:#47593C;font-weight:700')}>{c.newValue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          {d.detailCancelled ? (
            <details style={css('margin-top:12px;border:1px solid #E4B9B3;border-radius:12px;background:#FFF8F7;overflow:hidden')}>
              <summary style={css('cursor:pointer;list-style:none;padding:12px 14px;font-size:12px;font-weight:700;color:#9C3B32')}>
                عرض معلومات إلغاء الوصل
              </summary>
              <div style={css('padding:0 14px 14px;display:grid;gap:6px;font-size:11.5px')}>
                <div>
                  <span style={css('color:#6E7565')}>السبب:</span> <b>{d.detailCancelReason}</b>
                </div>
                <div>
                  <span style={css('color:#6E7565')}>ألغاه:</span> <b>{d.detailCancelledBy}</b>
                </div>
                <div>
                  <span style={css('color:#6E7565')}>تاريخ ووقت الإلغاء:</span>{' '}
                  <span dir="ltr" style={css("font-family:'IBM Plex Mono',monospace")}>
                    {d.detailCancelledAt}
                  </span>
                </div>
              </div>
            </details>
          ) : null}
        </div>

        <div
          style={css(
            'display:flex;align-items:center;gap:9px;padding:13px 20px;border-top:1px solid #E7E3D6;background:#fff;flex:0 0 auto',
          )}
        >
          <Btn
            onClick={v.openDetailReceipt}
            s="padding:9px 15px;border-radius:9px;background:#47593C;color:#fff;font-size:12.5px;font-weight:700;display:inline-flex;align-items:center;gap:7px"
            sh="background:#2E3B27"
          >
            <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            عرض الوصل / الطباعة
          </Btn>
          <Btn
            onClick={v.closeAll}
            s="padding:9px 15px;border-radius:9px;background:#fff;border:1px solid #E7E3D6;font-size:12.5px;font-weight:600"
            sh="background:#F9F7F2"
          >
            إغلاق
          </Btn>
        </div>
      </div>
    </div>
  )
}
