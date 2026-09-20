'use client'

/**
 * Add chain — reached from Home (Add funds), Add & Manage, and Receive.
 *
 * Receive shows one network's address, and until now the only way to put a new
 * chain on the name was Organize tokens, a coin-shaped list with no exit back to
 * the address you were trying to receive at. This sheet is the same write with
 * a receive-shaped front door: every writable network that is not on yet, one
 * toggle each, and on Save the merged selection goes to `saveNetworks` — which
 * both enables the networks locally and writes the missing address records to
 * the name.
 *
 * One contract matters more than anything else here: `saveNetworks` REPLACES
 * the whole enabled list, so it is handed `[...enabled, ...added]`, never the
 * new ids alone. Passing just the additions would silently switch every other
 * network off.
 *
 * Unwritable networks are not listed at all. Receive already explains the
 * unwritable network the user is sitting on with its `reason` line; repeating
 * that wall of reasons here would bury the chains that do work.
 *
 * A network whose chain already has a record (USDC on Ethereum when ETH is on,
 * say) still shows up — its toggle writes nothing, and the caption under it
 * says so rather than letting Save imply a registry write that never happens.
 */

import { useMemo, useState } from 'react'
import { Sheet } from '../components/Shell'
import { NetworkMark } from '../components/CoinMark'
import { useWallet } from '../store'
import {
  CHAIN_BY_KEY,
  NETWORKS,
  chainsForNetworks,
  type ChainKey,
  type NetworkSpec,
} from '@/lib/chains'

export function AddNetworkSheet() {
  const w = useWallet()

  const available = useMemo(
    () => NETWORKS.filter((n) => n.writable && !w.enabled.has(n.id)),
    [w.enabled],
  )

  /* Same shape as Manage tokens: a local draft that Save commits, so the store
   * — and the Receive sheet behind this one — stays untouched until then. */
  const [draft, setDraft] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<'idle' | 'saving' | 'error'>('idle')
  const [pendingChains, setPendingChains] = useState<Set<ChainKey>>(new Set())
  const [error, setError] = useState<string | null>(null)
  // Rows as they were when Save was tapped. `saveNetworks` flips the local
  // enabled list before it writes anything, so by the time the registry calls
  // are in flight these rows are no longer "not yet enabled" — without the
  // snapshot they would vanish mid-write and the per-row spinner with them.
  const [rows, setRows] = useState<NetworkSpec[] | null>(null)

  /** Chains the name already holds a record for — the truth, not the toggles. */
  const writtenChains = useMemo(
    () => new Set<ChainKey>(Object.keys(w.ensName?.addresses ?? {}) as ChainKey[]),
    [w.ensName],
  )

  const toggle = (network: NetworkSpec) => {
    if (phase === 'saving') return
    setDraft((prev) => {
      const next = new Set(prev)
      if (next.has(network.id)) next.delete(network.id)
      else next.add(network.id)
      return next
    })
    setError(null)
  }

  async function save() {
    const addedIds = [...draft]
    if (addedIds.length === 0) return

    // Only the chains without a record are actually written; the rest are
    // enabled locally and nothing goes near the registry.
    const needed = chainsForNetworks(addedIds).filter((c) => !writtenChains.has(c))
    setPendingChains(new Set(needed))
    setPhase('saving')
    setRows(available)
    setError(null)

    // Merged with what is already on, and de-duplicated: a retry after a failed
    // save lands here with the additions already in the local enabled list
    // (`saveNetworks` flips it before it writes), and a doubled id would double
    // the rows downstream.
    const result = await w.saveNetworks([...new Set([...w.enabledNetworkIds, ...addedIds])])

    if (result.ok) {
      if (needed.length > 0 && w.ensName) {
        w.showToast(
          needed.length === 1
            ? `${CHAIN_BY_KEY[needed[0]].network} added to ${w.ensName.fullName}`
            : `${needed.length} networks added to ${w.ensName.fullName}`,
        )
      }
      // End the flow where it started: Receive for the first network added.
      // Its record — freshly written or already on the name — is what the
      // sheet reads back, so the name lights up as soon as this lands.
      w.openSheet({ kind: 'receive', networkId: addedIds[0] })
    } else {
      // Nothing was rolled back — records written before the failure stand,
      // and a retry is safe because add-address is a read-merge-write.
      setError(result.error ?? 'Could not update the name')
      setPendingChains(new Set())
      setRows(null)
      setPhase('error')
    }
  }

  const saving = phase === 'saving'

  return (
    <Sheet
      title="Add chain"
      onClose={w.closeSheet}
      footer={
        draft.size > 0 || phase !== 'idle' ? (
          <div>
            {!w.isNamed && (
              <p className="an-footnote">
                This wallet has no name yet — networks are saved locally until you name it.
              </p>
            )}
            {error && <p className="an-error">{error}</p>}
            <button className="btn btn--primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : undefined
      }
    >
      <style>{CSS}</style>

      <div className="card an-list">
        {(rows ?? available).map((network) => {
          const on = draft.has(network.id)
          const pending = saving && !!network.chain && pendingChains.has(network.chain)
          const alreadyWritten = !!network.chain && writtenChains.has(network.chain)
          return (
            <div key={network.id} className="an-row">
              <div className="an-row__main">
                <NetworkMark
                  networkId={network.id}
                  size={22}
                  disc
                  dot
                  muted={!on}
                  label={network.title}
                />
                <span className="an-row__title">
                  {network.title}
                  <span className="an-row__tag">{network.tag}</span>
                </span>
                {pending ? (
                  <span className="an-spin" aria-label="Writing address" />
                ) : (
                  <button
                    className="toggle"
                    role="switch"
                    aria-checked={on}
                    aria-label={`${network.title} ${network.tag}`}
                    data-on={on}
                    disabled={saving}
                    onClick={() => toggle(network)}
                  >
                    <span className="toggle__knob" />
                  </button>
                )}
              </div>
              {alreadyWritten && (
                <p className="an-row__note">
                  The {network.network} address is already on the name — saving just turns this
                  network on.
                </p>
              )}
            </div>
          )
        })}
        {available.length === 0 && !rows && (
          <p className="an-empty">
            Every chain this wallet can add is already on — Organize tokens has the full list.
          </p>
        )}
      </div>
    </Sheet>
  )
}

/* --------------------------------------------------------------------- css */

const CSS = `
.an-list { margin-top: var(--gap-group); padding: 4px 0 8px; }

.an-row { padding: 0 var(--pad-row); }

.an-row__main {
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--h-row-network);
}

.an-row__title {
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

.an-row__tag {
  color: var(--accent);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.02em;
}

/* Only for a network whose chain already has a record, where Save is a local
 * switch and nothing else. One line, under the row it explains. */
.an-row__note {
  padding-bottom: 10px;
  font-size: 11px;
  line-height: 1.35;
  color: var(--text-3);
}

.an-empty {
  padding: 20px 16px 24px;
  font-size: var(--fs-sub);
  color: var(--text-3);
  text-align: center;
}

.an-footnote {
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-2);
}

.an-error {
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--price-down);
}

/* Same in-flight treatment as Manage tokens: the spinner takes the toggle's
 * 50px box so nothing else in the row moves while the record is written. */
.an-spin {
  flex: none;
  width: 18px;
  height: 18px;
  margin-right: 32px;
  border-radius: 50%;
  border: 2px solid var(--divider);
  border-top-color: var(--text-3);
  animation: an-rotate .8s linear infinite;
}

@keyframes an-rotate { to { transform: rotate(360deg) } }
`

export default AddNetworkSheet