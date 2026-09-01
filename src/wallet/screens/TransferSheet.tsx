'use client'

/**
 * The Transfer sheet — IMG_4298.
 *
 * A near-full-height sheet: the asset's mark and balance sit near the top, a
 * large empty middle, and four rows anchored to the bottom. Each row is its own
 * white card with a 12pt gap between them rather than one grouped card with
 * dividers, which is why they are separate `.card`s here.
 *
 * Only "Send" leads anywhere. Swap, Swap & Send and Sell are real rows in the
 * real app and are kept so the sheet is the sheet, but this build does not move
 * funds, so they say so rather than pretending.
 */

import type { ReactNode } from 'react'
import { NETWORK_BY_ID } from '@/lib/chains'
import { assetForNetwork } from '@/lib/assets'
import { tokenAmount, usd } from '@/lib/format'
import { useWallet } from '../store'
import { Sheet } from '../components/Shell'
import { NetworkMark } from '../components/CoinMark'
import { ArrowUp, ChevronRight, Swap } from '../components/Icons'

export interface TransferSheetProps {
  networkId: string
}

export function TransferSheet({ networkId }: TransferSheetProps) {
  const { closeSheet, go, showToast } = useWallet()
  const network = NETWORK_BY_ID[networkId]
  const asset = assetForNetwork(networkId)
  if (!network || !asset) return null

  const soon = (what: string) => () => showToast(`${what} is not part of this demo`)

  return (
    <Sheet title="Transfer" onClose={closeSheet} full>
      <style>{CSS}</style>

      <div className="tf">
        <div className="tf__hero">
          <NetworkMark networkId={networkId} size={50} label={asset.name} />
          {/* SIMULATED — every balance in this build is zero. */}
          <p className="tf__amount">{usd(0)}</p>
          <p className="tf__coin">{tokenAmount(0, network.ticker)}</p>
        </div>

        <div className="tf__rows">
          <Row
            icon={<ArrowUp size={20} />}
            title="Send"
            sub="Transfer crypto to another wallet"
            onClick={() => go({ name: 'send', networkId })}
          />
          <Row
            icon={<Swap size={20} />}
            title="Swap"
            sub="Exchange one crypto for another"
            onClick={soon('Swapping')}
          />
          <Row
            icon={<Swap size={20} />}
            title="Swap & Send"
            sub="Exchange and send in one step"
            onClick={soon('Swapping')}
          />
          <Row
            icon={<span className="tf__glyph">$</span>}
            title="Sell"
            sub="Convert crypto to fiat currency"
            onClick={soon('Selling')}
          />
        </div>
      </div>
    </Sheet>
  )
}

function Row({
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
    <button className="card row tf__row" onClick={onClick}>
      <span className="tf__icon">{icon}</span>
      <span className="row__main tf__main">
        <span className="row__title">{title}</span>
        <span className="row__sub">{sub}</span>
      </span>
      <ChevronRight size={20} className="tf__chev" />
    </button>
  )
}

const CSS = `
.tf {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.tf__hero {
  display: grid;
  justify-items: center;
  padding: 40px 0 0;
}

.tf__amount {
  margin-top: 20px;
  font-size: var(--fs-display);
  font-weight: var(--fw-bold);
  letter-spacing: -0.02em;
  line-height: var(--lh-tight);
  color: var(--text-1);
}

.tf__coin {
  margin-top: 6px;
  font-size: 16px;
  color: var(--text-3);
}

/* The rows hang off the bottom of the sheet, not off the balance. */
.tf__rows {
  margin-top: auto;
  padding-top: 40px;
  display: grid;
  gap: var(--gap-group);
}

.tf__row {
  width: 100%;
  min-height: 72px;
  text-align: left;
  border-radius: var(--r-card);
}

.tf__row:active { opacity: .75; }

/* .card sets a top margin on a sibling card; the grid gap already spaces these. */
.tf__row + .tf__row { margin-top: 0; }

.tf__icon {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
}

.tf__glyph {
  font-size: 18px;
  font-weight: var(--fw-semibold);
  line-height: 1;
}

.tf__main { display: grid; }

.tf__chev { color: var(--text-3); flex: none; }
`

export default TransferSheet
