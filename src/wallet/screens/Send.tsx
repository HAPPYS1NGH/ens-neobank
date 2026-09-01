'use client'

/**
 * Send — the consuming half of the story. No screenshot exists for it; it is
 * built out of Tangem's own parts (the 46pt pill button, the 24pt card, the
 * row shape, the blue network tag) rather than invented.
 *
 * The recipient field takes four things and treats them as four different
 * things, because they are:
 *
 *   alice                -> alice.tange.eth, read straight from the registry we
 *                           write to. One request, authoritative, and it works
 *                           for a name claimed seconds ago.
 *   alice.tange.eth      -> the same path, spelled out.
 *   vitalik.eth  someone.id
 *                        -> public ENS through the resolve route, at the coin
 *                           type a standard client would use for THIS network
 *                           (ENSIP-11, not the raw chain id we write). Badged
 *                           `ENS` so it is obvious the answer came from outside.
 *   0x...                -> used as typed. Nothing is looked up.
 *
 * The resolution is deliberately visible: the pending line, the resolved
 * address, the coin type that answered and which system answered it. A wallet
 * that resolves names invisibly teaches nobody anything, and this screen exists
 * to be read as much as used.
 *
 * Nothing is broadcast. See SendReview.
 */

import { useEffect, useRef, useState } from 'react'
import { CHAIN_BY_KEY, NETWORK_BY_ID, type ChainKey } from '@/lib/chains'
import { assetForNetwork } from '@/lib/assets'
import { shortAddress } from '@/lib/format'
import { useWallet } from '../store'
import { NetworkMark } from '../components/CoinMark'
import { Back, Close, Info } from '../components/Icons'

export interface SendProps {
  networkId: string
  /**
   * A recipient handed in by the Address book. The store holds no
   * picked-contact state yet (only the `contacts` list), so the handoff is a
   * prop until the store grows one — see the integration note in Send's report.
   */
  initialRecipient?: string
}

type Resolution =
  | { state: 'empty' }
  | { state: 'address'; address: string }
  | { state: 'resolving'; query: string }
  | {
      state: 'resolved'
      name: string
      address: string
      source: 'internal' | 'ens'
      coinType: number
    }
  | { state: 'missing'; reason: string }

