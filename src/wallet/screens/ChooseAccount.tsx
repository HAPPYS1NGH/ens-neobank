'use client'

/**
 * Choose account — `reference/screens/IMG_4301.PNG`.
 *
 * One white card listing the wallets, then a Cancel pill. Each row reads the
 * wallet's name (or its local label), a token count and a fiat total, exactly
 * as the shot's `Wallet · 2 tokens · $0.00` line does — split across two lines
 * in the app's row stack rather than one string.
 *
 * The substitution that matters: where a wallet has claimed its subname, the
 * row titles itself with the name, the same way Home does under the balance.
 *
 * One honesty note on the counts. The store derives token rows from the single
 * shared network list, so every row reports the same count and total; a wallet
 * with genuinely separate holdings would need per-wallet network sets, which
 * this build does not model.
 */

import { Sheet } from '../components/Shell'
import { Wallet as WalletIcon } from '../components/Icons'
import { useWallet } from '../store'
import { usd } from '../../lib/format'

export interface ChooseAccountProps {
  /** Defaults to the store's own `closeSheet`. */
  onClose?: () => void
}

export function ChooseAccount({ onClose }: ChooseAccountProps) {
  const w = useWallet()
  const close = onClose ?? w.closeSheet

  const summary = `${w.tokens.length} tokens · ${usd(w.total)}`

  return (
    <Sheet title="Choose account" onClose={close}>
      <style>{CSS}</style>

      <div className="ca-list">
        <div className="ca-card">
          {w.wallets.map((wallet) => {
            const active = wallet.id === w.wallet?.id
            return (
              <button
                key={wallet.id}
                className="ca-row"
                onClick={() => {
                  // Switching accounts here is instant — no confirm step in the
                  // shot, and the sheet closes either way.
                  if (!active) w.activateWallet(wallet.id)
                  close()
                }}
                aria-current={active ? 'true' : undefined}
              >
                <span className="ca-chip">
                  <WalletIcon size={21} />
                </span>
                <span className="ca-stack">
                  <span className="ca-title">{wallet.name?.fullName ?? wallet.label}</span>
                  <span className="ca-sub">{summary}</span>
                </span>
              </button>
            )
          })}
        </div>

        <button className="ca-cancel" onClick={close}>
          Cancel
        </button>
      </div>
    </Sheet>
  )
}

/* --------------------------------------------------------------------- css */
/* Prefixed `ca-`. Geometry off IMG_4301: row 63pt, chip 46, Cancel 44. */

const CSS = `
.ca-list {
  padding: 12px 4px 20px;
}

.ca-card {
  border-radius: var(--r-card);
  background: var(--bg-card);
  overflow: hidden;
}

.ca-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  height: var(--h-row);
  padding: 0 var(--pad-row);
  text-align: left;
}
.ca-row:active { background: var(--bg-subtle); }

.ca-chip {
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--bg-subtle);
  color: var(--icon-ink);
  display: grid;
  place-items: center;
}

.ca-stack {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ca-title {
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ca-sub {
  font-size: var(--fs-sub);
  color: var(--text-3);
}

.ca-cancel {
  margin-top: 16px;
  width: 100%;
  height: var(--h-field);
  border-radius: var(--r-field);
  background: var(--bg-dock);
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}
.ca-cancel:active { opacity: .7; }
`