'use client'

import { Icon, css } from '../ui'
import type { Vals } from '../useZemzem'

const CARDS: [string, string][] = [
  ['إحصائيات عامة', 'المسافرون، الوصولات، الحالات'],
  ['المدفوعات والصندوق', 'المبالغ، طرق الدفع، الباقي'],
  ['الفنادق والرحلات', 'التوزيع حسب البرنامج'],
  ['الموظفون', 'النشاط والصلاحيات — للإدارة فقط لاحقًا'],
]

export function StatsScreen({ v }: { v: Vals }) {
  return (
    <div data-screen-label="الإحصائيات" style={css('min-height:100vh;background:#F9F7F2')}>
      <header
        style={css(
          'display:flex;align-items:center;gap:16px;padding:13px 24px;background:#fff;border-bottom:1px solid #E7E3D6;position:sticky;top:0;z-index:50',
        )}
      >
        <div
          style={css(
            'width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#C9A24A,#A3801F);color:#fff',
          )}
        >
          <Icon size={20} width="1.8">
            <path d="M4 19V9" />
            <path d="M10 19V5" />
            <path d="M16 19v-7" />
            <path d="M22 19V2" />
          </Icon>
        </div>
        <div>
          <div style={css('font-size:14.5px;font-weight:600')}>زمزم أسفار</div>
          <div style={css('font-size:11px;color:#6E7565')}>الإحصائيات — جاهزة للربط لاحقًا</div>
        </div>
        <div style={css('margin-inline-start:auto;display:flex;gap:8px')}>
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
            onClick={v.goFinance}
            style={css(
              'padding:8px 13px;border:1px solid #E7E3D6;border-radius:9px;background:#fff;font-size:12.5px;font-weight:600',
            )}
          >
            المالية
          </button>
          <button
            type="button"
            style={css('padding:8px 13px;border-radius:9px;background:#47593C;color:#fff;font-size:12.5px;font-weight:600')}
          >
            الإحصائيات
          </button>
        </div>
      </header>
      <main style={css('max-width:1180px;margin:0 auto;padding:28px 24px 48px')}>
        <div style={css('display:flex;align-items:flex-end;gap:14px;margin-bottom:18px')}>
          <div>
            <h1 style={css('font-size:23px;font-weight:700')}>الإحصائيات</h1>
            <p style={css('font-size:12.5px;color:#6E7565;margin-top:4px')}>
              تم حجز الصفحة دون إضافة حسابات أو رسوم الآن، حتى لا تتأثر الفوترة.
            </p>
          </div>
          <span
            style={css(
              'margin-inline-start:auto;padding:6px 10px;border-radius:8px;background:#EDF0E5;color:#47593C;font-size:11.5px;font-weight:700',
            )}
          >
            مرحلة لاحقة
          </span>
        </div>
        <div className="stats-placeholder-grid">
          {CARDS.map(([title, sub]) => (
            <div className="stats-placeholder-card" key={title}>
              <div>
                <b style={css('display:block;color:#47593C;margin-bottom:6px')}>{title}</b>
                <span style={css('font-size:12px')}>{sub}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
