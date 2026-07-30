'use client'

import { Logo, css } from '../ui'
import type { Vals } from '../useZemzem'

const COLS = [
  'c-time',
  'c-date',
  'c-receipt',
  'c-pay',
  'c-name',
  'c-cash',
  'c-bankamt',
  'c-mode',
  'c-real',
  'c-checkinfo',
  'c-employee',
  'c-rab',
  'c-hotel',
  'c-room',
  'c-flight',
  'c-agreed',
  'c-remain',
  'c-status',
]

function ColGroup() {
  return (
    <colgroup>
      {COLS.map((c) => (
        <col className={c} key={c} />
      ))}
    </colgroup>
  )
}

export function FinanceScreen({ v }: { v: Vals }) {
  return (
    <div className="finance-screen" data-screen-label="المالية / الصندوق" style={css('min-height:100vh;background:#F9F7F2')}>
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
          <div style={css('font-size:11px;color:#6E7565')}>المالية والصندوق</div>
        </div>
        <div style={css('margin-inline-start:auto;display:flex;align-items:center;gap:8px')}>
          <button
            type="button"
            onClick={v.goHome}
            style={css(
              'padding:8px 13px;border:1px solid #E7E3D6;border-radius:9px;background:#fff;font-size:12.5px;font-weight:600',
            )}
          >
            الوصولات
          </button>
          <button
            type="button"
            onClick={v.goStats}
            style={css(
              'padding:8px 13px;border:1px solid #E7E3D6;border-radius:9px;background:#fff;font-size:12.5px;font-weight:600',
            )}
          >
            الإحصائيات
          </button>
          <button
            type="button"
            style={css('padding:8px 13px;border-radius:9px;background:#47593C;color:#fff;font-size:12.5px;font-weight:600')}
          >
            المالية / الصندوق
          </button>
        </div>
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
          <button
            type="button"
            onClick={v.logout}
            style={css(
              'width:34px;height:34px;border-radius:9px;display:grid;place-items:center;border:1px solid #E7E3D6;color:#6E7565;margin-inline-start:6px',
            )}
            title="خروج"
          >
            ✕
          </button>
        </div>
      </header>

      <main className="finance-report" style={css('max-width:1540px;margin:0 auto;padding:18px 20px 42px')}>
        <div className="finance-no-print finance-toolbar">
          <div className="finance-toolbar-left">
            <span className="finance-print-code mono-ltr">{v.financePrintMark}</span>
            <button
              type="button"
              onClick={v.printFinance}
              disabled={v.financePrintDisabled}
              className="finance-top-btn print"
              style={css('opacity:' + v.financePrintOpacity)}
            >
              طباعة
            </button>
            <button type="button" onClick={v.financePrevDay} className="finance-top-btn icon">
              ‹
            </button>
            <div className="finance-date-shell">
              <span className="finance-indicator" style={css('background:' + v.financeIndicatorBg)} />
              <input onChange={v.onFinanceDay} type="date" value={v.financeDay} />
            </div>
            <button type="button" onClick={v.financeNextDay} className="finance-top-btn icon">
              ›
            </button>
            <div className="finance-filter-row">
              <button
                type="button"
                onClick={v.financeToday}
                className="finance-filter-btn finance-top-btn"
                style={css(
                  'background:' + v.financeTodayBg + ';color:' + v.financeTodayColor + ';border-color:' + v.financeTodayBorder,
                )}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={v.financeYesterday}
                className="finance-filter-btn finance-top-btn"
                style={css(
                  'background:' +
                    v.financeYesterdayBg +
                    ';color:' +
                    v.financeYesterdayColor +
                    ';border-color:' +
                    v.financeYesterdayBorder,
                )}
              >
                أمس
              </button>
              <button
                type="button"
                onClick={v.financeAll}
                className="finance-filter-btn finance-top-btn"
                style={css(
                  'background:' + v.financeAllBg + ';color:' + v.financeAllColor + ';border-color:' + v.financeAllBorder,
                )}
              >
                الكل
              </button>
            </div>
          </div>
        </div>

        <div
          className="finance-title-print"
          style={css('display:none;align-items:center;justify-content:flex-end;margin-bottom:1.5mm;font-size:8pt')}
        >
          <span className="finance-print-state">
            <span className="finance-print-indicator" style={css('background:' + v.financeIndicatorBg)} />
            <b>{v.financePrintStateSymbol}</b>
            <span className="mono-ltr">{v.financePrintMark}</span>
          </span>
        </div>

        {v.financeAnomalyShow ? (
          <button
            type="button"
            onClick={v.acknowledgeFinanceAnomaly}
            className="finance-no-print"
            style={css(
              'width:100%;text-align:right;border:1px solid #E2A84B;background:#FFF7E8;color:#7A4C08;border-radius:6px;padding:9px 11px;margin-bottom:7px;font-size:11px;font-weight:600',
            )}
          >
            {v.financeAnomalyText}
          </button>
        ) : null}

        <div className="finance-summary">
          <div className="status-box">
            <div className="tick" style={css('color:' + v.financeStatusColor)}>
              {v.financePrintStateSymbol}
            </div>
            <div className="value">{v.financeModificationCount}</div>
            <div className="label">التعديلات</div>
          </div>
          <div className="stack-box">
            <div className="stack-row">
              <div className="value money-ltr">{v.financeCashRefunds}</div>
              <div className="label">إلغاء ({v.financeRefundCount})</div>
            </div>
            <div className="stack-row">
              <div className="value money-ltr">{v.financeCashNet}</div>
              <div className="label">الصندوق</div>
            </div>
          </div>
          <div className="stack-box">
            <div className="stack-row">
              <div className="value">{v.financeNewClientCount}</div>
              <div className="label">جديد</div>
            </div>
            <div className="stack-row">
              <div className="value">{v.financePaymentCount}</div>
              <div className="label">دفعات</div>
            </div>
          </div>
          <div className="primary-box">
            <div className="label">المبلغ الإجمالي</div>
            <div className="value money-ltr">{v.financeGrandTotal}</div>
          </div>
          <div className="stack-box">
            <div className="stack-row">
              <div className="value money-ltr">{v.financeChequeActual}</div>
              <div className="label">شيك ({v.financeChequeOperationCount})</div>
            </div>
            <div className="stack-row">
              <div className="value money-ltr">{v.financeTransfer}</div>
              <div className="label">تحويل ({v.financeTransferCount})</div>
            </div>
          </div>
          <div className="meta-box">
            <div className="meta-top">
              <span>
                آخر وصل <b className="meta-strong mono-ltr">{v.financeLastReceipt}</b>
              </span>
              <span className="date-main">{v.financeRangeLabel}</span>
              <span>
                <b className="meta-strong">{v.financePaymentCount}</b> عملية
              </span>
            </div>
            <div className="meta-big money-ltr">{v.financeCash}</div>
          </div>
        </div>

        <section
          className="finance-main-table-card"
          style={css('background:#fff;border:1px solid #E7E3D6;border-radius:8px;overflow:hidden')}
        >
          <div className="finance-table-wrap" style={css('overflow-x:auto')}>
            <table className="finance-table">
              <ColGroup />
              <thead>
                <tr>
                  <th>الوقت</th>
                  <th>التاريخ</th>
                  <th>رقم الوصل</th>
                  <th>الدفعة</th>
                  <th>الاسم الكامل</th>
                  <th>نقد</th>
                  <th>شيك / تحويل</th>
                  <th>الطريقة</th>
                  <th className="tiny">القيمة الحقيقية</th>
                  <th className="tiny">بيانات الشيك</th>
                  <th>الموظف</th>
                  <th>الوسيط</th>
                  <th>الفندق</th>
                  <th>الغرفة</th>
                  <th>الرحلة</th>
                  <th className="tiny">المبلغ المتفق</th>
                  <th>الباقي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {v.financeRows.map((p, i) => (
                  <tr
                    key={p.receipt + '-' + p.paymentBadge + '-' + i}
                    onDoubleClick={p.openClient}
                    className={p.rowClass}
                    style={css('cursor:pointer;opacity:' + p.opacity)}
                  >
                    <td style={css('text-align:center')}>
                      <span className="mono-ltr">{p.time}</span>
                    </td>
                    <td style={css('text-align:center')}>
                      <span className="mono-ltr">{p.date}</span>
                    </td>
                    <td style={css('text-align:center')}>
                      <span className="mono-ltr" style={css('font-weight:700;color:#A3801F')}>
                        {p.receipt}
                      </span>
                    </td>
                    <td style={css('text-align:center')}>
                      <span className={'finance-badge ' + p.paymentBadgeClass}>{p.paymentBadge}</span>
                    </td>
                    <td style={css('font-weight:600;text-align:right')}>
                      {p.client}
                      {p.afterLastPrint ? <span className="finance-anomaly-mark">!</span> : null}
                    </td>
                    <td>
                      <span className="finance-money-box money-ltr">{p.cashAmount}</span>
                    </td>
                    <td>
                      <span className="finance-money-box money-ltr">{p.bankAmount}</span>
                    </td>
                    <td style={css('text-align:center')}>
                      <span className="finance-badge plain micro">{p.modeCode}</span>
                    </td>
                    <td style={css('text-align:left')}>
                      <span className="money-ltr">{p.realCheque}</span>
                    </td>
                    <td className="micro" title={p.checkInfo}>
                      {p.checkInfo}
                    </td>
                    <td className="tiny">{p.employee}</td>
                    <td className="tiny">{p.rabatteur}</td>
                    <td className="micro" title={p.hotel}>
                      {p.hotel}
                    </td>
                    <td style={css('text-align:center')}>
                      <span className="mono-ltr">{p.room}</span>
                    </td>
                    <td className="micro" title={p.flight}>
                      {p.flight}
                    </td>
                    <td style={css('text-align:left')}>
                      <span className="money-ltr">{p.agreed}</span>
                    </td>
                    <td style={css('text-align:left')}>
                      <span className="money-ltr">{p.remaining}</span>
                    </td>
                    <td style={css('text-align:center')}>
                      <span className={'finance-badge ' + p.statusBadgeClass}>{p.statusSymbol}</span>
                    </td>
                  </tr>
                ))}
                {v.financeRowsEmpty ? (
                  <tr>
                    <td colSpan={18} style={css('padding:30px;text-align:center;color:#6E7565')}>
                      لا توجد دفعات في هذه الفترة.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {v.financeCancelShow ? (
          <section className="finance-cancel-section-v6">
            <div className="finance-table-wrap" style={css('overflow-x:auto')}>
              <table className="finance-table finance-cancel-table">
                <ColGroup />
                <tbody>
                  {v.financeCancelRows.map((c, i) => (
                    <tr className="finance-cancel-row" key={c.receipt + '-' + i}>
                      <td style={css('text-align:center')}>
                        <span className="mono-ltr">{c.time}</span>
                      </td>
                      <td style={css('text-align:center')}>
                        <span className="mono-ltr">{c.date}</span>
                      </td>
                      <td style={css('text-align:center')}>
                        <span className="mono-ltr" style={css('font-weight:700')}>
                          {c.receipt}
                        </span>
                      </td>
                      <td style={css('text-align:center')}>
                        <span className="finance-badge gray">×</span>
                      </td>
                      <td style={css('font-weight:700')}>{c.client}</td>
                      <td>
                        <span className="finance-money-box money-ltr">{c.cashAmount}</span>
                      </td>
                      <td>
                        <span className="finance-money-box money-ltr">{c.bankAmount}</span>
                      </td>
                      <td style={css('text-align:center')}>
                        <span className="finance-badge plain micro">{c.modeCode}</span>
                      </td>
                      <td>
                        <span className="money-ltr">{c.realCheque}</span>
                      </td>
                      <td className="micro" title={c.checkInfo}>
                        {c.checkInfo}
                      </td>
                      <td className="tiny">{c.employee}</td>
                      <td className="tiny">{c.rabatteur}</td>
                      <td className="micro">{c.hotel}</td>
                      <td style={css('text-align:center')}>
                        <span className="mono-ltr">{c.room}</span>
                      </td>
                      <td className="micro">{c.flight}</td>
                      <td>
                        <span className="money-ltr">{c.agreed}</span>
                      </td>
                      <td>
                        <span className="money-ltr">{c.remaining}</span>
                      </td>
                      <td style={css('text-align:center')}>
                        <span className="finance-badge gray">×</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <div style={css('display:flex;justify-content:flex-end;margin-top:4px;font-size:8px;color:#777')}>
          <span className="mono-ltr">{v.financePrintFooterCode}</span>
        </div>
      </main>
    </div>
  )
}
