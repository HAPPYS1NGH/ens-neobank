'use client'

/**
 * Screen 3 — Name claimed. The receipt after a successful mint.
 *
 * Deliberately an achievement, not a celebration: there is no confetti, no
 * full-bleed colour, no animation beyond the check mark that was already part
 * of the language. The screen answers exactly two questions — what was claimed,
 * and what the name now does — and hands the user one way out.
 *
 * The "what it receives" list is read from the mint's response
 * (`ensName.addresses`), not from the networks the user happens to have on.
 * A name mints bare — no address records at all — and chains are added one at
 * a time afterwards, so the registry state is the honest thing to show;
 * deriving the list from local toggle state could promise an address the name
 * does not hold yet.
 */

import { Check, Copy, Plus } from '../components/Icons'
import { NetworkMark } from '../components/CoinMark'
import { shortAddress } from '@/lib/format'
import { brand } from '@config'
import { NETWORKS, type ChainKey, useWallet } from '../store'

/* ---------------------------------------------------------------- screen */

export interface NameClaimedProps {
  /**
   * The only way off the screen. Defaults to resetting to Home, which is where
   * both flows that get here (onboarding, Details → rename) want to land.
   */
  onContinue?: () => void
}

export function NameClaimed({ onContinue }: NameClaimedProps) {
  const w = useWallet()
  const name = w.ensName
  const fullName = name?.fullName ?? w.walletTitle

  /** Same pattern as the Receive sheet: clipboard, then a toast says it happened. */
  async function copyName() {
    try {
      await navigator.clipboard.writeText(fullName)
      w.showToast('Name copied')
    } catch {
      w.showToast('Could not copy')
    }
  }

  // One row per chain the name actually holds a record for, in CHAINS order.
  // Several networks can share a chain (Ethereum main and the USDT ERC20 row),
  // and they share one address record, so they share one row here too.
  const chains = Object.keys(name?.addresses ?? {}) as ChainKey[]
  const rows = chains
    .map((chain) => {
      const network = NETWORKS.find((n) => n.chain === chain)
      if (!network) return null
      return {
        chain,
        networkId: network.id,
        address: name?.addresses[chain] ?? '',
        rowName: network.rowName,
        tag: network.tag,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  return (
    <div className="tgc">
      <style>{NAME_CLAIMED_CSS}</style>

      <div className="tgc__body scroll">
        <span className="tgc__check">
          <Check size={24} />
        </span>

        <h1 className="title tgc__title">{brand.copy.claimedTitle}</h1>

        <p className="tgc__name">
          <span className="tgc__name-label">{fullName.split('.')[0]}</span>
          <span className="tgc__name-parent">.{w.parent}</span>
        </p>

        <p className="tgc__lede">
          {rows.length > 0 ? brand.copy.claimedLedeNamed : brand.copy.claimedLedeBare}
        </p>

        {rows.length > 0 ? (
          <section className="tgc__section">
            <h2 className="tgc__section-label">It receives on</h2>
            <div className="card">
              {rows.map((row) => (
                <div className="row tgc__row" key={row.chain}>
                  <NetworkMark networkId={row.networkId} size={39} label={row.rowName} />
                  <div className="row__main">
                    <p className="tgc__row-title">
                      {row.rowName}
                      <span className="pill--tag">{row.tag}</span>
                    </p>
                  </div>
                  <span className="tgc__addr">{shortAddress(row.address)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          // A bare mint holds no address records, so the receipt has one row
          // to show: the name itself, copyable, and the one next step — turn
          // networks on, which is what puts rows in the section above.
          <>
            <button className="pill pill--light tgc__copy" onClick={copyName}>
              <Copy size={20} />
              Copy name
            </button>
            <button
              className="tgc__next"
              onClick={() => w.openSheet({ kind: 'addNetwork' })}
            >
              <Plus size={16} />
              Add chain
            </button>
          </>
        )}
      </div>

      <div className="tgc__foot">
        <button className="btn btn--primary" onClick={onContinue ?? (() => w.reset({ name: 'home' }))}>
          {brand.copy.claimedCta}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- css */
/* Scoped `tgc-` — no collisions with globals.css or the other screen sets. */

const NAME_CLAIMED_CSS = `
.tgc {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  padding: 60px 0 34px;
}

.tgc__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 var(--pad-page);
}

/* The same 46pt accent-soft circle the app puts behind the Send arrow. */
.tgc__check {
  margin-top: 96px;
  width: var(--sz-action);
  height: var(--sz-action);
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
}

.tgc__title {
  margin-top: 24px;
  text-align: center;
  color: var(--text-1);
}

/* The name is the achievement, so it gets the biggest type on the screen after
   the title — split at the dot so the parent reads as what it is, a suffix the
   user did not have to type. */
.tgc__name {
  margin-top: 14px;
  font-size: var(--fs-heading);
  font-weight: var(--fw-bold);
  letter-spacing: -0.01em;
  text-align: center;
  word-break: break-all;
}

.tgc__name-label { color: var(--text-1); }
.tgc__name-parent { color: var(--text-3); }

.tgc__lede {
  margin-top: 10px;
  max-width: 320px;
  text-align: center;
  font-size: var(--fs-sub);
  color: var(--text-2);
  line-height: var(--lh-body);
}

.tgc__section {
  align-self: stretch;
  margin-top: 30px;
}

.tgc__section-label {
  margin: 0 4px 8px;
  font-size: var(--fs-sub);
  font-weight: var(--fw-semibold);
  color: var(--text-3);
}

.tgc__row { height: var(--h-row); }

.tgc__row-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
  color: var(--text-1);
}

.tgc__addr {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  text-align: right;
}

/* The empty state. The Copy pill is the Receive sheet's, sized the same
 * (44pt, 22px sides); the next step is the app's quiet accent line, the way
 * the Receive sheet points at "Add network" — nothing new is invented. */
.tgc__copy {
  margin-top: 30px;
  height: 44px;
  padding: 0 22px;
  font-size: 16px;
  font-weight: var(--fw-medium);
}
.tgc__copy:active { opacity: .7; }

.tgc__next {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--accent);
}
.tgc__next:active { opacity: .7; }

.tgc__foot {
  flex: none;
  padding: 0 var(--pad-onboard);
  display: flex;
  flex-direction: column;
  gap: var(--gap-row);
}
`

export default NameClaimed