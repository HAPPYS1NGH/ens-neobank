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

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { WalletProvider, useWallet, type Sheet } from '@/wallet/store'
import { Shell, SheetPresence, SHEET_EXIT_MS } from '@/wallet/components/Shell'
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
      return <NameWallet purpose={screen.purpose} walletId={screen.walletId} />
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

function reduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function sheetTree(sheet: Sheet) {
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

/**
 * Store `sheet` goes to `none` on close. Keep the last tree mounted until the
 * exit transition finishes so an in-flight open can reverse. Nothing in the
 * store changes. Toast `data-raised` keys off this painted sheet, not the
 * store, so a toast stays above Save while the sheet is still leaving.
 */
function OverlayHost() {
  const w = useWallet()
  const live = w.sheet
  const [painted, setPainted] = useState(live)
  const [open, setOpen] = useState(live.kind !== 'none')
  const paintedRef = useRef(painted)
  paintedRef.current = painted

  useLayoutEffect(() => {
    if (live.kind !== 'none') {
      setPainted(live)
      setOpen(true)
      return
    }
    setOpen(false)
    if (paintedRef.current.kind === 'none') return
    const ms = reduceMotion() ? 0 : SHEET_EXIT_MS
    const timer = window.setTimeout(() => setPainted({ kind: 'none' }), ms)
    return () => window.clearTimeout(timer)
  }, [live])

  return (
    <>
      {painted.kind !== 'none' && (
        <SheetPresence open={open}>{sheetTree(painted)}</SheetPresence>
      )}
      <ToastLayer raised={painted.kind !== 'none'} />
    </>
  )
}

/* ------------------------------------------------------------------- toast */

/**
 * The store owns toast text and its own clear timer; this only paints it. One
 * pill above the home indicator, over whatever screen and sheet are up —
 * several flows (Buy, Scan, add-wallet save) speak entirely through it.
 */
const TOAST_EXIT_MS = 160

function ToastLayer({ raised }: { raised: boolean }) {
  const w = useWallet()
  const live = w.toast
  const [text, setText] = useState<string | null>(live)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const holding = useRef(false)

  useLayoutEffect(() => {
    if (live) {
      holding.current = true
      setText(live)
      setClosing(false)
      if (reduceMotion()) {
        setOpen(true)
        return
      }
      let inner = 0
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setOpen(true))
      })
      return () => {
        cancelAnimationFrame(outer)
        cancelAnimationFrame(inner)
      }
    }
    setOpen(false)
    if (!holding.current) return
    setClosing(true)
    const ms = reduceMotion() ? 0 : TOAST_EXIT_MS
    const timer = window.setTimeout(() => {
      holding.current = false
      setText(null)
      setClosing(false)
    }, ms)
    return () => window.clearTimeout(timer)
  }, [live])

  if (!text) return null
  return (
    <div
      className="tgx-toast-layer"
      data-raised={raised || undefined}
      data-open={open || undefined}
      data-closing={closing || undefined}
      role="status"
    >
      <p className="tgx-toast">{text}</p>
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
    <Shell statusTint={w.screen.name === 'nameWallet' ? '#ffffff' : undefined}>
      {w.ready ? (
        <>
          <ScreenRouter />
          <OverlayHost />
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
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 220ms cubic-bezier(0.32, 0.72, 0, 1),
              transform 220ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}
.tgx-toast-layer[data-open] {
  opacity: 1;
  transform: translateY(0);
}
.tgx-toast-layer[data-closing] {
  opacity: 0;
  transform: translateY(8px);
  transition-duration: 160ms;
}

/* Sheet Save sits ~36px from the screen bottom plus a 46px button. Lift the
 * toast just above that band so the two never share a row. */
.tgx-toast-layer[data-raised] {
  bottom: 118px;
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
`