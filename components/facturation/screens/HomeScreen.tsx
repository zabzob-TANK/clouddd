'use client'

import { Btn, Icon, Logo, Tr, css } from '../ui'
import type { Vals } from '../useZemzem'

/* En-têtes du tableau des reçus, avec les mêmes styles inline que le prototype. */
const TH: { label: string; s: string }[] = [
  {
    label: 'رقم',
    s: 'position:sticky;top:0;background:#EDF0E5;text-align:center;font-size:10.5px;font-weight:600;color:#2E3B27;padding:11px 6px;border-bottom:1px solid #E7E3D6;white-space:nowrap;width:52px',
  },
  {
    label: 'الاسم / النسب',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: right; font-size: 10.5px; font-weight: 600; color: #2E3B27; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 175px; height: 41px',
  },
  {
    label: 'المبلغ المتفق عليه',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: left; font-size: 10.5px; font-weight: 600; color: #2E3B27; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 71px; height: 38px',
  },
  {
    label: 'مجموع الدفعات',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: left; font-size: 10.5px; font-weight: 600; color: #2E3B27; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 65px; height: 38px',
  },
  {
    label: 'الباقي',
    s: 'position:sticky;top:0;background:#EDF0E5;text-align:left;font-size:10.5px;font-weight:600;color:#2E3B27;padding:11px 10px;border-bottom:1px solid #E7E3D6;white-space:nowrap',
  },
  {
    label: 'تاريخ التسجيل',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: right; font-size: 10.5px; font-weight: 600; color: #2E3B27; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 68px; height: 37px',
  },
  {
    label: 'عدد الدفعات',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: left; font-size: 10.5px; font-weight: 600; color: #2E3B27; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 57px; height: 39px',
  },
  {
    label: 'الحالة',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: right; font-size: 10.5px; font-weight: 600; color: #2E3B27; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 87px; height: 41px',
  },
  {
    label: 'الفندق',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: right; font-size: 10.5px; font-weight: 600; color: #2E3B27; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 118px; height: 41px',
  },
  {
    label: 'الغرفة',
    s: 'position:sticky;top:0;background:#EDF0E5;text-align:right;font-size:10.5px;font-weight:600;color:#2E3B27;padding:11px 10px;border-bottom:1px solid #E7E3D6;white-space:nowrap',
  },
  {
    label: 'الرحلة',
    s: 'position:sticky;top:0;background:#EDF0E5;text-align:right;font-size:10.5px;font-weight:600;color:#2E3B27;padding:11px 10px;border-bottom:1px solid #E7E3D6;white-space:nowrap',
  },
  {
    label: 'الوسيط',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: right; font-size: 10.5px; font-weight: 600; color: #2E3B27; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 90px; height: 36px',
  },
  {
    label: 'ملاحظة',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: right; font-size: 10.5px; font-weight: 500; color: #6E7565; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 124px; height: 38px',
  },
  {
    label: 'الموظف',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: right; font-size: 10.5px; font-weight: 500; color: #6E7565; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 40px; height: 24px',
  },
  {
    label: 'التخفيض',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: left; font-size: 10.5px; font-weight: 500; color: #6E7565; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 53px; height: 36px',
  },
  {
    label: 'رقم الهاتف',
    s: 'position: sticky; top: 0; background: #EDF0E5; text-align: right; font-size: 10.5px; font-weight: 500; color: #6E7565; padding: 11px 10px; border-bottom: 1px solid #E7E3D6; white-space: nowrap; width: 121px; height: 39px',
  },
  {
    label: 'المجموعة',
    s: 'position:sticky;top:0;background:#EDF0E5;text-align:right;font-size:10.5px;font-weight:500;color:#6E7565;padding:11px 10px;border-bottom:1px solid #E7E3D6;white-space:nowrap',
  },
  {
    label: 'الإجراءات',
    s: 'position:sticky;top:0;background:#EDF0E5;text-align:center;font-size:10.5px;font-weight:600;color:#2E3B27;padding:11px 8px;border-bottom:1px solid #E7E3D6;white-space:nowrap;width:136px;min-width:136px',
  },
]

