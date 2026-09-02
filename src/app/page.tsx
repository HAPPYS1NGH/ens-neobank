'use client'

/**
 * The client entry: one <WalletProvider> inside the device <Shell>, and two
 * routers that translate store state into screens and sheets.
 *
 * Routing is the store's `screen` / `sheet` unions, and nothing else — there is
 * no URL router, because the demo is a phone. Every screen renders full-bleed
 * inside `.tg-screen` (they position themselves absolutely against it); every
 * sheet component owns its own <Sheet> chrome, so this file only decides which
 * one is mounted.
 *
 * Screens receive no navigation props: the defaults each screen carries already
 * route through the store, and the flows they describe are the ones SPEC.md
 * asks for (onboarding → claim → home; manage tokens → add-address writes;
 * transfer → send → review → done; details → address book / wallet detail).
 * The one prop this file does bridge is Send's `initialRecipient`, which stays
 * unused until a caller hands a contact over directly — the address book
 * handoff runs through the contact pills Send renders from `w.contacts`.
 */

import { useEffect, useRef } from 'react'
import { WalletProvider, useWallet } from '@/wallet/store'
import { Shell } from '@/wallet/components/Shell'
import { Onboarding } from '@/wallet/screens/Onboarding'
import { NameWallet } from '@/wallet/screens/NameWallet'
import { NameClaimed } from '@/wallet/screens/NameClaimed'
import { Home } from '@/wallet/screens/Home'
import { TokenDetail } from '@/wallet/screens/TokenDetail'
import { Send } from '@/wallet/screens/Send'
import { SendReview } from '@/wallet/screens/SendReview'
import { SendDone } from '@/wallet/screens/SendDone'
import { Details } from '@/wallet/screens/Details'
import { WalletDetail } from '@/wallet/screens/WalletDetail'
import AddressBook, { AddContact } from '@/wallet/screens/AddressBook'
import { AddManageSheet } from '@/wallet/screens/AddManageSheet'
import { ManageTokens } from '@/wallet/screens/ManageTokens'
import { ChooseAccount } from '@/wallet/screens/ChooseAccount'
import { ChooseToken } from '@/wallet/screens/ChooseToken'
import { TransferSheet } from '@/wallet/screens/TransferSheet'
import { Receive } from '@/wallet/screens/Receive'
import { AddNetworkSheet } from '@/wallet/screens/AddNetworkSheet'
import { AddWalletSheet } from '@/wallet/screens/AddWalletSheet'

/* ------------------------------------------------------------------ screens */

function ScreenRouter() {
  const w = useWallet()
  const screen = w.screen

  switch (screen.name) {
    case 'onboarding':
      return <Onboarding />
    case 'nameWallet':
      return <NameWallet purpose={screen.purpose} />
    case 'nameClaimed':
      return <NameClaimed />
    case 'home':
      return <Home />
    case 'tokenDetail':
      return <TokenDetail networkId={screen.networkId} />
    case 'send':
      return <Send networkId={screen.networkId} />
    case 'sendReview':
      return (
        <SendReview
          networkId={screen.networkId}
          to={screen.to}
          resolved={screen.resolved}
          amount={screen.amount}
        />
      )
    case 'sendDone':
      return <SendDone networkId={screen.networkId} to={screen.to} amount={screen.amount} />
    case 'details':
      return <Details />
    case 'walletDetail':
      return <WalletDetail walletId={screen.walletId} />
    case 'addressBook':
      return <AddressBook />
    case 'addContact':
      return <AddContact />
    default:
      return null
  }
}

/* ------------------------------------------------------------------- sheets */

function SheetRouter() {
  const w = useWallet()
  const sheet = w.sheet

  switch (sheet.kind) {
    case 'none':
      return null
    case 'addManage':
      return <AddManageSheet />
    case 'manageTokens':
      return <ManageTokens />
    case 'chooseAccount':
      return <ChooseAccount />
    case 'chooseToken':
      return <ChooseToken purpose={sheet.purpose} />
    case 'transfer':
      return <TransferSheet networkId={sheet.networkId} />
    case 'receive':
      return <Receive networkId={sheet.networkId} />
    case 'addNetwork':
      return <AddNetworkSheet />
    case 'addWallet':
      return <AddWalletSheet />
    default:
      return null
  }
}

/* ------------------------------------------------------------------- toast */

/**
 * The store owns toast text and its own clear timer; this only paints it. One
 * pill above the home indicator, over whatever screen and sheet are up —
 * several flows (Buy, Scan, add-wallet save) speak entirely through it.
 */
function ToastLayer() {
  const w = useWallet()
  if (!w.toast) return null
  return (
    <div className="tgx-toast-layer" role="status">
      <p className="tgx-toast">{w.toast}</p>
    </div>
  )
}

/* -------------------------------------------------------------------- boot */

/**
 * Until `ready` the wallet does not know whether it is named, so any screen
 * built on `w.walletTitle` or `w.ensName` would flash the wrong thing. Hold the
 * frame with the page background for the beat the owner lookup takes.
 */
function Boot() {
  return <div className="tgx-boot" aria-busy="true" />
}

function App() {
  const w = useWallet()

  /* The deep link that wipes the demo: `?reset=1` clears the seed and local
   * state and reloads. The param is stripped before the reload so the fresh
   * page does not fire it again, and a ref guards the double-invoke React
   * strict mode gives effects in development. Read straight off the URL —
   * this render tree is entirely client-side, so there is nothing for
   * useSearchParams to wait on.
   */
  const resetFired = useRef(false)
  useEffect(() => {
    if (resetFired.current) return
    resetFired.current = true
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') !== '1') return
    params.delete('reset')
    const rest = params.toString()
    window.history.replaceState(
      null,
      '',
      rest ? `${window.location.pathname}?${rest}` : window.location.pathname,
    )
    w.resetWallet()
  }, [w])

  return (
    <Shell>
      {w.ready ? (
        <>
          <ScreenRouter />
          <SheetRouter />
          <ToastLayer />
        </>
      ) : (
        <Boot />
      )}
      <style>{APP_CSS}</style>
    </Shell>
  )
}

export default function Page() {
  return (
    <WalletProvider>
      <App />
    </WalletProvider>
  )
}

/* --------------------------------------------------------------------- css */

/**
 * Only the two pieces no screen owns: the boot hold and the toast. Scoped
 * `tgx-` so this cannot collide with the `tg-` (Shell), `tgo-`/`tgn-`/… (each
 * screen) or unprefixed (globals.css) sets.
 */
const APP_CSS = `
.tgx-boot {
  position: absolute;
  inset: 0;
  background: var(--bg-page);
}

.tgx-toast-layer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 54px;
  display: flex;
  justify-content: center;
  padding: 0 32px;
  /* Above a sheet (z 50) but below the status bar trim. */
  z-index: 55;
  pointer-events: none;
  animation: tgx-rise .22s cubic-bezier(.22, .8, .3, 1);
}

.tgx-toast {
  max-width: 100%;
  padding: 12px 18px;
  border-radius: var(--r-pill, 999px);
  background: var(--text-1);
  color: var(--bg-page);
  font-size: var(--fs-sub);
  line-height: 1.35;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .18);
}

@keyframes tgx-rise {
  from { transform: translateY(12px); opacity: 0 }
  to { transform: none; opacity: 1 }
}
`