'use client'

/**
 * Token detail — the screen sitting behind the scrim in IMG_4299.
 *
 * Faithful to the shot in what it shows and in what it does not: there is no
 * row of action circles under the balance. Sampling the scrimmed pixels, the
 * gap between "ETH 0.00" and the Quick top up card is ~50pt, which cannot hold
 * a 46pt circle and its label. The shot's "Buy" row is deliberately dropped —
 * buying is out of scope for this build — so the ways out of this screen are
 * the Receive and Transfer rows, in the same shape as the Buy row the shot
 * does show: leading tinted circle, title, subtitle, chevron. That row shape
 * is also exactly what the Transfer sheet uses (IMG_4298), so nothing new is
 * invented here.
 *
 * Everything monetary on this screen is simulated (src/lib/assets.ts). The
 * Quick top up chips are decoration and say so when tapped.
 */

import type { ReactNode } from 'react'
import { NETWORK_BY_ID } from '@/lib/chains'
import { assetForNetwork } from '@/lib/assets'
import { splitUsd, tokenAmount } from '@/lib/format'
import { useWallet } from '../store'
import { NetworkMark } from '../components/CoinMark'
import { Back, Bolt, ChevronRight, Ellipsis, ArrowDown, Swap } from '../components/Icons'

export interface TokenDetailProps {
  /** A network id from src/lib/chains.ts, e.g. `eth-main`. */
  networkId: string
}

/** SIMULATED. The four amounts Tangem offers on the top-up strip (IMG_4299). */
const TOP_UP = ['$50', '$200', '$700', 'Other'] as const

export function TokenDetail({ networkId }: TokenDetailProps) {
  const { back, openSheet, showToast } = useWallet()
  const network = NETWORK_BY_ID[networkId]
  const asset = assetForNetwork(networkId)
  if (!network || !asset) return null

  // Every balance in this build is zero — the demo seed is a real key and must
  // never be funded. The split exists because the reference draws the cents
  // smaller than the dollars.
  const balance = splitUsd(0)

  return (
    <div className="td">
      <style>{CSS}</style>

      <header className="td__bar">
        <button className="circle-btn td__nav" onClick={back} aria-label="Back">
          <Back size={22} />
        </button>
        <div className="td__heading">
          <h1 className="td__title">{asset.name}</h1>
          <p className="td__subtitle">
            {network.tag === 'MAIN' ? 'Main network' : network.network}
          </p>
        </div>
        <button
          className="circle-btn td__nav"
          onClick={() => showToast('Not part of this demo')}
          aria-label="More"
        >
          <Ellipsis size={22} />
        </button>
      </header>

      <div className="td__body scroll">
        <div className="td__hero">
          <NetworkMark networkId={networkId} size={50} label={asset.name} />
          <p className="td__label">Total balance</p>
          <p className="td__amount">
            {balance.whole}
            <span className="td__amount-frac">{balance.fraction}</span>
          </p>
          <p className="td__coin">{tokenAmount(0, network.ticker)}</p>
        </div>

        <section className="card td__topup">
          <div className="td__topup-head">
            <Bolt size={20} />
            <span>Quick top up</span>
          </div>
          <div className="td__chips">
            {TOP_UP.map((chip) => (
              <button
                key={chip}
                className="td__chip"
                onClick={() => showToast('Buying is not part of this demo')}
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        {/* The two rows the demo actually needs. Same shape as the Buy row in
            IMG_4299 and as the Transfer sheet's rows, because they are the
            same control — buying itself is out of scope for this build. */}
        <div className="card">
          <ActionRow
            icon={<ArrowDown size={20} />}
            title="Receive"
            sub="Share your name instead of an address"
            onClick={() => openSheet({ kind: 'receive', networkId })}
          />
          <ActionRow
            icon={<Swap size={20} />}
            title="Transfer"
            sub="Send, swap or sell"
            onClick={() => openSheet({ kind: 'transfer', networkId })}
          />
        </div>
      </div>
    </div>
  )
}

function ActionRow({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: ReactNode
  title: string
  sub: string
  onClick: () => void
}) {
  return (
    <button className="row td__row" onClick={onClick}>
      <span className="td__row-icon">{icon}</span>
      <span className="row__main td__row-main">
        <span className="row__title">{title}</span>
        <span className="row__sub">{sub}</span>
      </span>
      <ChevronRight size={20} className="td__chev" />
    </button>
  )
}

const CSS = `
.td {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.td__bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px 4px;
  margin-top: 60px;
}

.td__nav { background: var(--bg-elevated); }

.td__heading { flex: 1; min-width: 0; text-align: center; }

.td__title {
  font-size: 17px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  line-height: 1.2;
}

.td__subtitle {
  font-size: var(--fs-label);
  color: var(--text-3);
  line-height: 1.3;
}

.td__body {
  flex: 1;
  min-height: 0;
  padding: 0 var(--pad-page) 46px;
}

.td__hero {
  display: grid;
  justify-items: center;
  padding: 26px 0 22px;
}

.td__label {
  margin-top: 18px;
  font-size: var(--fs-body);
  color: var(--text-3);
}

.td__amount {
  margin-top: 2px;
  font-size: var(--fs-display);
  font-weight: var(--fw-bold);
  letter-spacing: -0.02em;
  line-height: var(--lh-tight);
  color: var(--text-1);
}

/* Same ink, smaller glyphs — the cents are never faded (docs/DESIGN.md). */
.td__amount-frac { font-size: 30px; }

.td__coin {
  margin-top: 6px;
  font-size: 16px;
  color: var(--text-3);
}

.td__topup { padding: 14px var(--pad-row) 16px; }

.td__topup-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}

.td__chips {
  display: flex;
  gap: 13px;
  margin-top: 14px;
}

.td__chip {
  height: 34px;
  padding: 0 18px;
  border-radius: var(--r-pill);
  background: var(--bg-subtle);
  color: var(--text-1);
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
}

.td__chip:active { opacity: .7; }

.td__row {
  width: 100%;
  min-height: 68px;
  text-align: left;
}

.td__row:active { background: var(--bg-page); }

.td__row-icon {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
}

.td__row-main { display: grid; }

.td__chev { color: var(--text-3); flex: none; }
`

export default TokenDetail
