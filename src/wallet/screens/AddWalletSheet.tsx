'use client'

/**
 * Add wallet — IMG_4308, recoloured to light.
 *
 * The dark shot shows Details dimmed behind a short sheet with two rows. The
 * sheet primitive itself lives in components/Shell.tsx, so this file is only
 * the two rows and where they go.
 *
 * Both rows create the wallet locally and then walk into the name step, the
 * same one first-run onboarding uses. Every wallet derives from its own account
 * index (src/lib/keys.ts), so it is a separate owner and can hold a name of its
 * own — a second wallet is not a second label on the first one's identity.
 * Skipping is still one tick, and an unnamed wallet can be named later from
 * Home or Details → Wallets.
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
   * Create the wallet, then offer it the name step. Home is reset underneath
   * first so Back from the name step lands on the new wallet's Home rather
   * than on the Details screen this sheet was opened over.
   */
  const add = (kind: Wallet['kind']) => {
    const id = w.addWallet(kind)
    w.reset({ name: 'home' })
    w.go({ name: 'nameWallet', purpose: 'addWallet', walletId: id })
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
            <span className="aw-sub">Scan a Tangem card, then claim its name</span>
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
                : 'Create a new wallet on this device, then claim its name'}
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