/** Address shapes, per chain. Loose on purpose — the server is not asked. */
function looksLikeAddress(value: string, chain: ChainKey | undefined): boolean {
  const raw = value.trim()
  if (!chain) return /^0x[0-9a-fA-F]{40}$/.test(raw)
  if (CHAIN_BY_KEY[chain].evm) return /^0x[0-9a-fA-F]{40}$/.test(raw)
  if (chain === 'btc') return /^(bc1[02-9ac-hj-np-z]{20,}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/.test(raw)
  if (chain === 'sol') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(raw)
  return false
}

export function Send({ networkId, initialRecipient }: SendProps) {
  const { back, go, addressForNetwork, contacts, parent, resolve, walletTitle } = useWallet()
  const [to, setTo] = useState(initialRecipient ?? '')
  const [amount, setAmount] = useState('')
  const [resolution, setResolution] = useState<Resolution>({ state: 'empty' })
  // Every lookup gets a ticket; a slow answer for an old query is dropped
  // rather than overwriting a newer one.
  const ticketRef = useRef(0)
  // The store rebuilds `resolve` on every state change, and this effect would
  // re-fire with it — re-requesting a name because a toast appeared somewhere.
  // The function is stable in behaviour, so read it through a ref and key the
  // effect on what the user typed instead.
  const resolveRef = useRef(resolve)
  resolveRef.current = resolve

  const network = NETWORK_BY_ID[networkId]
  const chain = network?.chain
  const asset = assetForNetwork(networkId)

  useEffect(() => {
    const query = to.trim()
    if (!query) {
      setResolution({ state: 'empty' })
      return
    }
    if (looksLikeAddress(query, chain)) {
      setResolution({ state: 'address', address: query })
      return
    }
    if (!chain) {
      setResolution({
        state: 'missing',
        reason: 'Names cannot resolve for this network, so paste an address.',
      })
      return
    }

    setResolution({ state: 'resolving', query: query.includes('.') ? query : `${query}.${parent}` })
    const ticket = ++ticketRef.current
    // 400ms: long enough that typing a name is one request, short enough that
    // the answer feels like it belongs to the keystroke.
    const timer = window.setTimeout(async () => {
      try {
        const hit = await resolveRef.current(query, chain)
        if (ticket !== ticketRef.current) return
        setResolution({
          state: 'resolved',
          name: hit.name,
          address: hit.address,
          source: hit.source,
          coinType: hit.coinType,
        })
      } catch (cause) {
        if (ticket !== ticketRef.current) return
        setResolution({
          state: 'missing',
          reason: cause instanceof Error ? cause.message : 'Could not resolve that name',
        })
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [to, chain, parent])

  if (!network || !asset) return null

  const value = Number(amount)
  const recipientReady = resolution.state === 'resolved' || resolution.state === 'address'
  const ready = recipientReady && Number.isFinite(value) && value > 0

  function next() {
    if (resolution.state === 'resolved') {
      go({
        name: 'sendReview',
        networkId,
        to: resolution.name,
        resolved: resolution.address,
        amount,
      })
    } else if (resolution.state === 'address') {
      go({
        name: 'sendReview',
        networkId,
        to: resolution.address,
        resolved: resolution.address,
        amount,
      })
    }
  }

  return (
    <div className="sn">
      <style>{CSS}</style>

      <header className="sn__bar">
        <button className="circle-btn sn__nav" onClick={back} aria-label="Back">
          <Back size={22} />
        </button>
        <h1 className="sn__title">Send</h1>
        <span className="sn__nav-spacer" />
      </header>

      <div className="sn__body scroll">
        <p className="sn__label">From</p>
        <div className="card sn__from">
          <NetworkMark networkId={networkId} size={39} label={asset.name} />
          <div className="sn__from-main">
            <span className="row__title">{network.rowName}</span>
            <span className="row__sub">
              {walletTitle} · {shortAddress(addressForNetwork(networkId))}
            </span>
          </div>
        </div>

        <p className="sn__label">To</p>
        <div className={`card sn__field${resolution.state === 'missing' ? ' sn__field--bad' : ''}`}>
          <input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder={`Name, ENS name or ${network.network} address`}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Recipient"
            className="sn__input"
          />
          {to && (
            <button className="sn__clear" onClick={() => setTo('')} aria-label="Clear">
              <Close size={14} />
            </button>
          )}
        </div>

        <div className="sn__resolution">
          <ResolutionBlock resolution={resolution} networkName={network.network} parent={parent} />
        </div>

        {!to && contacts.length > 0 && (
          <>
            <p className="sn__label">From your address book</p>
            <div className="sn__contacts">
              {contacts.slice(0, 4).map((contact) => (
                <button key={contact.id} className="pill sn__contact" onClick={() => setTo(contact.name)}>
                  {contact.name}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="sn__label">Amount</p>
        <div className="card sn__field">
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            inputMode="decimal"
            aria-label="Amount"
            className="sn__input sn__input--amount"
          />
          <span className="sn__ticker">{network.ticker}</span>
        </div>
        {/* SIMULATED — the demo wallet holds nothing and moves nothing. */}
        <p className="sn__hint">
          Balance 0 {network.ticker}. This demo does not move funds; only the name lookup is real.
        </p>
      </div>

      <div className="sn__foot">
        <button className="btn btn--primary" disabled={!ready} onClick={next}>
          Next
        </button>
      </div>
    </div>
  )
}

/** Everything the field is doing, said out loud rather than folded away. */
function ResolutionBlock({
  resolution,
  networkName,
  parent,
}: {
  resolution: Resolution
  networkName: string
  parent: string
}) {
  if (resolution.state === 'empty') {
    return (
      <p className="sn__hint">
        Type a name — <strong>alice</strong> becomes <strong>alice.{parent}</strong> — or any ENS
        name, or paste an address.
      </p>
    )
  }

  if (resolution.state === 'resolving') {
    return (
      <div className="sn__pending">
        <span className="sn__spinner" aria-hidden="true" />
        <span>Resolving {resolution.query}…</span>
      </div>
    )
  }

  if (resolution.state === 'missing') {
    return (
      <div className="sn__bad">
        <Info size={18} />
        <span>{resolution.reason}</span>
      </div>
    )
  }

  if (resolution.state === 'address') {
    return (
      <div className="card sn__hit">
        <div className="sn__hit-head">
          <span className="sn__hit-name">{networkName} address</span>
        </div>
        <p className="mono sn__hit-address">{resolution.address}</p>
        <p className="sn__hit-source">Used as typed. Nothing was looked up.</p>
      </div>
    )
  }

  const internal = resolution.source === 'internal'
  return (
    <div className="card sn__hit">
      <div className="sn__hit-head">
        <span className="sn__avatar">{resolution.name.charAt(0).toUpperCase()}</span>
        <span className="sn__hit-name">{resolution.name}</span>
        <span className="pill--tag sn__badge">{internal ? parent.toUpperCase() : 'ENS'}</span>
      </div>
      <p className="mono sn__hit-address">{resolution.address}</p>
      <p className="sn__hit-source">
        {internal
          ? `Read from the ${parent} registry · coin type ${resolution.coinType}`
          : `Public ENS via CCIP-Read · coin type ${resolution.coinType}`}
      </p>
    </div>
  )
}

const CSS = `
.sn {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.sn__bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px 4px;
  margin-top: 60px;
}

.sn__nav { background: var(--bg-elevated); }
.sn__nav-spacer { width: var(--sz-action); flex: none; }

.sn__title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: var(--fw-semibold);
}

.sn__body {
  flex: 1;
  min-height: 0;
  padding: 12px var(--pad-page) 8px;
}

.sn__label {
  margin: 14px 0 8px;
  font-size: var(--fs-sub);
  font-weight: var(--fw-semibold);
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .04em;
}

.sn__label:first-child { margin-top: 2px; }

.sn__from {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px var(--pad-row);
}

.sn__from-main { display: grid; min-width: 0; }

.sn__field {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 0 var(--pad-row);
  box-shadow: inset 0 0 0 1px transparent;
}

.sn__field--bad { box-shadow: inset 0 0 0 1px var(--price-down); }

.sn__input {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-body);
  color: var(--text-1);
}

.sn__input--amount {
  font-size: 20px;
  font-weight: var(--fw-semibold);
}

.sn__input::placeholder { color: var(--text-3); font-weight: var(--fw-regular); }

.sn__ticker {
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--text-3);
}

.sn__clear {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: var(--r-icon);
  background: var(--track-off);
  color: var(--bg-card);
  display: grid;
  place-items: center;
}

/* Reserve the space so the layout does not jump between pending and resolved. */
.sn__resolution { min-height: 92px; padding-top: 8px; }

.sn__hint {
  font-size: var(--fs-sub);
  color: var(--text-3);
  line-height: var(--lh-body);
}

.sn__hint strong { color: var(--text-2); font-weight: var(--fw-semibold); }

.sn__pending {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-sub);
  color: var(--text-3);
}

.sn__spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--track-off);
  border-top-color: var(--accent);
  animation: sn-spin .7s linear infinite;
}

@keyframes sn-spin { to { transform: rotate(360deg) } }

.sn__bad {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: var(--fs-sub);
  line-height: var(--lh-body);
  color: var(--price-down);
}

.sn__hit { padding: 12px var(--pad-row) 14px; }

.sn__hit-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sn__avatar {
  width: 26px;
  height: 26px;
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-size: var(--fs-sub);
  font-weight: var(--fw-bold);
  flex: none;
}

.sn__hit-name {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sn__badge { flex: none; }

.sn__hit-address { margin-top: 6px; }

.sn__hit-source {
  margin-top: 6px;
  font-size: var(--fs-sub);
  color: var(--text-3);
}

.sn__contacts { display: flex; flex-wrap: wrap; gap: 8px; }

.sn__contact { background: var(--bg-card); font-weight: var(--fw-medium); }

.sn__foot {
  flex: none;
  padding: 8px var(--pad-page) 46px;
}
`

export default Send
