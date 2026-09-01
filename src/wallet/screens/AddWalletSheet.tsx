'use client'

/**
 * Add wallet — IMG_4308, recoloured to light.
 *
 * The dark shot shows Details dimmed behind a short sheet with two rows. The
 * sheet primitive itself lives in components/Shell.tsx, so this file is only
 * the two rows and where they go.
 *
 * Both rows land on the same place: the name step. That is the rule SPEC.md
 * sets out — Tangem allows several wallets, one mobile and many cards, and each
 * one is a separate identity, so each one claims its own name rather than
 * sharing the first wallet's. Adding a wallet without naming it is still
 * possible; it takes ticking *Continue without a name* on the step itself.
 *
 * The mobile row is disabled once a mobile wallet exists, because the footnote
 * on the screen behind ("You can only have one mobile wallet") is a real rule
 * of the app rather than a caption.
 */

import { Sheet } from '../components/Shell'
import { MobileWallet, TangemMark } from '../components/Icons'
import { useWallet, type Wallet } from '../store'

export interface AddWalletSheetProps {
  /** Defaults to the store's own `closeSheet`. */
  onClose?: () => void
}

export function AddWalletSheet({ onClose }: AddWalletSheetProps) {
  const w = useWallet()
  const close = onClose ?? w.closeSheet
  const hasMobile = w.wallets.some((wallet) => wallet.kind === 'mobile')

  /**
   * Create the wallet locally, then hand it to the name step. `purpose:
   * 'rename'` with an explicit walletId is what tells that screen it is naming
   * this particular wallet and should come back here rather than continuing
   * into onboarding.
   */
  const add = (kind: Wallet['kind']) => {
    const walletId = w.addWallet(kind)
    w.go({ name: 'nameWallet', purpose: 'rename', walletId })
  }

  return (
    <Sheet title="Add wallet" onClose={close}>
      <style>{CSS}</style>

      <div className="aw-list">
        <button className="aw-row" onClick={() => add('hardware')}>
          <span className="aw-chip">
            <TangemMark size={22} />
          </span>
          <span className="aw-stack">
            <span className="aw-title">Add hardware wallet</span>
            <span className="aw-sub">Scan a Tangem card to add it</span>
          </span>
        </button>

        <button className="aw-row" onClick={() => add('mobile')} disabled={hasMobile}>
          <span className="aw-chip">
            <MobileWallet size={22} />
          </span>
          <span className="aw-stack">
            <span className="aw-title">Add mobile wallet</span>
            <span className="aw-sub">
              {hasMobile
                ? 'You already have a mobile wallet on this device'
                : 'Create a new wallet on this device'}
            </span>
          </span>
        </button>
      </div>
    </Sheet>
  )
}

/* --------------------------------------------------------------------- css */

const CSS = `
.aw-list {
  display: flex;
  flex-direction: column;
  gap: 26px;
  padding: 12px 4px 24px;
}

.aw-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  text-align: left;
}
.aw-row:active { opacity: .65; }
.aw-row:disabled { opacity: .4; cursor: default; }

/* The dark shot draws a deep-blue disc with a bright blue glyph; the light
 * equivalent of that pair is the tinted circle from IMG_4298. */
.aw-chip {
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
}

.aw-stack {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.aw-title {
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}

.aw-sub {
  font-size: 13px;
  color: var(--text-3);
}
`
