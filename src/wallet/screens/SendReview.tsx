'use client'

/**
 * Send review — the confirmation step before the (simulated) broadcast.
 *
 * Tangem's review is a quiet list: what leaves, where it lands, what it costs.
 * This build has no screenshot for it, so it is assembled from the same parts
 * as the rest of the flow — the 24pt cards, the row shape from IMG_4298, the
 * two-tone amount treatment from IMG_4299.
 *
 * Two things this screen refuses to hide:
 *
 *  - The fee is a SIMULATED constant (see SIMULATED_FEE below), not a quote.
 *  - Nothing is broadcast. The confirm button spins for a beat because a
 *    wallet that confirms instantly feels fake, but the screen says on its
 *    face that the transfer is theatre — the only real thing in this flow was
 *    the name resolution on the previous screen.
 */

import { useState } from 'react'
import { CHAIN_BY_KEY, NETWORK_BY_ID, type ChainKey } from '@/lib/chains'
import { assetForNetwork, fiatValue } from '@/lib/assets'
import { coinAmount, shortAddress, usd } from '@/lib/format'
import { useWallet } from '../store'
import { NetworkMark } from '../components/CoinMark'
import { Back, Info } from '../components/Icons'

export interface SendReviewProps {
  networkId: string
  /** What the user addressed: a name, or a pasted address. */
  to: string
  /** The address the recipient field settled on. */
  resolved: string
  /** Raw amount string from the Send field, e.g. `0.5`. */
  amount: string
}

/**
 * SIMULATED network fees, in the chain's native ticker. Chosen to look like a
 * quiet afternoon on each network; nothing is fetched and nothing is quoted.
 * Chains missing from the map fall back to the ETH figure.
 */
const SIMULATED_FEE: Partial<Record<ChainKey, number>> = {
  btc: 0.00002,
  eth: 0.00021,
  arb: 0.0000041,
  base: 0.0000012,
  op: 0.0000034,
  linea: 0.0000089,
  scroll: 0.0000076,
  zksync: 0.000012,
  zora: 0.0000029,
  polygon: 0.012,
  bsc: 0.00021,
  avax: 0.0012,
  sol: 0.000005,
}

export function SendReview({ networkId, to, resolved, amount }: SendReviewProps) {
  const { back, go, addressForNetwork, walletTitle, parent } = useWallet()
  const [sending, setSending] = useState(false)

  const network = NETWORK_BY_ID[networkId]
  const asset = assetForNetwork(networkId)
  if (!network || !asset) return null

  const value = Number(amount) || 0
  const chain = network.chain
  const fee = SIMULATED_FEE[chain ?? 'eth'] ?? SIMULATED_FEE.eth!

  // A name is the subject here, so the address it resolves to is the footnote
  // (src/lib/format.ts keeps truncation for exactly this case). A pasted
  // address has nothing to be primary over it, so it reads in full.
  const recipientIsName = to.trim().toLowerCase() !== resolved.trim().toLowerCase()
  const primary = recipientIsName ? to : shortAddress(resolved, 10, 8)
  const secondary = recipientIsName ? shortAddress(resolved, 10, 8) : network.network

  // Where the name came from, said once: our registry or public ENS. A pasted
  // address has no provenance to show.
  const badge = !recipientIsName
    ? null
    : to.toLowerCase().endsWith(`.${parent}`)
      ? parent.toUpperCase()
      : 'ENS'

  function confirm() {
    if (sending) return
    // A beat of theatre, then the receipt screen. No request is made — there
    // is nothing to send it to.
    setSending(true)
    window.setTimeout(() => {
      go({ name: 'sendDone', networkId, to, amount: String(value) })
    }, 1200)
  }

  return (
    <div className="sr">
      <style>{CSS}</style>

      <header className="sr__bar">
        <button className="circle-btn" onClick={back} aria-label="Back" disabled={sending}>
          <Back size={22} />
        </button>
        <h1 className="sr__title">Review</h1>
        <span className="sr__nav-spacer" />
      </header>

      <div className="sr__body scroll">
        <div className="sr__hero">
          <p className="sr__hero-label">You send</p>
          <p className="sr__hero-amount">
            {coinAmount(value)}
            <span className="sr__hero-ticker"> {network.ticker}</span>
          </p>
          {/* SIMULATED — price from src/lib/assets.ts, not a market feed. */}
          <p className="sr__hero-fiat">≈ {usd(fiatValue(asset.id, value))}</p>
        </div>

        <div className="card">
          <div className="sr__row">
            <span className="sr__row-label">To</span>
            <span className="sr__row-value">
              <span className="sr__to">
                {recipientIsName && (
                  <span className="sr__avatar">{to.charAt(0).toUpperCase()}</span>
                )}
                <span className="sr__to-name">{primary}</span>
                {badge && <span className="pill--tag sr__badge">{badge}</span>}
              </span>
              <span className="row__sub sr__to-sub">{secondary}</span>
            </span>
          </div>
          <div className="sr__row">
            <span className="sr__row-label">From</span>
            <span className="sr__row-value">
              <span className="sr__to-name">{walletTitle}</span>
              <span className="row__sub sr__to-sub">
                {shortAddress(addressForNetwork(networkId), 10, 8)}
              </span>
            </span>
          </div>
          <div className="sr__row">
            <span className="sr__row-label">Network</span>
            <span className="sr__row-strong">{network.network}</span>
          </div>
          <div className="sr__row">
            <span className="sr__row-label">Network fee</span>
            <span className="sr__row-value">
              <span className="sr__to-name">
                {coinAmount(fee)} {network.ticker}
              </span>
              {/* SIMULATED */}
              <span className="row__sub sr__to-sub">≈ {usd(fiatValue(asset.id, fee))}</span>
            </span>
          </div>
          <div className="sr__row">
            <span className="sr__row-label">Total</span>
            <span className="sr__row-strong">
              {coinAmount(value + fee)} {network.ticker}
            </span>
          </div>
        </div>

        <div className="sr__note">
          <Info size={18} />
          <p>
            Simulated transfer. This demo does not broadcast a transaction or change any balance
            — the resolution behind it was real, the payment is not.
          </p>
        </div>
      </div>

      <div className="sr__foot">
        <button className="btn btn--primary" onClick={confirm} disabled={sending}>
          {sending ? <span className="sr__spinner" aria-hidden="true" /> : 'Confirm & send'}
        </button>
      </div>
    </div>
  )
}

