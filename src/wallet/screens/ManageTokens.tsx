'use client'

/**
 * Manage tokens — IMG_4302 (collapsed), IMG_4303 (BNB expanded), IMG_4304
 * (Solana expanded with the sticky Save), IMG_4305 (Ethereum's L2 wall).
 *
 * This screen is where the demo's argument lands. Tangem's toggle adds a local
 * account; here, toggling a network on and hitting Save writes that chain's
 * address record onto the wallet's subname through the add-address route — so
 * `happy.ninza.eth` genuinely gains a chain. The screen therefore shows the
 * write happening: a per-row pending state while the record is in flight, and
 * a per-row result once the registry confirms it.
 *
 * Only networks the offchain name can hold are listed. Chains the registry
 * cannot write (XRP, TRON, Beacon, Hyperliquid, …) stay out of this sheet;
 * Add chain is the same writable set. Toggling a network OFF does not delete
 * its record — `saveNetworks` in the store only ever adds. When a row with a
 * live record is switched off, the caption under it says the record stays on
 * the name, rather than letting the toggle imply a deletion that never happens.
 *
 * The Save button is the real commit point: nothing is written until it is
 * pressed, which is also why the draft lives in local state rather than being
 * pushed into the store on every toggle.
 */

import { useMemo, useState } from 'react'
import { Sheet } from '../components/Shell'
import { CoinMark, NetworkMark } from '../components/CoinMark'
import { ChevronDown, ChevronUp, Plus, Search } from '../components/Icons'
import { useWallet } from '../store'
import {
  CHAIN_BY_KEY,
  COINS,
  chainsForNetworks,
  coinIsUnsupported,
  writableNetworksForCoin,
  type ChainKey,
  type CoinId,
  type NetworkSpec,
} from '@/lib/chains'

export interface ManageTokensProps {
  /** Defaults to the store's own `closeSheet`. */
  onClose?: () => void
}

/** Geometry the connector drawing depends on. Matches docs/DESIGN.md. */
const NETWORK_ROW_H = 60
const NOTE_H = 20

type Note = { text: string; tone: 'muted' | 'accent' }

