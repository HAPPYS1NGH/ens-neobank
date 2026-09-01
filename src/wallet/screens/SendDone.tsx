'use client'

/**
 * Send done — the receipt.
 *
 * A check, what left, where it went, and the one line this demo owes the user:
 * nothing moved. The send was simulated on the review screen and this screen
 * does not quietly upgrade it into a success story — the status row says
 * "Simulated" in the same list as the real facts around it, because a demo
 * that looks exactly like a sent payment is indistinguishable from one.
 *
 * No screenshot exists for it; it borrows the confirmation posture of the
 * Name claimed screen (a centred mark, a short title, one line of detail) and
 * the row list of the review screen it follows.
 */

import { NETWORK_BY_ID } from '@/lib/chains'
import { assetForNetwork } from '@/lib/assets'
import { coinAmount } from '@/lib/format'
import { useWallet } from '../store'
import { NetworkMark } from '../components/CoinMark'
import { Check } from '../components/Icons'

export interface SendDoneProps {
  networkId: string
  /** The recipient as addressed — a name when one was used. */
  to: string
  /** Raw amount string carried over from the review, e.g. `0.5`. */
  amount: string
}

export function SendDone({ networkId, to, amount }: SendDoneProps) {
  const { reset } = useWallet()

  const network = NETWORK_BY_ID[networkId]
  const asset = assetForNetwork(networkId)
  if (!network || !asset) return null

  const value = Number(amount) || 0

  return (
    <div className="sd">
      <style>{CSS}</style>

      <div className="sd__body scroll">
        <div className="sd__hero">
          <span className="sd__check">
            <Check size={30} />
          </span>
          <h1 className="sd__title">Sent</h1>
          <p className="sd__sub">
            {coinAmount(value)} {network.ticker} to {to}
          </p>
        </div>

        <div className="card">
          <div className="sd__row">
            <span className="sd__row-label">Recipient</span>
            <span className="sd__row-value">{to}</span>
          </div>
          <div className="sd__row">
            <span className="sd__row-label">Network</span>
            <span className="sd__row-value sd__row-value--muted">
              <NetworkMark networkId={networkId} size={22} label={network.network} />
              {network.network}
            </span>
          </div>
          <div className="sd__row">
            <span className="sd__row-label">Status</span>
            <span className="sd__row-value">Simulated — not broadcast</span>
          </div>
        </div>

        <p className="sd__note">
          No transaction was signed and no balance changed. If this were a live wallet,{' '}
          {to.includes('.') ? 'this name' : 'this address'} would now be waiting for the network
          to confirm it.
        </p>
      </div>

      <div className="sd__foot">
        <button className="btn btn--primary" onClick={() => reset({ name: 'home' })}>
          Done
        </button>
      </div>
    </div>
  )
}

const CSS = `
.sd {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.sd__body {
  flex: 1;
  min-height: 0;
  padding: 90px var(--pad-page) 8px;
}

.sd__hero {
  display: grid;
  justify-items: center;
  text-align: center;
  padding-bottom: 26px;
}

.sd__check {
  width: 64px;
  height: 64px;
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
}

.sd__title {
  margin-top: 18px;
  font-size: var(--fs-title);
  font-weight: var(--fw-bold);
  letter-spacing: -0.01em;
}

.sd__sub {
  margin-top: 6px;
  font-size: var(--fs-label);
  color: var(--text-2);
  max-width: 300px;
  overflow-wrap: anywhere;
}

.sd__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 8px var(--pad-row);
}

.sd__row + .sd__row { box-shadow: inset 0 var(--divider-w) 0 var(--divider); }

.sd__row-label {
  flex: none;
  width: 92px;
  font-size: var(--fs-body);
  color: var(--text-3);
}

.sd__row-value {
  flex: 1;
  min-width: 0;
  text-align: right;
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
  color: var(--text-1);
  overflow-wrap: anywhere;
}

.sd__row-value--muted {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.sd__note {
  margin-top: var(--gap-group);
  padding: 0 6px;
  font-size: var(--fs-sub);
  color: var(--text-3);
  line-height: var(--lh-body);
  text-align: center;
}

.sd__foot {
  flex: none;
  padding: 8px var(--pad-page) 46px;
}
`

export default SendDone