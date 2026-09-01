'use client'

/**
 * Home — `reference/screens/IMG_4296.PNG` (two tokens) and `IMG_4306.PNG`
 * (three tokens, shot with the device frame). Measured in the 440 x 956 point
 * space `Shell.tsx` renders into, device px ÷ 3 per docs/DESIGN.md:
 *
 *   top bar          mark at (21, 74..95); scan / ellipsis centred at y 84
 *   balance          34/700 whole + 22/700 fraction, same ink, centred y ~190
 *   wallet label     14/600 --text-wash-2, y ~230, cloud glyph beside it
 *   action circles   46pt, centres x 152 / 220 / 288, top y 294
 *   promo card       x 12..428, y 399..512, inner button 36pt (not 46)
 *   token card       rows 63pt pitch, mark 39, no divider between rows
 *   Add & Manage     31pt pill, centred
 *   coach mark       white card with a downward tail over the dock grabber
 *   dock             white, rounded 32 at the top, search pill 44pt
 *
 * The header (mark, scan, ellipsis) and the dock are fixed; everything between
 * them scrolls, which is what makes the three-token shot and the two-token shot
 * the same component at different list lengths.
 *
 * The one substitution that is the point of the whole demo sits under the
 * balance: where Tangem prints its local label `Wallet ☁️`, this build prints
 * the claimed subname. An unnamed wallet still reads `Wallet` — with a small
 * prompt that walks into the name step, because a wallet without a name is the
 * one thing left to fix on this screen.
 */

import { useState } from 'react'
import { useWallet } from '../store'
import { splitUsd, percentChange, price, tokenAmount, usd } from '../../lib/format'
import { NetworkMark } from '../components/CoinMark'
import {
  ArrowDown,
  ArrowUp,
  Cloud,
  Ellipsis,
  Plus,
  Scan,
  Search,
  Sliders,
  Swap,
  type IconComponent,
} from '../components/Icons'

export interface HomeProps {
  /** Overrides for the header and action targets; default to store routing. */
  onScan?: () => void
  onSwap?: () => void
  onSearch?: () => void
}