const TD = 'padding:10px 10px;border-bottom:1px solid #E7E3D6'
const MONO = "font-family:'IBM Plex Mono',monospace"

export function HomeScreen({ v }: { v: Vals }) {
  return (
    <div data-screen-label="الرئيسية">
      <header
        style={css(
          'display:flex;align-items:center;gap:16px;padding:13px 24px;background:#fff;border-bottom:1px solid #E7E3D6;position:sticky;top:0;z-index:50',
        )}
      >
        <div
          style={css(
            'width:40px;height:40px;border-radius:50%;flex:0 0 40px;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#C9A24A,#A3801F);box-shadow:inset 0 -2px 6px rgba(0,0,0,.18)',
          )}
        >
          <Logo size={21} />
        </div>
        <div>
          <div style={css('font-size:14.5px;font-weight:600')}>زمزم أسفار</div>
          <div style={css('font-size:11px;color:#6E7565')}>تدبير العمرة</div>
        </div>
        <div
          style={css(
            'margin-inline-start:auto;display:flex;align-items:center;gap:9px;padding:6px 15px;border-radius:999px;background:#EDF0E5;font-size:12.5px;font-weight:500',
          )}
        >
          <span style={css('width:7px;height:7px;border-radius:50%;background:#6C8058;display:inline-block')} />
          {v.seasonLabel}
        </div>
        <Btn
          onClick={v.openLog}
          s="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;border:1px solid #E7E3D6;color:#6E7565"
          sh="background:#EDF0E5;color:#1C2117"
          title="السجل"
        >
          <Icon size={15}>
            <path d="M12 8v4l3 2" />
            <circle cx="12" cy="12" r="9" />
          </Icon>
        </Btn>
        <div
          style={css(
            'display:flex;align-items:center;gap:10px;padding-inline-start:15px;border-inline-start:1px solid #E7E3D6',
          )}
        >
          <div
            style={css(
              'width:31px;height:31px;border-radius:50%;background:#47593C;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:600',
            )}
          >
            {v.uav}
          </div>
          <div>
            <div style={css('font-size:12.5px;font-weight:500;line-height:1.3')}>{v.unm}</div>
            <div style={css('font-size:10.5px;color:#6E7565')}>{v.urole}</div>
          </div>
          <Btn
            onClick={v.logout}
            s="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;border:1px solid #E7E3D6;color:#6E7565;margin-inline-start:6px"
            sh="background:#EDF0E5;color:#1C2117"
            title="خروج"
          >
            <Icon size={15}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </Icon>
          </Btn>
        </div>
      </header>

      <div style={css('max-width:100%;margin:0 auto;padding:22px 24px 44px')}>
        <div style={css('display:flex;align-items:flex-end;gap:16px;margin-bottom:18px;flex-wrap:wrap')}>
          <div>
            <h1 style={css('font-size:23px;font-weight:600')}>الوصولات</h1>
            <p style={css('font-size:12.5px;color:#6E7565;margin-top:3px')}>{v.subLabel}</p>
          </div>
          <div style={css('margin-inline-start:auto;display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap')}>
            <div style={css('display:flex;gap:9px')}>
              <div style={css('display:flex;flex-direction:column;gap:5px')}>
                <label style={css('font-size:11px;color:#6E7565;font-weight:500')}>الاسم</label>
                <input
                  onChange={v.onQn}
                  placeholder="بحث…"
                  style={css('padding:9px 12px;border:1px solid #E7E3D6;border-radius:9px;background:#fff;width:160px')}
                  type="search"
                  value={v.qn}
                />
              </div>
              <div style={css('display:flex;flex-direction:column;gap:5px')}>
                <label style={css('font-size:11px;color:#6E7565;font-weight:500')}>رقم الوصل</label>
                <input
                  onChange={v.onQr}
                  placeholder="261"
                  style={css(
                    "padding:9px 12px;border:1px solid #E7E3D6;border-radius:9px;background:#fff;width:100px;font-family:'IBM Plex Mono',monospace;direction:ltr",
                  )}
                  type="search"
                  value={v.qr}
                />
              </div>
            </div>
            <Btn
              onClick={v.goStats}
              s="padding:10px 14px;border-radius:9px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;background:#fff;border:1px solid #E7E3D6;color:#2E3B27"
              sh="background:#EDF0E5"
            >
              <Icon size={15}>
                <path d="M4 19V9" />
                <path d="M10 19V5" />
                <path d="M16 19v-7" />
                <path d="M22 19V2" />
              </Icon>
              الإحصائيات
            </Btn>
            <Btn
              onClick={v.goFinance}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;background:#fff;border:1px solid #E7E3D6;color:#2E3B27"
              sh="background:#EDF0E5"
            >
              <Icon size={15}>
                <path d="M3 3v18h18" />
                <path d="M7 15l4-4 3 3 5-6" />
              </Icon>
              المالية / الصندوق
            </Btn>
            <Btn
              onClick={v.openPay}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;background:#fff;border:1px solid #E7E3D6"
              sh="background:#EDF0E5"
            >
              <Icon size={15}>
                <path d="M12 5v14M5 12h14" />
              </Icon>
              إضافة دفعة
            </Btn>
            <Btn
              onClick={v.openNew}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;background:#47593C;color:#fff"
              sh="background:#2E3B27"
            >
              <Icon size={15}>
                <path d="M12 5v14M5 12h14" />
              </Icon>
              وصل جديد
            </Btn>
          </div>
        </div>

        <div
          style={css(
            'background:#fff;border:1px solid #E7E3D6;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(28,33,23,.06),0 8px 24px -14px rgba(28,33,23,.18)',
          )}
        >
          <div style={css('overflow-x:auto')}>
            <table style={css('width:100%;border-collapse:collapse;font-size:12.5px;min-width:1620px')}>
              <thead>
                <tr>
                  {TH.map((h) => (
                    <th key={h.label} style={css(h.s)}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {v.rows.map((r) => (
                  <Tr
                    key={r.id}
                    onDoubleClick={r.openDetail}
                    title="انقر مرتين لعرض الملف الكامل"
                    s={'cursor:pointer;opacity:' + r.rowOpacity}
                    sh="background:#EDF0E5"
                  >
                    <td style={css('padding:10px 6px;border-bottom:1px solid #E7E3D6;text-align:center')}>
                      <span style={css(MONO + ';font-weight:600;font-size:13px;color:' + r.noColor + ';direction:ltr')}>
                        {r.numero}
                      </span>
                    </td>
                    <td style={css(TD + ';white-space:nowrap')}>
                      <span style={css('font-weight:500')}>{r.fullname}</span>
                    </td>
                    <td style={css(TD + ';text-align:left;white-space:nowrap')}>
                      <span style={css(MONO + ';direction:ltr;display:inline-block')}>{r.convenu}</span>
                    </td>
                    <td style={css(TD + ';text-align:left;white-space:nowrap')}>
                      <span style={css(MONO + ';direction:ltr;display:inline-block')}>{r.payeStr}</span>
                    </td>
                    <td style={css(TD + ';text-align:left;white-space:nowrap')}>
                      <span
                        style={css(
                          MONO +
                            ';direction:ltr;display:inline-block;font-weight:' +
                            r.restWeight +
                            ';color:' +
                            r.restColor,
                        )}
                      >
                        {r.restStr}
                      </span>
                    </td>
                    <td style={css(TD + ';white-space:nowrap')}>
                      <span style={css(MONO + ';font-size:11.5px')}>{r.date}</span>
                    </td>
                    <td style={css(TD + ';text-align:left;white-space:nowrap')}>
                      <span style={css(MONO + ';font-weight:600;direction:ltr;display:inline-block;font-size:12px')}>
                        {r.versCount}
                        <span style={css('font-weight:400;color:#6E7565;font-size:10.5px')}>/{r.maxVers}</span>
                      </span>
                    </td>
                    <td style={css(TD)}>
                      <span
                        style={css(
                          'display:inline-block;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;background:' +
                            r.statusBg +
                            ';color:' +
                            r.statusColor,
                        )}
                      >
                        {r.statusLabel}
                      </span>
                    </td>
                    <td style={css(TD + ';white-space:nowrap')}>{r.hotel}</td>
                    <td style={css(TD + ';white-space:nowrap')}>
                      <span style={css(MONO)}>{r.chambre}</span>
                    </td>
                    <td style={css(TD + ';white-space:nowrap')}>{r.vol}</td>
                    <td style={css(TD + ';white-space:nowrap')}>{r.rabatteur}</td>
                    <td style={css(TD + ';color:#9CA28F;font-size:11.5px')}>
                      <span
                        style={css(
                          'max-width:130px;overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:bottom;white-space:nowrap',
                        )}
                      >
                        {r.note}
                      </span>
                    </td>
                    <td style={css(TD + ';color:#9CA28F;font-size:11.5px;white-space:nowrap')}>{r.employe}</td>
                    <td style={css(TD + ';color:#9CA28F;font-size:11.5px;text-align:left;white-space:nowrap')}>
                      <span style={css(MONO + ';direction:ltr;display:inline-block')}>{r.reduction}</span>
                    </td>
                    <td style={css(TD + ';color:#9CA28F;font-size:11.5px;white-space:nowrap')}>
                      <span style={css(MONO + ';direction:ltr;display:inline-block')}>{r.tel}</span>
                    </td>
                    <td style={css(TD + ';color:#9CA28F;font-size:11.5px;white-space:nowrap')}>{r.groupe}</td>
                    <td
                      style={css(
                        'padding:10px 8px;border-bottom:1px solid #E7E3D6;text-align:center;width:136px;min-width:136px;vertical-align:middle',
                      )}
                    >
                      <div
                        onDoubleClick={r.stopRowEvent}
                        style={css(
                          'display:flex;gap:4px;direction:ltr;align-items:center;justify-content:center;width:120px;margin:0 auto',
                        )}
                      >
                        <Btn
                          disabled={r.noCancel}
                          onClick={r.openCancelRow}
                          s={
                            'width:28px;height:28px;border-radius:7px;display:grid;place-items:center;color:#6E7565;opacity:' +
                            r.cancelOpacity
                          }
                          sh="background:#F7E8E5;color:#9C3B32"
                          title="إلغاء / حذف الوصل"
                        >
                          <Icon size={14}>
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v5M14 11v5" />
                          </Icon>
                        </Btn>
                        <Btn
                          disabled={r.noEdit}
                          onClick={r.openEditRow}
                          s={
                            'width:28px;height:28px;border-radius:7px;display:grid;place-items:center;color:#6E7565;opacity:' +
                            r.editOpacity
                          }
                          sh="background:#F6EEDA;color:#A3801F"
                          title="تعديل"
                        >
                          <Icon size={14}>
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                          </Icon>
                        </Btn>
                        <Btn
                          onClick={r.openPrint}
                          s="width:28px;height:28px;border-radius:7px;display:grid;place-items:center;color:#6E7565"
                          sh="background:#F6EEDA;color:#A3801F"
                          title="طباعة"
                        >
                          <Icon size={14}>
                            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <path d="M6 14h12v8H6z" />
                          </Icon>
                        </Btn>
                        <Btn
                          disabled={r.noPay}
                          onClick={r.openPayRow}
                          s={
                            'width:28px;height:28px;border-radius:7px;display:grid;place-items:center;color:#6E7565;opacity:' +
                            r.payOpacity
                          }
                          sh="background:#F6EEDA;color:#A3801F"
                          title="إضافة دفعة"
                        >
                          <Icon size={14}>
                            <path d="M12 5v14M5 12h14" />
                          </Icon>
                        </Btn>
                      </div>
                    </td>
                  </Tr>
                ))}
                {v.rowsEmpty ? (
                  <tr>
                    <td colSpan={18}>
                      <p style={css('padding:48px;text-align:center;color:#6E7565')}>لا توجد نتائج.</p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div
            style={css(
              'display:flex;align-items:center;gap:16px;padding:13px 16px;border-top:1px solid #E7E3D6;font-size:12px;color:#6E7565;flex-wrap:wrap',
            )}
          >
            <span>{v.cntLabel}</span>
            <button
              type="button"
              onClick={v.toggleCx}
              style={css(
                'color:#47593C;font-weight:600;font-size:12px;text-decoration:underline;text-underline-offset:3px',
              )}
            >
              {v.cxBtnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
