'use client'

import { Btn, Logo, css } from '../ui'
import type { Vals } from '../useZemzem'

export function LoginScreen({ v }: { v: Vals }) {
  return (
    <div
      data-screen-label="دخول"
      style={css(
        'min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(1100px 500px at 50% -10%,#EDF0E5,transparent 70%),#F9F7F2',
      )}
    >
      <div
        style={css(
          'width:100%;max-width:400px;background:#fff;border:1px solid #E7E3D6;border-radius:20px;padding:44px 36px 34px;box-shadow:0 1px 2px rgba(28,33,23,.06),0 12px 32px -14px rgba(28,33,23,.2);text-align:center',
        )}
      >
        <div
          style={css(
            'width:70px;height:70px;border-radius:50%;margin:0 auto 20px;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#C9A24A,#A3801F);box-shadow:inset 0 -2px 7px rgba(0,0,0,.18)',
          )}
        >
          <Logo size={36} width="1.6" />
        </div>
        <div style={css('font-size:21px;font-weight:600;letter-spacing:.01em')}>زمزم أسفار</div>
        <div style={css('font-size:12.5px;color:#6E7565;margin-top:3px')}>تدبير العمرة</div>
        <div style={css('height:1px;background:#E7E3D6;margin:26px 0')} />
        {v.loginErr ? (
          <div
            style={css(
              'background:#F7E8E5;color:#9C3B32;border-radius:9px;padding:10px 13px;font-size:12.5px;font-weight:500;margin-bottom:14px;text-align:right',
            )}
          >
            {v.loginErr}
          </div>
        ) : null}
        <div style={css('text-align:right;margin-bottom:14px')}>
          <label style={css('display:block;font-size:12.5px;font-weight:500;color:#6E7565;margin-bottom:6px')}>
            اسم المستخدم
          </label>
          <input
            autoComplete="off"
            onChange={v.onLoginU}
            onKeyDown={v.onLoginKey}
            style={css(
              'width:100%;padding:11px 13px;border:1px solid #E7E3D6;border-radius:10px;background:#F9F7F2;font-size:14px',
            )}
            type="text"
            value={v.loginU}
          />
        </div>
        <div style={css('text-align:right;margin-bottom:6px')}>
          <label style={css('display:block;font-size:12.5px;font-weight:500;color:#6E7565;margin-bottom:6px')}>
            كلمة المرور
          </label>
          <input
            onChange={v.onLoginP}
            onKeyDown={v.onLoginKey}
            style={css(
              'width:100%;padding:11px 13px;border:1px solid #E7E3D6;border-radius:10px;background:#F9F7F2;font-size:14px',
            )}
            type="password"
            value={v.loginP}
          />
        </div>
        <Btn
          onClick={v.doLogin}
          s="width:100%;padding:12px;border-radius:10px;background:#47593C;color:#fff;font-weight:600;margin-top:16px;font-size:14.5px"
          sh="background:#2E3B27"
        >
          دخول
        </Btn>
        <p style={css('font-size:11.5px;color:#6E7565;margin-top:16px;line-height:1.7')}>
          للتجربة: <span style={css('direction:ltr;display:inline-block')}>admin / admin</span> ·{' '}
          <span style={css('direction:ltr;display:inline-block')}>samir / 1234</span>
        </p>
      </div>
    </div>
  )
}
