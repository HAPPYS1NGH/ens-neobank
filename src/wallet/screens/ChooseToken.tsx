'use client'

/**
 * Choose token — IMG_4297.
 *
 * The token picker the Receive and Send flows share. The reference shot is the
 * Buy flow, and this build keeps that mode (with its Regional Restriction card)
 * for when buying lands — but nothing routes to it today: every entry point
 * opens this sheet in receive mode, and a sell restriction under a Receive or
 * Send flow would read as a bug.
 *
 * Rows are coin-level, not network-level: the home list splits Ethereum and
 * Base into separate rows, but this picker names coins (Bitcoin, Ethereum)
 * because what is being chosen is what to act in. A coin's tap lands on its
 * MAIN network, falling back to its first enabled one.
 *
 * The search field is pinned to the sheet's bottom edge (it floats over the
 * page in IMG_4297) and searching widens past the portfolio: once the user
 * types, every network in the registry that matches is offered, because Send
 * and Receive legitimately target chains the wallet has not enabled yet.
 */

import { useMemo, useState } from 'react'
import { Sheet } from '../components/Shell'
import { CoinMark, NetworkMark } from '../components/CoinMark'
import { Search, Warning } from '../components/Icons'
import { useWallet } from '../store'
import { NETWORKS, type CoinId } from '@/lib/chains'
import { usd, tokenAmount } from '@/lib/format'

export interface ChooseTokenProps {
  /** Falls back to whatever purpose the sheet was opened with. */
  purpose?: 'buy' | 'receive' | 'send'
  /** Defaults to the store's own `closeSheet`. */
  onClose?: () => void
}

interface PortfolioCoin {
  coinId: CoinId
  name: string
  ticker: string
  /** SIMULATED — always 0 in this build. */
  fiat: number
  balance: number
  /** The network a tap acts on: the coin's MAIN chain, else its first. */
  networkId: string
}

