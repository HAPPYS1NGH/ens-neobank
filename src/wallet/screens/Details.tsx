'use client'

/**
 * Details — IMG_4307, recoloured to light.
 *
 * The screenshot was taken at night with iOS auto-dark on, so it is this screen
 * in the other theme, not another design. Structure, row heights and group gaps
 * are carried over pixel for pixel; only the palette moves to the tokens in
 * globals.css. Measurements (device px ÷ 3, per docs/DESIGN.md):
 *
 *   back button centre      (42, 84)      42px circle
 *   page padding            16            cards run x 16..424 of 440
 *   icon row height         64            WalletConnect / Address book
 *   plain row height        46            Buy Tangem Wallet, App settings, support
 *   gap between groups      24            541 -> 594 displayed, twice over
 *   social glyph            22            two rows: six, then three
 *
 * The one change from the real app is the wallet row's title: where the wallet
 * has claimed a name it reads `harpreet.tange.eth` instead of the local string
 * `Wallet`, which is the same substitution Home makes under the balance. The
 * red badge is Tangem's "needs attention" dot; here it means the wallet has no
 * name yet, which is the only outstanding thing this build can tell you about.
 */

import { useWallet } from '../store'
import {
  AddressBook as AddressBookIcon,
  ChevronRight,
  Plus,
  SOCIALS,
  Wallet as WalletIcon,
  WalletConnect,
} from '../components/Icons'

export interface DetailsProps {
  /** App version, exactly as the footer prints it. */
  version?: string
}