export function Home({ onScan, onSwap, onSearch }: HomeProps) {
  const w = useWallet()
  const [coachVisible, setCoachVisible] = useState(true)

  const balance = splitUsd(w.total)

  /** Every action that has no screen in this build says so, rather than dying. */
  const notInDemo = (what: string) => () =>
    w.showToast(`${what} is outside this demo — names are the part that is real`)

  const scan = onScan ?? notInDemo('Scanning')
  const swap = onSwap ?? notInDemo('Swap')
  const search = onSearch ?? (() => w.openSheet({ kind: 'chooseToken', purpose: 'buy' }))

  // The Transfer sheet is per-asset; with nothing in the list there is no asset
  // to open it for, so the tap says so instead of dead-ending.
  const transfer = () => {
    const first = w.tokens[0]
    if (first) w.openSheet({ kind: 'transfer', networkId: first.networkId })
    else notInDemo('Transfer')()
  }

  return (
    <div className="hm">
      <style>{CSS}</style>

      {/* ------------------------------------------------------- top bar */}
      <header className="hm-top">
        <TangemMarkBrand />
        <div className="hm-top__actions">
          <button className="hm-top__btn" onClick={scan} aria-label="Scan">
            <Scan size={23} />
          </button>
          {/* The ellipsis is Tangem's way into Details; there is no menu sheet. */}
          <button
            className="hm-top__btn"
            onClick={() => w.go({ name: 'details' })}
            aria-label="Details"
          >
            <Ellipsis size={21} />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------- scrolling body */}
      <div className="hm-body scroll">
        <div className="hm-balance-block">
          <h1 className="balance">
            {balance.whole}
            <span className="balance__frac">{balance.fraction}</span>
          </h1>

          {w.isNamed ? (
            // The claim, standing exactly where the local label stood. Tapping
            // it is the way into the choose-account sheet (IMG_4301): the row
            // that sheet lists is this exact string, so the tap target reads
            // as "this wallet" rather than an extra control the shot lacks.
            <button
              className="wallet-name hm-name"
              title="This wallet's ENS name"
              onClick={() => w.openSheet({ kind: 'chooseAccount' })}
            >
              {w.walletTitle}
            </button>
          ) : (
            <>
              <div className="wallet-name hm-name">
                {w.walletTitle} <Cloud size={15} className="hm-cloud" />
              </div>
              <button
                className="hm-claim"
                onClick={() =>
                  w.go({ name: 'nameWallet', purpose: 'rename', walletId: w.wallet?.id })
                }
              >
                Tap to claim a {w.parent} name
              </button>
            </>
          )}
        </div>

        <div className="hm-actions">
          <ActionCircle Icon={ArrowDown} label="Add funds" onClick={search} />
          <ActionCircle Icon={Swap} label="Swap" onClick={swap} />
          <ActionCircle Icon={ArrowUp} label="Transfer" onClick={transfer} />
        </div>

        {/* -------------------------------------------------- promo card */}
        <div className="hm-promo page-pad">
          <div className="hm-promo__card">
            <div className="hm-promo__row">
              <div>
                <div className="hm-promo__title">Get your first crypto</div>
                <div className="hm-promo__sub">
                  Buy or receive crypto to start using your wallet.
                </div>
              </div>
              {/* Two overlapping coin marks, as in the shot's top-right corner. */}
              <div className="hm-promo__coins" aria-hidden="true">
                <span className="hm-promo__coin">₿</span>
                <span className="hm-promo__coin hm-promo__coin--back">₮</span>
              </div>
            </div>
            <button className="hm-promo__btn" onClick={search}>
              Add funds
            </button>
          </div>
        </div>

        {/* -------------------------------------------------- token list */}
        <div className="page-pad">
          <div className="card">
            {w.tokens.map((row) => {
              const change = percentChange(row.change24h)
              return (
                <button
                  key={row.networkId}
                  className="hm-token"
                  onClick={() => w.go({ name: 'tokenDetail', networkId: row.networkId })}
                >
                  <NetworkMark networkId={row.networkId} size={39} label={row.name} />
                  <span className="hm-token__main">
                    <span className="hm-token__name">{row.name}</span>
                    <span className="hm-token__quote">
                      {price(row.price)}
                      {change.direction !== 'flat' && (
                        <span className="delta" data-dir={change.direction}>
                          {' '}
                          <span className="hm-arrow">{change.direction === 'up' ? '▲' : '▼'}</span>{' '}
                          {change.text}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="hm-token__right">
                    <span className="hm-token__fiat">{usd(row.fiat)}</span>
                    <span className="hm-token__amount">{tokenAmount(row.balance, row.ticker)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* -------------------------------------------------- add & manage */}
        <div className="hm-manage">
          <button className="pill" onClick={() => w.openSheet({ kind: 'addManage' })}>
            <Sliders size={17} />
            Add &amp; Manage
          </button>
        </div>

        {/* -------------------------------------------------- coach mark */}
        {coachVisible && (
          <div className="page-pad">
            <div className="hm-coach">
              <span className="hm-coach__icon">
                <Plus size={16} />
              </span>
              <div className="hm-coach__main">
                <div className="hm-coach__title">Add tokens</div>
                <p className="hm-coach__body">
                  Pull this up or tap the search bar to add tokens directly from the market
                </p>
              </div>
              <button
                className="hm-coach__close"
                onClick={() => setCoachVisible(false)}
                aria-label="Dismiss"
              >
                ✕
              </button>
              <span className="hm-coach__tail" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------- the dock */}
      <footer className="hm-dock">
        <span className="hm-dock__grabber" aria-hidden="true" />
        <div className="hm-dock__card">
          <button className="hm-dock__search" onClick={search}>
            <Search size={17} />
            <span>Crypto, news and more</span>
          </button>
        </div>
      </footer>
    </div>
  )
}

/**
 * The header mark. `public/brand/tangem-mark.svg` carries the official media-kit
 * geometry with `fill: currentColor`, so its three paths are inlined here rather
 * than pulling in the simplified stand-in from Icons.tsx.
 */
function TangemMarkBrand() {
  return (
    <svg
      width={17}
      height={21}
      viewBox="0 0 104 130"
      fill="currentColor"
      role="img"
      aria-label="Tangem"
      className="hm-mark"
    >
      <path d="m79.35,0H24.65c-8.63,0-12.94,0-16.24,1.68-2.9,1.48-5.26,3.83-6.73,6.73-1.68,3.3-1.68,7.61-1.68,16.24v9.35h104v-9.35c0-8.63,0-12.94-1.68-16.24-1.48-2.9-3.83-5.26-6.73-6.73-3.3-1.68-7.61-1.68-16.24-1.68Z" />
      <path d="m69.33,62h34.67v43.35c0,8.63,0,12.94-1.68,16.24-1.48,2.9-3.83,5.26-6.73,6.73-3.3,1.68-7.61,1.68-16.24,1.68h-10.01V62Z" />
      <path d="m34.67,62H0v43.35c0,8.63,0,12.94,1.68,16.24,1.48,2.9,3.83,5.26,6.73,6.73,3.3,1.68,7.61,1.68,16.24,1.68h10.01V62Z" />
    </svg>
  )
}

function ActionCircle({
  Icon,
  label,
  onClick,
}: {
  Icon: IconComponent
  label: string
  onClick: () => void
}) {
  return (
    <div className="hm-action">
      <button className="circle-btn" onClick={onClick} aria-label={label}>
        <Icon size={21} />
      </button>
      <span className="hm-action__label">{label}</span>
    </div>
  )
}

/* --------------------------------------------------------------------- css */
/* Prefixed `hm-`. Tokens come from globals.css; nothing here invents a colour. */

const CSS = `
.hm {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--wash), var(--bg-page);
  color: var(--text-1);
}

/* Top bar ---------------------------------------------------------------- */

.hm-top {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 108px;
  padding: 0 28px;
  padding-top: 30px;
}

.hm-mark { color: var(--icon-ink); }

.hm-top__actions {
  display: flex;
  align-items: center;
  gap: 26px;
  margin-left: auto;
}

.hm-top__btn {
  color: var(--icon-ink);
  display: grid;
  place-items: center;
  padding: 2px;
}
.hm-top__btn:active { opacity: .6; }

/* Body ------------------------------------------------------------------- */

.hm-body {
  flex: 1;
  min-height: 0;
  /* The dock is fixed, so the last card needs clearance under it. */
  padding-bottom: 130px;
}

.hm-balance-block {
  margin-top: 68px;
  text-align: center;
}

.hm-name {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  /* A claimed name is longer than "Wallet"; let it ellipsize, never wrap. */
  max-width: 100%;
  padding: 0 24px;
  overflow: hidden;
  white-space: nowrap;
}
.hm-cloud { flex: none; opacity: .9; }

/* The fallback prompt for a wallet that skipped its name. Small, in the
 * accent, and the only thing on the screen that says a name is missing. */
.hm-claim {
  margin: 6px auto 0;
  display: block;
  font-size: 12px;
  font-weight: var(--fw-medium);
  color: var(--accent);
}
.hm-claim:active { opacity: .6; }

/* Actions ---------------------------------------------------------------- */

.hm-actions {
  margin-top: 56px;
  display: flex;
  justify-content: center;
  /* Centres at x 152 / 220 / 288 = 68pt apart on a 46pt circle. */
  gap: 22px;
}

.hm-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 68px;
}

.hm-action__label {
  font-size: var(--fs-label);
  font-weight: var(--fw-medium);
  color: var(--text-wash-1);
}

/* Promo card ------------------------------------------------------------- */
/* Its own shallow cool-to-warm wash, sampled in docs/DESIGN.md. */

.hm-promo { margin-top: 36px; }

.hm-promo__card {
  border-radius: var(--r-card);
  background: var(--promo-wash);
  padding: 14px 16px;
}

.hm-promo__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hm-promo__title {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}

.hm-promo__sub {
  margin-top: 3px;
  font-size: var(--fs-sub);
  color: var(--text-2);
}

.hm-promo__coins {
  flex: none;
  position: relative;
  width: 34px;
  height: 26px;
  margin-top: 2px;
}

.hm-promo__coin {
  position: absolute;
  right: 0;
  top: 0;
  width: 22px;
  height: 22px;
  border-radius: var(--r-icon);
  background: var(--text-1);
  color: #fff;
  font-size: 12px;
  font-weight: var(--fw-bold);
  line-height: 22px;
  text-align: center;
}

/* The back coin peeks out on the left, the way the shot stacks them. */
.hm-promo__coin--back {
  right: 12px;
  top: 4px;
  background: rgba(30, 30, 30, 0.72);
}

/* The shot's inner button is a translucent overlay on the wash, 36pt tall —
 * a quieter affordance than the app's 46pt primary buttons. */
.hm-promo__btn {
  margin-top: 13px;
  width: 100%;
  height: 36px;
  border-radius: var(--r-pill);
  background: rgba(0, 0, 0, 0.08);
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}
.hm-promo__btn:active { opacity: .7; }

/* Token list ------------------------------------------------------------- */

.hm-token {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: var(--h-row);
  padding: 0 var(--pad-row);
  text-align: left;
}
/* The shot shows no divider between rows — the whitespace alone separates. */
.hm-token:active { background: var(--bg-subtle); }

.hm-token__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hm-token__name {
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-token__quote {
  display: flex;
  align-items: center;
  font-size: var(--fs-sub);
  font-weight: var(--fw-medium);
  color: var(--text-3);
  white-space: nowrap;
}

.hm-arrow { font-size: 9px; }

.hm-token__right {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.hm-token__fiat {
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
  color: var(--text-1);
}

.hm-token__amount {
  font-size: var(--fs-sub);
  font-weight: var(--fw-medium);
  color: var(--text-3);
}

/* Add & Manage ----------------------------------------------------------- */

.hm-manage {
  margin-top: 14px;
  display: flex;
  justify-content: center;
}

/* Coach mark ------------------------------------------------------------- */

.hm-coach {
  position: relative;
  margin-top: 48px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 20px;
  background: var(--bg-card);
  box-shadow: var(--shadow-float);
}

/* The pointer over the dock's grabber, continuing the card's white. */
.hm-coach__tail {
  position: absolute;
  left: 50%;
  bottom: -7px;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  background: var(--bg-card);
  transform: rotate(45deg);
  border-radius: 2px;
}

.hm-coach__icon {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--r-icon);
  background: var(--accent);
  color: var(--accent-ink);
  display: grid;
  place-items: center;
}

.hm-coach__main { flex: 1; min-width: 0; }

.hm-coach__title {
  font-size: 15px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}

.hm-coach__body {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-2);
}

.hm-coach__close {
  flex: none;
  color: var(--text-3);
  font-size: 16px;
  line-height: 1;
  padding: 2px;
}
.hm-coach__close:active { opacity: .6; }

/* Dock ------------------------------------------------------------------- */

.hm-dock {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 0 16px 30px;
  pointer-events: none;
}

.hm-dock__grabber {
  display: block;
  width: 40px;
  height: 4px;
  margin: 0 auto 9px;
  border-radius: 2px;
  /* The shot's grabber is darker than the sheet one — rgba(30,30,30,.7). */
  background: var(--text-1);
  opacity: .7;
}

.hm-dock__card {
  pointer-events: auto;
  background: var(--bg-card);
  border-radius: 32px 32px 0 0;
  margin: 0 -16px;
  padding: 18px 16px 30px;
}

.hm-dock__search {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: var(--h-dock);
  border-radius: var(--r-field);
  background: var(--bg-dock);
  color: var(--text-3);
  font-size: 15px;
  font-weight: var(--fw-medium);
}
.hm-dock__search:active { opacity: .7; }
`