export function ChooseToken({ purpose, onClose }: ChooseTokenProps) {
  const w = useWallet()
  const close = onClose ?? w.closeSheet
  // Nothing opens this sheet in buy mode any more, so a stray render falls
  // back to receive rather than to the buy fiction.
  const mode = purpose ?? (w.sheet.kind === 'chooseToken' ? w.sheet.purpose : 'receive')
  const [query, setQuery] = useState('')

  /**
   * The portfolio is network rows; the picker shows coins. Grouping by coin
   * keeps the row set identical to IMG_4297 (Bitcoin, Ethereum — one row each)
   * and gives every coin a stable tap target even when it spans networks.
   */
  const portfolio = useMemo(() => {
    const byCoin = new Map<CoinId, PortfolioCoin>()
    for (const row of w.tokens) {
      const coinId = row.network.coinId
      const existing = byCoin.get(coinId)
      if (existing) {
        existing.fiat += row.fiat
        existing.balance += row.balance
        continue
      }
      const main = w.tokens.find(
        (r) => r.network.coinId === coinId && r.network.tag === 'MAIN',
      )
      byCoin.set(coinId, {
        coinId,
        name: row.asset.name,
        ticker: row.asset.ticker,
        fiat: row.fiat,
        balance: row.balance,
        networkId: (main ?? row).networkId,
      })
    }
    return [...byCoin.values()]
  }, [w.tokens])

  /* Chains outside the portfolio, surfaced only while searching. */
  const q = query.trim().toLowerCase()
  const otherNetworks = useMemo(() => {
    if (!q) return []
    const portfolioCoins = new Set(portfolio.map((c) => c.coinId))
    return NETWORKS.filter(
      (n) =>
        !portfolioCoins.has(n.coinId) &&
        (n.title.toLowerCase().includes(q) ||
          n.network.toLowerCase().includes(q) ||
          n.rowName.toLowerCase().includes(q) ||
          n.ticker.toLowerCase().includes(q)),
    )
  }, [q, portfolio])

  /** Where a tap goes, per purpose. Buy stays inside the demo's fiction. */
  const choose = (networkId: string) => {
    if (mode === 'receive') {
      w.openSheet({ kind: 'receive', networkId })
    } else if (mode === 'send') {
      w.openSheet({ kind: 'transfer', networkId })
    } else {
      w.showToast('Unavailable in your region')
    }
  }

  return (
    <Sheet
      title="Choose token"
      onClose={close}
      footer={
        <div className="field field--plain ct-search">
          <Search size={19} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search tokens"
          />
        </div>
      }
    >
      <style>{CSS}</style>

      {/* IMG_4297's yellow-triangle card. Verbatim copy from the screenshot. */}
      {mode === 'buy' && (
        <div className="card ct-notice">
          <span className="ct-notice__icon">
            <Warning size={26} />
          </span>
          <span className="ct-notice__stack">
            <span className="ct-notice__title">Regional Restriction</span>
            <span className="ct-notice__body">
              Selling cryptocurrency is unavailable in your region at the moment. We’re
              actively working to bring this option to you soon—stay tuned!
            </span>
          </span>
        </div>
      )}

      <h2 className="heading ct-heading">In your portfolio</h2>

      {portfolio.length > 0 ? (
        <div className="card">
          {portfolio.map((coin) => (
            <button key={coin.coinId} className="ct-row" onClick={() => choose(coin.networkId)}>
              <CoinMark coinId={coin.coinId} size={39} label={coin.name} />
              <span className="ct-row__stack">
                <span className="ct-row__name">{coin.name}</span>
                <span className="ct-row__sub">{coin.ticker}</span>
              </span>
              <span className="ct-row__values">
                <span className="ct-row__fiat">{usd(coin.fiat)}</span>
                <span className="ct-row__amount">{tokenAmount(coin.balance, coin.ticker)}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="card">
          <p className="ct-empty">Nothing here yet — add tokens from Manage tokens.</p>
        </div>
      )}

      {otherNetworks.length > 0 && (
        <>
          <h2 className="heading ct-heading">All tokens</h2>
          <div className="card">
            {otherNetworks.map((network) => (
              <button key={network.id} className="ct-row" onClick={() => choose(network.id)}>
                <NetworkMark networkId={network.id} size={39} disc label={network.title} />
                <span className="ct-row__stack">
                  <span className="ct-row__name">{network.rowName}</span>
                  <span className="ct-row__sub">
                    {network.network} · {network.ticker}
                  </span>
                </span>
                <span className="ct-row__values">
                  <span className="ct-row__fiat">$0.00</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {q.length > 0 && otherNetworks.length === 0 && portfolio.length === 0 && (
        <p className="ct-empty ct-empty--loose">No tokens match “{query}”</p>
      )}
    </Sheet>
  )
}

/* --------------------------------------------------------------------- css */

const CSS = `
.ct-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-top: 4px;
}

.ct-notice__icon {
  flex: none;
  color: var(--warning);
  margin-top: 12px;
}

.ct-notice__title {
  display: block;
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}

.ct-notice__body {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--text-2);
}

.ct-heading { margin: 22px 4px 12px; }

.ct-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: var(--h-row);
  padding: 0 var(--pad-row);
  text-align: left;
}
.ct-row:active { opacity: .65; }

.ct-row__stack { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

.ct-row__name {
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
  color: var(--text-1);
}

.ct-row__sub {
  font-size: var(--fs-sub);
  color: var(--text-3);
}

.ct-row__values {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.ct-row__fiat {
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
  color: var(--text-1);
}

/* Tangem prints the ticker first: "BTC 0.00" (IMG_4297, right column). */
.ct-row__amount {
  font-size: var(--fs-sub);
  font-weight: var(--fw-medium);
  color: var(--text-3);
}

.ct-empty {
  padding: 22px 16px;
  font-size: var(--fs-sub);
  color: var(--text-3);
  text-align: center;
}

.ct-empty--loose { background: none; }

/* The pinned field floats over the sheet bottom like IMG_4297's, so the
 * footer chrome behind it stays the sheet's own grey. */
.ct-search { margin: 0 -6px; }
`