export function Details({ version = 'Tangem 6.2 (2211)' }: DetailsProps) {
  const w = useWallet()

  /** Nothing behind these rows in this build; say so rather than dead-ending. */
  const notInDemo = (what: string) => () =>
    w.showToast(`${what} is outside this demo — names are the part that is real`)

  return (
    <div className="dt">
      <style>{CSS}</style>

      <header className="dt-head">
        <button className="dt-back" onClick={w.back} aria-label="Back">
          <ChevronRight size={22} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 className="dt-title">Details</h1>
      </header>

      <div className="dt-body scroll">
        {/* ------------------------------------------- connect + address book */}
        <div className="dt-card">
          <button className="dt-row" onClick={notInDemo('WalletConnect')}>
            <span className="dt-chip dt-chip--wc">
              <WalletConnect size={22} />
            </span>
            <span className="dt-stack">
              <span className="dt-row-title">WalletConnect</span>
              <span className="dt-row-sub">Connect to dApps</span>
            </span>
            <ChevronRight size={20} className="dt-chevron" />
          </button>

          <button className="dt-row" onClick={() => w.go({ name: 'addressBook' })}>
            <span className="dt-chip dt-chip--tint">
              <AddressBookIcon size={21} />
            </span>
            <span className="dt-stack">
              <span className="dt-row-title">Address book</span>
              <span className="dt-row-sub">Manage contacts &amp; addresses</span>
            </span>
            <ChevronRight size={20} className="dt-chevron" />
          </button>
        </div>

        {/* --------------------------------------------------------- wallets */}
        <div className="dt-card dt-card--wallets">
          <div className="dt-group-head">Wallets</div>

          {w.wallets.map((wallet) => {
            const named = wallet.name !== null
            return (
              <button
                key={wallet.id}
                className="dt-row dt-row--wallet"
                onClick={() => w.go({ name: 'walletDetail', walletId: wallet.id })}
              >
                <span className="dt-chip dt-chip--grey">
                  <WalletIcon size={21} />
                </span>
                <span className="dt-stack">
                  {/* The claim, shown where Tangem shows its local label. */}
                  <span className="dt-row-title dt-row-title--name">
                    {wallet.name?.fullName ?? wallet.label}
                  </span>
                  <span className="dt-row-sub">
                    {wallet.kind === 'mobile' ? 'Mobile Wallet' : 'Hardware Wallet'} &middot; $0.00
                  </span>
                </span>
                {!named && (
                  <span className="dt-badge" title="This wallet has no name yet">
                    !
                  </span>
                )}
                <ChevronRight size={20} className="dt-chevron" />
              </button>
            )
          })}

          <button className="dt-row" onClick={() => w.openSheet({ kind: 'addWallet' })}>
            <span className="dt-chip dt-chip--tint">
              <Plus size={22} />
            </span>
            <span className="dt-row-title dt-row-title--accent">Add Wallet</span>
          </button>

          <p className="dt-foot">
            You can only have one mobile wallet. Upgrade it to Tangem hardware wallet, or add a new
            hardware wallet. Each wallet is its own identity, so each one claims its own name.
          </p>
        </div>

        {/* ------------------------------------------------------------- buy */}
        <div className="dt-card">
          <button className="dt-row dt-row--plain" onClick={notInDemo('The Tangem shop')}>
            <span className="dt-row-title dt-row-title--accent">Buy Tangem Wallet</span>
          </button>
        </div>

        <div className="dt-card">
          <button className="dt-row dt-row--plain" onClick={notInDemo('App settings')}>
            <span className="dt-row-title">App settings</span>
            <ChevronRight size={20} className="dt-chevron" />
          </button>
        </div>

        <div className="dt-card">
          <button className="dt-row dt-row--plain" onClick={notInDemo('Support')}>
            <span className="dt-row-title">Contact support</span>
            <ChevronRight size={20} className="dt-chevron" />
          </button>
          <button className="dt-row dt-row--plain" onClick={notInDemo('The terms of service')}>
            <span className="dt-row-title">Terms of service</span>
            <ChevronRight size={20} className="dt-chevron" />
          </button>
        </div>

        {/* --------------------------------------------------------- socials */}
        {/* Six on the first line, three on the second — IMG_4307's own break. */}
        <div className="dt-socials">
          <div className="dt-social-row">
            {SOCIALS.slice(0, 6).map(({ name, Icon, href }) => (
              <a key={name} href={href} target="_blank" rel="noreferrer" aria-label={name}>
                <Icon size={22} />
              </a>
            ))}
          </div>
          <div className="dt-social-row">
            {SOCIALS.slice(6).map(({ name, Icon, href }) => (
              <a key={name} href={href} target="_blank" rel="noreferrer" aria-label={name}>
                <Icon size={22} />
              </a>
            ))}
          </div>
        </div>

        <p className="dt-version">{version}</p>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- css */
/* Prefixed `dt-` so it cannot collide with another screen agent's rules.
 * globals.css belongs to someone else; everything here builds on its tokens. */

const CSS = `
.dt {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.dt-head {
  flex: none;
  position: relative;
  height: 108px;
  display: flex;
  align-items: flex-end;
  padding: 0 16px 18px;
}

/* 42px circle, centred at (42, 84) in IMG_4307. */
.dt-back {
  width: 42px;
  height: 42px;
  border-radius: var(--r-icon);
  background: var(--bg-elevated);
  color: var(--icon-ink);
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-float);
}
.dt-back:active { opacity: .7; }

.dt-title {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 20px;
  text-align: center;
  font-size: 22px;
  font-weight: var(--fw-bold);
  letter-spacing: -.01em;
  pointer-events: none;
}

.dt-body {
  flex: 1;
  min-height: 0;
  padding: 0 16px 48px;
}

.dt-card {
  background: var(--bg-card);
  border-radius: var(--r-card);
  overflow: hidden;
}
/* Groups in IMG_4307 are 24 apart, twice the gap inside the Home stack. */
.dt-card + .dt-card { margin-top: 24px; }
.dt-card--wallets { padding-bottom: 4px; }

.dt-group-head {
  padding: 18px 20px 6px;
  font-size: 15px;
  color: var(--text-3);
}

.dt-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 64px;
  padding: 10px 18px;
  text-align: left;
  background: none;
}
.dt-row:active { background: var(--bg-subtle); }

/* Rows with no leading chip are shorter — 46px, sampled off App settings. */
.dt-row--plain { min-height: 46px; }

/* The divider runs from the text column, not the card edge (IMG_4307 y=576). */
.dt-row + .dt-row {
  box-shadow: inset 0 var(--divider-w) 0 var(--divider);
}
.dt-card--wallets .dt-row + .dt-row { box-shadow: none; }

.dt-chip {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: grid;
  place-items: center;
}
.dt-chip--wc { background: var(--accent); color: #fff; }
.dt-chip--tint { background: var(--accent-soft); color: var(--accent); }
.dt-chip--grey { background: var(--bg-subtle); color: var(--icon-ink); }

.dt-stack {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dt-row-title {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dt-row-title--accent { color: var(--accent); }
/* A claimed name is longer than "Wallet" ever was; let it use the row. */
.dt-row-title--name { letter-spacing: -.01em; }

.dt-row-sub {
  font-size: 13px;
  color: var(--text-3);
}

.dt-chevron { flex: none; color: var(--text-3); }

/* Tangem's attention dot. Here it marks a wallet that has not been named. */
.dt-badge {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: var(--r-icon);
  background: var(--danger);
  color: #fff;
  font-size: 14px;
  font-weight: var(--fw-bold);
  line-height: 22px;
  text-align: center;
}

.dt-foot {
  margin: 8px 20px 14px 68px;
  padding-top: 14px;
  border-top: var(--divider-w) solid var(--divider);
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-3);
}

.dt-socials {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.dt-social-row {
  display: flex;
  align-items: center;
  gap: 26px;
  color: var(--text-3);
}
.dt-social-row a { color: inherit; }
.dt-social-row a:active { opacity: .6; }

.dt-version {
  margin-top: 26px;
  text-align: center;
  font-size: 13px;
  color: var(--text-3);
}
`
