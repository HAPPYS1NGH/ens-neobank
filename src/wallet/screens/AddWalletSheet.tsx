'use client'

/**
 * Add wallet — IMG_4308, recoloured to light.
 *
 * The dark shot shows Details dimmed behind a short sheet with two rows. The
 * sheet primitive itself lives in components/Shell.tsx, so this file is only
 * the two rows and where they go.
 *
 * Both rows create the wallet locally and land on Home. There is deliberately
 * no name step here: this demo runs one owner key for every wallet, so a
 * second claim would overwrite the same identity and read back wrong on
 * reload. Naming belongs to the first wallet's onboarding claim; later wallets
 * keep their local label.
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
   * Create the wallet locally and go straight Home — no name step. The claim
   * writes one owner's name, and a second wallet sharing that key cannot have
   * its own, so the step is only ever offered for the first wallet.
   */
  const add = (kind: Wallet['kind']) => {
    w.addWallet(kind)
    w.reset({ name: 'home' })
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
