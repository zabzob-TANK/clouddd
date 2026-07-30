'use client'

import { useEffect, useState } from 'react'

import './facturation.css'
import { CancelModal } from './modals/CancelModal'
import { DetailModal } from './modals/DetailModal'
import { EditModal } from './modals/EditModal'
import { FinanceAnomalyModal } from './modals/FinanceAnomalyModal'
import { LogModal } from './modals/LogModal'
import { NewModal } from './modals/NewModal'
import { PassportModal } from './modals/PassportModal'
import { PayModal } from './modals/PayModal'
import { FinanceScreen } from './screens/FinanceScreen'
import { HomeScreen } from './screens/HomeScreen'
import { LoginScreen } from './screens/LoginScreen'
import { ReceiptScreen } from './screens/ReceiptScreen'
import { StatsScreen } from './screens/StatsScreen'
import { css } from './ui'
import { useZemzem } from './useZemzem'

const ROOT =
  "min-height:100vh;background:#F9F7F2;color:#1C2117;font-family:'IBM Plex Sans Arabic','Noto Sans Arabic',Tahoma,Arial,sans-serif;font-size:14px;line-height:1.6"

export function ZemzemApp() {
  // Le prototype ne s'affiche qu'après amorçage côté navigateur (localStorage,
  // date du jour) : on reproduit ce comportement pour éviter tout écart SSR.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const v = useZemzem()

  if (!mounted) return <div className="zemzem-app" dir="rtl" lang="ar" style={css(ROOT)} />

  return (
    <div className="zemzem-app" dir="rtl" lang="ar" style={css(ROOT)}>
      {v.isLogin ? <LoginScreen v={v} /> : null}
      {v.isHome ? <HomeScreen v={v} /> : null}
      {v.isStats ? <StatsScreen v={v} /> : null}
      {v.isFinance ? <FinanceScreen v={v} /> : null}
      {v.isRecu ? <ReceiptScreen v={v} /> : null}

      {v.modalDetailOpen ? <DetailModal v={v} /> : null}
      {v.modalFinanceAnomalyOpen ? <FinanceAnomalyModal v={v} /> : null}
      {v.modalNewOpen ? <NewModal v={v} /> : null}
      {v.modalPassportOpen ? <PassportModal v={v} /> : null}
      {v.modalPayOpen ? <PayModal v={v} /> : null}
      {v.modalCxOpen ? <CancelModal v={v} /> : null}
      {v.modalLogOpen ? <LogModal v={v} /> : null}
      {v.modalEditOpen ? <EditModal v={v} /> : null}

      {v.toastShow ? (
        <div
          className="no-print"
          style={css(
            'position:fixed;bottom:22px;left:50%;transform:translateX(-50%) translateY(-4px);z-index:300;background:' +
              v.toastBg +
              ';color:#fff;padding:12px 22px;border-radius:11px;font-size:13.5px;font-weight:500;box-shadow:0 1px 2px rgba(28,33,23,.06),0 8px 24px -14px rgba(28,33,23,.18)',
          )}
        >
          {v.toastMsg}
        </div>
      ) : null}
    </div>
  )
}