export function ManageTokens({ onClose }: ManageTokensProps) {
  const w = useWallet()
  const close = onClose ?? w.closeSheet

  /* The draft is what Save commits. Until then the store — and the home
   * screen behind the sheet — is untouched, exactly like the real app. */
  const [draft, setDraft] = useState<string[]>(() => [...w.enabledNetworkIds])
  const [expanded, setExpanded] = useState<Set<CoinId>>(new Set())
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [pendingChains, setPendingChains] = useState<Set<ChainKey>>(new Set())
  const [justAdded, setJustAdded] = useState<Set<ChainKey>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const fullName = w.ensName?.fullName ?? null

  /** Chains the name already holds a record for — the truth, not the toggles. */
  const writtenChains = useMemo(
    () => new Set<ChainKey>(Object.keys(w.ensName?.addresses ?? {}) as ChainKey[]),
    [w.ensName],
  )

  const draftOn = useMemo(() => new Set(draft), [draft])

  const changed = useMemo(() => {
    const base = new Set(w.enabledNetworkIds)
    if (base.size !== draftOn.size) return true
    for (const id of draftOn) if (!base.has(id)) return true
    return false
  }, [w.enabledNetworkIds, draftOn])

  /* Searching widens to network titles, and a query forces every visible coin
   * open — hunting for a chain by name is useless if it stays folded. */
  const q = query.trim().toLowerCase()
  const visibleCoins = useMemo(() => {
    const writable = COINS.filter((c) => !coinIsUnsupported(c.id))
    if (!q) return writable
    return writable.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ticker.toLowerCase().includes(q) ||
        writableNetworksForCoin(c.id).some(
          (n) => n.title.toLowerCase().includes(q) || n.network.toLowerCase().includes(q),
        ),
    )
  }, [q])

  const toggleNetwork = (network: NetworkSpec) => {
    // An unwritable network's toggle is rendered disabled; this guard keeps
    // the state machine honest even if a caller bypasses the attribute.
    if (!network.writable || phase === 'saving') return
    setDraft((d) =>
      d.includes(network.id) ? d.filter((id) => id !== network.id) : [...d, network.id],
    )
    setJustAdded(new Set())
    setError(null)
  }

  const toggleCoin = (coinId: CoinId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(coinId)) next.delete(coinId)
      else next.add(coinId)
      return next
    })
  }

  /**
   * Which chains Save has to write: the chains behind newly-enabled networks,
   * minus the ones the name already holds. Shared chains collapse naturally —
   * enabling USDC on Ethereum when ETH is already on writes nothing, because
   * coin 60 is already there.
   */
  async function save() {
    const addedIds = draft.filter((id) => !w.enabled.has(id))
    const needed = chainsForNetworks(addedIds).filter((c) => !writtenChains.has(c))
    setPendingChains(new Set(needed))
    setPhase('saving')
    setError(null)

    const result = await w.saveNetworks(draft)

    // The write is over either way — the row spinners must not outlive it.
    setPendingChains(new Set())

    if (result.ok) {
      if (result.written.length > 0 && w.ensName) {
        setJustAdded(new Set(result.written))
        w.showToast(
          result.written.length === 1
            ? `${CHAIN_BY_KEY[result.written[0]].network} added to ${w.ensName.fullName}`
            : `${result.written.length} networks added to ${w.ensName.fullName}`,
        )
      } else if (!w.ensName) {
        // An unnamed wallet saved locally only. Say so rather than letting a
        // green light imply a registry write that never happened.
        w.showToast('Saved locally — this wallet has no name yet')
      }
      setPhase('done')
      window.setTimeout(() => {
        setPhase('idle')
        setJustAdded(new Set())
      }, 5000)
    } else {
      // Nothing was rolled back — the chains in `result.written` wrote and
      // stand (the store dispatches each as it lands), and a retry is safe
      // because add-address is a read-merge-write.
      setError(result.error ?? 'Could not update the name')
      setPhase('error')
    }
  }

  const noteFor = (network: NetworkSpec): Note | null => {
    if (network.chain && saving && pendingChains.has(network.chain) && fullName) {
      return { text: `Writing the address to ${fullName}…`, tone: 'muted' }
    }
    if (
      network.chain &&
      justAdded.has(network.chain) &&
      writtenChains.has(network.chain) &&
      fullName
    ) {
      return { text: `Added to ${fullName}`, tone: 'accent' }
    }
    // The honesty rule: an off toggle here means "hidden", never "deleted".
    if (
      network.chain &&
      !draftOn.has(network.id) &&
      writtenChains.has(network.chain) &&
      fullName
    ) {
      return {
        text: `The record stays on ${fullName} — turning the token off here hides it, it does not delete the address.`,
        tone: 'muted',
      }
    }
    return null
  }

  const saving = phase === 'saving'
  const showFooter = changed || phase !== 'idle'

  return (
    <Sheet
      title="Organize tokens"
      onClose={close}
      full
      footer={
        showFooter ? (
          <div>
            {!w.isNamed && (
              <p className="mt-footnote">
                This wallet has no name yet — networks are saved locally until you name it.
              </p>
            )}
            {error && <p className="mt-error">{error}</p>}
            <button className="btn btn--primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : undefined
      }
    >
      <style>{CSS}</style>

      <div className="field mt-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search tokens"
        />
      </div>

      <button
        className="card mt-add"
        onClick={() => w.showToast('Custom tokens are not part of this demo')}
      >
        <span className="mt-add__chip">
          <Plus size={20} />
        </span>
        <span className="mt-add__label">Add custom token</span>
      </button>

      <div className="card mt-coins">
        {visibleCoins.map((coin) => {
          const networks = writableNetworksForCoin(coin.id)
          const open = q.length > 0 || expanded.has(coin.id)
          // Greyscale until the coin is actually in the portfolio — measured
          // off IMG_4302, where Tether/BNB/USDC/TRON all sample monochrome.
          const inPortfolio = networks.some((n) => draftOn.has(n.id))
          return (
            <div key={coin.id} className="mt-coin">
              <button className="mt-coin__row" onClick={() => toggleCoin(coin.id)}>
                <CoinMark coinId={coin.id} size={35} muted={!inPortfolio} />
                <span className="mt-coin__stack">
                  <span className="mt-coin__line">
                    <span className="mt-coin__title">{coin.name}</span>
                    <span className="mt-coin__ticker">{coin.ticker}</span>
                  </span>
                  {open && <span className="mt-coin__sub">Available networks</span>}
                </span>
                <span className="mt-coin__chevron">
                  {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </span>
              </button>

              {open && (
                <NetworkBlock
                  coinId={coin.id}
                  networks={networks}
                  draft={draftOn}
                  noteFor={noteFor}
                  pendingChains={pendingChains}
                  saving={saving}
                  onToggle={toggleNetwork}
                />
              )}
            </div>
          )
        })}
        {visibleCoins.length === 0 && <p className="mt-empty">No tokens match “{query}”</p>}
      </div>
    </Sheet>
  )
}

/* -------------------------------------------------------------- the branch */

/**
 * The expanded coin's network rows, with the curved connector that branches
 * down from the coin mark to each one (IMG_4303/4305). The connector is one
 * SVG sized to the rows it serves; row heights are accounted for in JS because
 * a caption under a row makes that row taller and the arcs have to follow.
 */
function NetworkBlock({
  coinId,
  networks,
  draft,
  noteFor,
  pendingChains,
  saving,
  onToggle,
}: {
  coinId: CoinId
  networks: NetworkSpec[]
  draft: Set<string>
  noteFor: (network: NetworkSpec) => Note | null
  pendingChains: Set<ChainKey>
  saving: boolean
  onToggle: (network: NetworkSpec) => void
}) {
  const SPINE_X = 20
  const ARROW_X = 36

  // Walk the rows once: each row is 60 tall, plus 20 more when it carries a
  // caption. The connector needs every row's centre line up front.
  let acc = 0
  const geometry = networks.map((network) => {
    const centre = acc + NETWORK_ROW_H / 2
    acc += NETWORK_ROW_H + (noteFor(network) ? NOTE_H : 0)
    return { network, centre }
  })
  const totalH = acc

  const lastBranch = Math.min(...geometry.map((g) => g.centre)) - 24
  const spineEnd = Math.max(0, geometry[geometry.length - 1].centre - 26)

  return (
    <div className="mt-nets" style={{ height: totalH }}>
      <svg
        className="mt-nets__connector"
        width={56}
        height={totalH}
        aria-hidden="true"
      >
        <path
          d={`M ${SPINE_X} 0 V ${spineEnd}`}
          fill="none"
          stroke="var(--track-off)"
          strokeWidth={1.5}
        />
        {geometry.map(({ network, centre }) => {
          const branch = Math.max(lastBranch, centre - 26)
          return (
            <g key={network.id} fill="none" stroke="var(--track-off)" strokeWidth={1.5}>
              <path
                d={`M ${SPINE_X} ${branch} C ${SPINE_X} ${centre - 8}, 26 ${centre}, ${ARROW_X} ${centre}`}
              />
              <path d={`M ${ARROW_X - 6} ${centre - 4} L ${ARROW_X + 1} ${centre} L ${ARROW_X - 6} ${centre + 4}`} />
            </g>
          )
        })}
      </svg>

      {geometry.map(({ network, centre }) => {
        const note = noteFor(network)
        const on = draft.has(network.id)
        // A write in flight, not a write that once started — pendingChains is
        // cleared when the save resolves, and the `saving` guard keeps the
        // spinner off in the beat before that clear lands.
        const pending =
          saving && network.writable && !!network.chain && pendingChains.has(network.chain)
        return (
          <div key={network.id} className="mt-net" style={{ top: centre - NETWORK_ROW_H / 2 }}>
            <div className="mt-net__row">
              <NetworkMark networkId={network.id} size={22} disc dot muted={!on} label={network.title} />
              <span className="mt-net__title">
                {network.title}
                <span className="mt-net__tag">{network.tag}</span>
              </span>
              {pending ? (
                <span className="mt-spin" aria-label="Writing address" />
              ) : (
                <button
                  className="toggle"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${network.title} ${network.tag}`}
                  data-on={on}
                  disabled={!network.writable || saving}
                  onClick={() => onToggle(network)}
                >
                  <span className="toggle__knob" />
                </button>
              )}
            </div>
            {note && (
              // `top` is relative to this row wrapper, which is already offset
              // to the row's own top — so the caption sits just under the 60px row.
              <p className={`mt-note mt-note--${note.tone}`} style={{ top: NETWORK_ROW_H - 8 }}>
                {note.text}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* --------------------------------------------------------------------- css */

const CSS = `
.mt-search { margin-top: 4px; }
.mt-search input { flex: 1; text-align: center; }
.mt-search svg { color: var(--text-3); }

/* Add custom token ------------------------------------------------------- */

.mt-add {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 13px 16px;
  margin-top: var(--gap-group);
  text-align: left;
}
.mt-add:active { opacity: .65; }

.mt-add__chip {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
}

.mt-add__label {
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
  color: var(--text-1);
}

/* Coin rows ---------------------------------------------------------------- */

.mt-coins { margin-top: var(--gap-group); padding: 4px 0 8px; }

.mt-coin__row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: var(--h-row-sheet);
  padding: 0 var(--pad-row);
  text-align: left;
}
.mt-coin__row:active { opacity: .65; }

.mt-coin__stack { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

.mt-coin__line { display: flex; align-items: baseline; gap: 8px; }

.mt-coin__title {
  font-size: var(--fs-body);
  font-weight: var(--fw-medium);
  color: var(--text-1);
}

.mt-coin__ticker {
  font-size: var(--fs-body);
  font-weight: var(--fw-regular);
  color: var(--text-3);
}

/* The line under an expanded coin's name (IMG_4304/4305). */
.mt-coin__sub {
  font-size: var(--fs-sub);
  color: var(--text-3);
}

.mt-coin__chevron { color: var(--text-3); display: grid; place-items: center; }

/* Network rows + connector ------------------------------------------------- */

.mt-nets { position: relative; }

.mt-nets__connector {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}

.mt-net { position: absolute; left: 0; right: 0; }

.mt-net__row {
  display: flex;
  align-items: center;
  gap: 12px;
  height: ${NETWORK_ROW_H}px;
  padding: 0 16px 0 46px;
}

.mt-net__title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: var(--fs-sub);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.02em;
  color: var(--text-1);
  text-transform: uppercase;
}

.mt-net__tag {
  color: var(--accent);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.02em;
}

/* Captions ------------------------------------------------------------------ */

.mt-note {
  position: absolute;
  left: 80px;
  right: 76px;
  font-size: 11px;
  line-height: 1.35;
  color: var(--text-3);
}

.mt-note--accent { color: var(--accent); }

.mt-empty {
  padding: 20px 16px 24px;
  font-size: var(--fs-sub);
  color: var(--text-3);
  text-align: center;
}

/* Footer --------------------------------------------------------------------- */

.mt-footnote {
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-2);
}

.mt-error {
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--price-down);
}

/* The in-flight record write. Small and grey — it takes the toggle's whole
 * 50px box (18px spinner + margin) so the row's other contents never shift. */
.mt-spin {
  flex: none;
  width: 18px;
  height: 18px;
  margin-right: 32px;
  border-radius: 50%;
  border: 2px solid var(--divider);
  border-top-color: var(--text-3);
  animation: mt-rotate .8s linear infinite;
}

@keyframes mt-rotate { to { transform: rotate(360deg) } }
`