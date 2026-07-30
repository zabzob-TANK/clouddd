'use client'

import { Btn, css } from '../ui'
import type { Vals } from '../useZemzem'

export function LogModal({ v }: { v: Vals }) {
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
          <h2 style={css('font-size:16.5px;font-weight:600;flex:1')}>سجل العمليات</h2>
          <Btn
            onClick={v.closeAll}
            s="width:31px;height:31px;border-radius:8px;display:grid;place-items:center;color:#6E7565"
            sh="background:#EDF0E5"
          >
            ✕
          </Btn>
        </div>
        <div style={css('padding:20px 24px')}>
          <div style={css('max-height:60vh;overflow-y:auto')}>
            {v.auditLog.map((e, i) => (
              <div
                key={i}
                style={css('display:flex;gap:11px;padding:10px 0;border-bottom:1px solid #E7E3D6;font-size:12.5px')}
              >
                <span
                  style={css(
                    "font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6E7565;flex:0 0 118px;direction:ltr;text-align:right",
                  )}
                >
                  {e.t}
                </span>
                <span style={css('font-weight:600;flex:0 0 100px')}>{e.a}</span>
                <span style={css('color:#6E7565;flex:1')}>{e.d}</span>
              </div>
            ))}
            {v.auditEmpty ? <p style={css('padding:44px;text-align:center;color:#6E7565')}>لا توجد عمليات.</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