const CSS = `
.sr {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.sr__bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px 4px;
  margin-top: 60px;
}

.sr__bar .circle-btn { background: var(--bg-elevated); }
.sr__nav-spacer { width: var(--sz-action); flex: none; }

.sr__title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: var(--fw-semibold);
}

.sr__body {
  flex: 1;
  min-height: 0;
  padding: 8px var(--pad-page) 8px;
}

.sr__hero {
  display: grid;
  justify-items: center;
  padding: 14px 0 22px;
}

.sr__hero-label {
  font-size: var(--fs-sub);
  color: var(--text-3);
}

.sr__hero-amount {
  margin-top: 6px;
  font-size: var(--fs-display);
  font-weight: var(--fw-bold);
  letter-spacing: -0.02em;
  line-height: var(--lh-tight);
  color: var(--text-1);
}

.sr__hero-ticker { color: var(--text-3); font-size: 24px; }

.sr__hero-fiat {
  margin-top: 4px;
  font-size: var(--fs-label);
  color: var(--text-3);
}

.sr__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 8px var(--pad-row);
}

.sr__row + .sr__row { box-shadow: inset 0 var(--divider-w) 0 var(--divider); }

.sr__row-label {
  flex: none;
  width: 92px;
  font-size: var(--fs-body);
  color: var(--text-3);
}

.sr__row-value {
  flex: 1;
  min-width: 0;
  display: grid;
  justify-items: end;
  text-align: right;
}

.sr__row-strong {
  flex: 1;
  text-align: right;
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}

.sr__to {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
}

.sr__avatar {
  width: 24px;
  height: 24px;
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-size: var(--fs-sub);
  font-weight: var(--fw-bold);
  flex: none;
}

.sr__to-name {
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sr__badge { flex: none; }

.sr__to-sub { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }

.sr__note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: var(--gap-group);
  padding: 12px 16px;
  border-radius: 20px;
  background: var(--bg-notice);
  color: var(--text-2);
  font-size: var(--fs-sub);
  line-height: var(--lh-body);
}

.sr__note svg { color: var(--accent); flex: none; margin-top: 1px; }

.sr__foot {
  flex: none;
  padding: 8px var(--pad-page) 46px;
}

.sr__spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: var(--text-on-dark);
  animation: sr-spin .7s linear infinite;
}

@keyframes sr-spin { to { transform: rotate(360deg) } }
`

export default SendReview