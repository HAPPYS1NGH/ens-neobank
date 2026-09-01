'use client'

/**
 * Address book — screen 17, no screenshot, and the screen where the demo's
 * one idea pays off twice.
 *
 * Tangem already ships an address book; today its rows hold hex addresses,
 * which go stale the moment the person behind them swaps wallets. Here a
 * contact is stored as an ENS name and resolved LIVE through /api/resolve
 * every time the row renders — nothing is cached on this device, so a contact
 * keeps working when its owner changes wallets. That is the entire argument,
 * so the screen says it out loud rather than hiding it.
 *
 * Structure is built from the parts the photographed screens establish: the
 * Details header (42px back circle, 22px centred title), the grouped white
 * cards, the search pill from Manage tokens, and the blue tag from the network
 * rows. Two screens live in this file:
 *
 *   AddressBook   the list. Rows resolve the FIRST enabled chain only; opening
 *                 a row resolves the rest, so a list of ten contacts costs one
 *                 request each, not ten.
 *   AddContact    the add form, wired to the store's `addContact` screen route.
 *                 It resolves while you type and will not save a name that did
 *                 not answer, because an address book that stores an
 *                 unresolvable string has already failed at its one job.
 *
 * The Send screen consumes these contacts straight from the store (`w.contacts`
 * -> `setTo(contact.name)`), so anything saved here is immediately pickable
 * there. No extra wiring exists or is needed.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { CHAIN_BY_KEY, chainsForNetworks, type ChainKey } from '@/lib/chains'
import { shortAddress } from '@/lib/format'
import * as api from '../api'
import { useWallet, type Contact } from '../store'
import { ChevronDown, Plus, Search, Trash } from '../components/Icons'

/* ------------------------------------------------------------------ shared */

/**
 * One chain's answer for one name. `none` carries the server's own message —
 * "vitalik.eth has no Base address set" is a better sentence than anything a
 * client would invent.
 */
type Hit =
  | { state: 'loading' }
  | { state: 'ok'; address: string; source: 'internal' | 'ens'; coinType: number }
  | { state: 'none'; reason: string }

