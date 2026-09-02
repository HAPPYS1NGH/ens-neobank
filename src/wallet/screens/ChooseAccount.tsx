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
 * Counts are per wallet: each one carries its own network list, so a wallet
 * that has turned nothing on reports no tokens while the one beside it reports
 * three. Totals are all $0.00 because balances are simulated (src/lib/assets.ts),
 * not because the rows share a list.
 *
 * A wallet with no name says so on its own row and the row offers the claim,
 * because switching accounts is the moment someone notices the wallet they
 * skipped naming.
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

  return (
    <Sheet title="Choose account" onClose={close}>
      <style>{CSS}</style>

      <div className="ca-list">
        <div className="ca-card">
          {w.wallets.map((wallet) => {
            const active = wallet.id === w.wallet?.id
            const count = wallet.enabledNetworkIds.length
            return (
              <div className="ca-item" key={wallet.id}>
                <button
                  className="ca-row"
                  onClick={() => {
                    // Switching accounts here is instant — no confirm step in
                    // the shot, and the sheet closes either way.
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
                    <span className="ca-sub">
                      {count === 1 ? '1 token' : `${count} tokens`} &middot; {usd(0)}
                      {wallet.name === null && <span className="ca-flag"> &middot; no name yet</span>}
                    </span>
                  </span>
                </button>

                {/* The way back into the step this wallet skipped. Switching
                 * first so the claim, and the screen behind it, are this
                 * wallet's. */}
                {wallet.name === null && (
                  <button
                    className="ca-claim"
                    onClick={() => {
                      if (!active) w.activateWallet(wallet.id)
                      close()
                      w.go({ name: 'nameWallet', purpose: 'rename', walletId: wallet.id })
                    }}
                  >
                    Get a name
                  </button>
                )}
              </div>
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

.ca-item {
  display: flex;
  align-items: center;
  padding-right: 12px;
}
.ca-item + .ca-item { box-shadow: inset 0 var(--divider-w) 0 var(--divider); }

.ca-row {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
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

.ca-flag { color: var(--danger); }

/* The claim, sized as a quiet pill so it reads as an offer on the row rather
 * than a second way to switch accounts. */
.ca-claim {
  flex: none;
  height: 32px;
  padding: 0 14px;
  border-radius: var(--r-pill, 999px);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 13px;
  font-weight: var(--fw-semibold);
  white-space: nowrap;
}
.ca-claim:active { opacity: .7; }

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