/** The blue tag. `internal` answers get the parent, external get `ENS`. */
function SourceTag({ source, parent }: { source: 'internal' | 'ens'; parent: string }) {
  return <span className="ab-tag">{source === 'ens' ? 'ENS' : `.${parent}`}</span>
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="ab-avatar" aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

/* -------------------------------------------------------------- the list */

export function AddressBook() {
  const w = useWallet()
  const [query, setQuery] = useState('')

  // The chains this wallet actually uses decide what a contact is asked for.
  // Memoised so the rows' effects key on identity, not a fresh array per render.
  const chains = useMemo(() => chainsForNetworks(w.enabledNetworkIds), [w.enabledNetworkIds])
  const primary = chains[0]

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return w.contacts
    return w.contacts.filter(
      (contact) =>
        contact.name.includes(needle) || (contact.note ?? '').toLowerCase().includes(needle),
    )
  }, [w.contacts, query])

  return (
    <div className="ab">
      <style>{CSS}</style>

      <header className="ab-head">
        <button className="ab-back" onClick={w.back} aria-label="Back">
          <ChevronDown size={22} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <h1 className="ab-title">Address book</h1>
      </header>

      <div className="ab-body scroll">
        {w.contacts.length === 0 ? (
          <div className="ab-empty">
            <span className="ab-empty-chip">
              <Plus size={22} />
            </span>
            <h2 className="ab-empty-title">No contacts yet</h2>
            <p className="ab-empty-copy">
              A contact here is a name, not a hex address. Save <strong>alice</strong> once and it
              resolves live on every chain you use — so it keeps working when the person behind it
              changes wallets.
            </p>
            <button className="btn btn--primary ab-empty-cta" onClick={() => w.go({ name: 'addContact' })}>
              Add contact
            </button>
          </div>
        ) : (
          <>
            <div className="ab-search">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search contacts"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Search contacts"
              />
            </div>

            <div className="ab-card">
              {filtered.length === 0 && <p className="ab-note ab-note--pad">No contact matches that.</p>}
              {filtered.map((contact) => (
                <ContactRow key={contact.id} contact={contact} chains={chains} />
              ))}
            </div>

            <button className="ab-add" onClick={() => w.go({ name: 'addContact' })}>
              <span className="ab-add-chip">
                <Plus size={20} />
              </span>
              <span className="ab-add-label">Add contact</span>
            </button>

            <p className="ab-note">
              Every row is resolved live through <code>/api/resolve</code> as it renders — nothing
              is stored on this device but the name. The badge marks a contact that answered from
              public ENS rather than the {w.parent} registry.
            </p>
          </>
        )}

        {/* The primary chain is a fact of the enabled set, not of the contacts;
         * surfacing it keeps the collapsed rows honest about what they show. */}
        {w.contacts.length > 0 && primary && (
          <p className="ab-note ab-note--quiet">Collapsed rows show the {CHAIN_BY_KEY[primary].network} answer.</p>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- one row */

function ContactRow({ contact, chains }: { contact: Contact; chains: ChainKey[] }) {
  const { resolve, parent, removeContact } = useWallet()
  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<Partial<Record<ChainKey, Hit>>>({})
  const ticket = useRef(0)

  // Resolved `resolve` is a new function on every store recompute, but the
  // lookup itself never changes — hold the latest in a ref so the effect keys
  // on the name and the fold state alone, or every toast re-fires requests.
  const resolveRef = useRef(resolve)
  resolveRef.current = resolve

  // Collapsed: only the first enabled chain. Open: all of them, once — a list
  // of ten contacts is ten requests, not a hundred, because closing and
  // reopening a row reads the answers it already has.
  useEffect(() => {
    const wanted = open ? chains : chains.slice(0, 1)
    if (wanted.length === 0) return
    const mine = ++ticket.current
    setHits((prev) => {
      const next: Partial<Record<ChainKey, Hit>> = { ...prev }
      for (const chain of wanted) if (!next[chain]) next[chain] = { state: 'loading' }
      return next
    })
    for (const chain of wanted) {
      resolveRef
        .current(contact.name, chain)
        .then((hit: api.ResolutionDTO) => {
          if (ticket.current !== mine) return
          setHits((prev) => ({
            ...prev,
            [chain]: { state: 'ok', address: hit.address, source: hit.source, coinType: hit.coinType },
          }))
        })
        .catch((cause: unknown) => {
          if (ticket.current !== mine) return
          setHits((prev) => ({
            ...prev,
            [chain]: {
              state: 'none',
              reason: cause instanceof Error ? cause.message : 'Could not resolve that name',
            },
          }))
        })
    }
    // `chains` is memoised in the parent; its identity only moves when the
    // user actually toggles a network.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.name, open, chains])

  const primary = chains[0]
  const primaryHit = primary ? hits[primary] : undefined
  const ensSource =
    primaryHit?.state === 'ok' && primaryHit.source === 'ens' ? true : false

  return (
    <div className="ab-row">
      <button className="ab-row-main" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Avatar name={contact.name} />
        <span className="ab-row-stack">
          <span className="ab-row-name">
            {contact.name}
            {ensSource && <SourceTag source="ens" parent={parent} />}
          </span>
          <span className="ab-row-sub" data-state={primaryHit?.state}>
            {primaryHit?.state === 'ok' && shortAddress(primaryHit.address)}
            {primaryHit?.state === 'loading' && 'Resolving…'}
            {primaryHit?.state === 'none' && primaryHit.reason}
            {/* No chain is enabled: there is nothing to resolve against, and
             * pretending to still be loading would be a lie. */}
            {!primaryHit && primary === undefined && 'No networks are enabled'}
            {!primaryHit && primary !== undefined && 'Resolving…'}
          </span>
        </span>
        {contact.note && <span className="ab-row-note">{contact.note}</span>}
        <ChevronDown
          size={17}
          className="ab-chevron"
          style={open ? { transform: 'rotate(180deg)' } : undefined}
        />
      </button>

      {open && (
        <div className="ab-detail">
          {chains.map((chain) => {
            const spec = CHAIN_BY_KEY[chain]
            const hit = hits[chain]
            return (
              <div className="ab-chain" key={chain}>
                <span className="ab-chain-disc" style={{ background: spec.color }} aria-hidden="true">
                  {spec.ticker.charAt(0)}
                </span>
                <span className="ab-chain-stack">
                  <span className="ab-chain-head">
                    <span className="ab-chain-name">{spec.network}</span>
                    {hit?.state === 'ok' && <SourceTag source={hit.source} parent={parent} />}
                  </span>
                  {hit?.state === 'ok' && (
                    <>
                      <span className="mono ab-chain-addr">{hit.address}</span>
                      <span className="ab-chain-src">
                        {hit.source === 'ens' ? 'Public ENS' : `${parent} registry`} · coin{' '}
                        {hit.source === 'ens' ? spec.publicCoin : spec.coin}
                      </span>
                    </>
                  )}
                  {hit?.state === 'loading' && <span className="ab-chain-src">Resolving…</span>}
                  {hit?.state === 'none' && (
                    <span className="ab-chain-src ab-chain-src--bad">{hit.reason}</span>
                  )}
                  {!hit && <span className="ab-chain-src">Resolving…</span>}
                </span>
              </div>
            )
          })}

          <button className="ab-remove" onClick={() => removeContact(contact.id)}>
            <Trash size={16} />
            <span>Remove contact</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------- add a contact */

type AddStatus =
  | { kind: 'empty' }
  | { kind: 'resolving'; query: string }
  | { kind: 'ok'; name: string; address: string; source: 'internal' | 'ens'; coinType: number }
  | { kind: 'none'; message: string }

export function AddContact() {
  const w = useWallet()
  const [raw, setRaw] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<AddStatus>({ kind: 'empty' })
  const ticket = useRef(0)

  const chains = useMemo(() => chainsForNetworks(w.enabledNetworkIds), [w.enabledNetworkIds])
  const chain = chains[0] ?? 'eth'
  const spec = CHAIN_BY_KEY[chain]

  const resolveRef = useRef(w.resolve)
  resolveRef.current = w.resolve

  // A bare label means OUR parent; a dotted name means whatever it says.
  const query = raw.trim().toLowerCase()
  const preview = query.includes('.') ? query : `${query}.${w.parent}`

  useEffect(() => {
    if (!query) {
      setStatus({ kind: 'empty' })
      return
    }
    setStatus({ kind: 'resolving', query: preview })
    const mine = ++ticket.current
    const timer = window.setTimeout(() => {
      resolveRef
        .current(query, chain)
        .then((hit) => {
          if (ticket.current !== mine) return
          setStatus({
            kind: 'ok',
            name: hit.name,
            address: hit.address,
            source: hit.source,
            coinType: hit.coinType,
          })
        })
        .catch((cause: unknown) => {
          if (ticket.current !== mine) return
          setStatus({
            kind: 'none',
            message: cause instanceof Error ? cause.message : 'Could not resolve that name',
          })
        })
    }, 400)
    return () => window.clearTimeout(timer)
    // `chain` moves only when the enabled networks move; `preview` is derived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, chain])

  // The store stores what it is handed; hand it the resolver's canonical name
  // so Send and the list can resolve it without re-deriving anything.
  const duplicate = status.kind === 'ok' && w.contacts.some((c) => c.name === status.name)
  const canSave = status.kind === 'ok' && !duplicate

  function save() {
    if (status.kind !== 'ok') return
    w.addContact({ name: status.name, note: note.trim() || undefined })
    w.back()
    w.showToast(`${status.name} saved to your address book`)
  }

  return (
    <div className="ac">
      <style>{CSS}</style>

      <header className="ac-head">
        <button className="ac-back" onClick={w.back} aria-label="Back">
          <ChevronDown size={22} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <h1 className="ac-title">Add contact</h1>
      </header>

      <div className="ac-body scroll">
        <div className="ac-card">
          <div className="ac-field">
            <input
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              placeholder="name, ENS name or label"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Contact name"
              autoFocus
            />
            {!query.includes('.') && <span className="ac-suffix">.{w.parent}</span>}
          </div>
        </div>

        <p className="ac-hint" data-state={status.kind}>
          {status.kind === 'empty' && `Resolves live on ${spec.network} — nothing is stored until it answers.`}
          {status.kind === 'resolving' && `Resolving ${status.query} on ${spec.network}…`}
          {status.kind === 'none' && status.message}
        </p>

        {status.kind === 'ok' && (
          <div className="ac-card ac-hit">
            <Avatar name={status.name} />
            <span className="ac-hit-stack">
              <span className="ac-hit-name">
                {status.name}
                <SourceTag source={status.source} parent={w.parent} />
              </span>
              <span className="mono ac-hit-addr">{status.address}</span>
              <span className="ac-hit-src">
                {status.source === 'ens' ? 'Public ENS' : `${w.parent} registry`} · coin{' '}
                {status.coinType} · re-resolves on every use
              </span>
            </span>
          </div>
        )}

        {duplicate && (
          <p className="ac-hint ac-hint--bad">That name is already in your address book.</p>
        )}

        <div className="ac-card">
          <div className="ac-field">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note (optional)"
              aria-label="Note"
              maxLength={32}
            />
          </div>
        </div>

        <p className="ac-note">
          Only the name is saved. When you send to this contact, the address is looked up again on
          the chain you are sending on — so if its owner moves wallets, the book stays right.
        </p>
      </div>

      <div className="ac-foot">
        <button className="btn btn--primary" onClick={save} disabled={!canSave}>
          Add contact
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- css */
/* Prefixed `ab-` / `ac-` so neither set can collide with another screen's. */

const CSS = `
.ab, .ac {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.ab-head, .ac-head {
  flex: none;
  position: relative;
  height: 108px;
  display: flex;
  align-items: flex-end;
  padding: 0 16px 18px;
}

.ab-back, .ac-back {
  width: 42px;
  height: 42px;
  border-radius: var(--r-icon);
  background: var(--bg-elevated);
  color: var(--icon-ink);
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-float);
}
.ab-back:active, .ac-back:active { opacity: .7; }

.ab-title, .ac-title {
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

.ab-body {
  flex: 1;
  min-height: 0;
  padding: 0 16px 48px;
  display: flex;
  flex-direction: column;
}

/* The blue source tag — same voice as the MAIN / MAIN L2 tags. */
.ab-tag {
  flex: none;
  margin-left: 8px;
  font-size: 11px;
  font-weight: var(--fw-semibold);
  letter-spacing: 0.02em;
  color: var(--accent);
  transform: translateY(-1px);
}

.ab-avatar {
  flex: none;
  width: 39px;
  height: 39px;
  border-radius: var(--r-icon);
  background: var(--bg-subtle);
  color: var(--text-1);
  font-size: 16px;
  font-weight: var(--fw-semibold);
  display: grid;
  place-items: center;
}

/* Empty state ------------------------------------------------------------ */

.ab-empty {
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 12px;
}

.ab-empty-chip {
  width: 56px;
  height: 56px;
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
}

.ab-empty-title {
  margin-top: 18px;
  font-size: var(--fs-heading);
  font-weight: var(--fw-bold);
  letter-spacing: -.01em;
}

.ab-empty-copy {
  margin-top: 10px;
  max-width: 320px;
  font-size: var(--fs-sub);
  line-height: var(--lh-body);
  color: var(--text-2);
}
.ab-empty-copy strong { color: var(--text-1); font-weight: var(--fw-semibold); }

.ab-empty-cta { margin-top: 24px; }

/* List ------------------------------------------------------------------- */

.ab-search {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--h-field);
  margin-bottom: var(--gap-group);
  padding: 0 14px;
  border-radius: var(--r-field);
  background: var(--bg-field);
  color: var(--text-3);
}

.ab-search input {
  flex: 1;
  min-width: 0;
  color: var(--text-1);
}
.ab-search input::placeholder { color: var(--text-3); }

.ab-card {
  background: var(--bg-card);
  border-radius: var(--r-card);
  overflow: hidden;
}

.ab-row + .ab-row {
  box-shadow: inset 0 var(--divider-w) 0 var(--divider);
}

.ab-row-main {
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  min-height: 66px;
  padding: 10px 16px;
  text-align: left;
}
.ab-row-main:active { background: var(--bg-subtle); }

.ab-row-stack {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ab-row-name {
  display: flex;
  align-items: baseline;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  letter-spacing: -.01em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ab-row-sub {
  font-size: 12px;
  color: var(--text-3);
  font-family: var(--font-mono);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* A miss is prose, not an address — set it back in the text face and let the
   server's sentence speak for itself. */
.ab-row-sub[data-state="none"] { font-family: var(--font); }

.ab-row-note {
  flex: none;
  font-size: 12px;
  color: var(--text-3);
  max-width: 90px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ab-chevron { flex: none; color: var(--text-3); transition: transform .2s ease; }

.ab-detail {
  padding: 4px 16px 12px 68px;
  background: var(--bg-card);
}

.ab-chain {
  display: flex;
  gap: 12px;
  padding: 10px 0;
}
.ab-chain + .ab-chain { box-shadow: inset 0 var(--divider-w) 0 var(--divider); }

.ab-chain-disc {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: var(--r-icon);
  color: #fff;
  font-size: 11px;
  font-weight: var(--fw-bold);
  display: grid;
  place-items: center;
}

.ab-chain-stack { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

.ab-chain-head { display: flex; align-items: baseline; gap: 8px; }
.ab-chain-name { font-size: 13px; font-weight: var(--fw-semibold); color: var(--text-1); }
.ab-chain .ab-tag { margin-left: 0; }

.ab-chain-addr { font-size: var(--fs-mono); }

.ab-chain-src { font-size: 11px; color: var(--text-3); }
.ab-chain-src--bad { color: var(--price-down); }

.ab-remove {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 0 2px;
  color: var(--price-down);
  font-size: var(--fs-sub);
  font-weight: var(--fw-semibold);
}
.ab-remove:active { opacity: .6; }
.ab-remove + * { margin-top: 0; }

.ab-add {
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  margin-top: var(--gap-group);
  padding: 12px 16px;
  border-radius: var(--r-card);
  background: var(--bg-card);
  text-align: left;
}
.ab-add:active { background: var(--bg-subtle); }

.ab-add-chip {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: var(--r-icon);
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
}

.ab-add-label { font-size: 16px; font-weight: var(--fw-semibold); color: var(--accent); }

.ab-note {
  margin: 14px 6px 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--text-3);
}
.ab-note--quiet { margin-top: 10px; font-size: 12px; color: var(--text-3); opacity: .8; }
.ab-note--pad { margin: 0; padding: 16px; }
.ab-note code { font-family: var(--font-mono); font-size: 12px; }

/* Add contact ------------------------------------------------------------ */

.ac-body {
  flex: 1;
  min-height: 0;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
}

.ac-card {
  background: var(--bg-card);
  border-radius: var(--r-card);
  overflow: hidden;
}

.ac-field {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 56px;
  padding: 0 18px;
}
.ac-field input {
  flex: 1;
  min-width: 0;
  font-size: 17px;
  font-weight: var(--fw-semibold);
}
.ac-field input::placeholder { color: var(--text-3); font-weight: var(--fw-regular); }

.ac-suffix { flex: none; font-size: 17px; font-weight: var(--fw-semibold); color: var(--text-3); }

.ac-hint {
  min-height: 20px;
  margin: 10px 6px 14px;
  font-size: var(--fs-sub);
  line-height: 1.4;
  color: var(--text-3);
}
.ac-hint--bad, .ac-hint[data-state="none"] { color: var(--price-down); }

.ac-hit { display: flex; align-items: center; gap: 13px; padding: 14px 16px; margin-bottom: 14px; }

.ac-hit-stack { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }

.ac-hit-name {
  display: flex;
  align-items: baseline;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  letter-spacing: -.01em;
  word-break: break-all;
}

.ac-hit-addr { font-size: var(--fs-mono); }
.ac-hit-src { font-size: 11px; color: var(--text-3); }

.ac-note {
  margin: 14px 6px 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--text-3);
}

.ac-foot { flex: none; padding: 12px 0 4px; }
`

/* Default export so the router can `import AddressBook from '.../AddressBook'`
 * the same way it imports NameWallet. */
export default AddressBook