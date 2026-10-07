'use client'

/**
 * Wallet detail — the screen behind the chevron on the Details wallets row.
 *
 * No screenshot for this one, so it is built out of the surrounding language:
 * the same 42px back button and 22px centred title as Details, the same 24px
 * grouped white cards, the same 46/64px rows.
 *
 * Two things here are not decoration.
 *
 * 1. WHAT IT RESOLVES TO IS READ BACK, NOT REMEMBERED. The address list comes
 *    from GET /api/subnames/<name>, so it shows what the registry actually
 *    holds. If a record failed to write during Manage tokens, this screen is
 *    where that shows up — which is the point of reading rather than echoing
 *    local state.
 *
 * 2. RENAMING AN UNNAMED WALLET IS THE SECOND CLAIM. SPEC.md promises the name
 *    step is not the only door; someone who ticked *Continue without a name*
 *    gets the same claim here, in the field Tangem already uses for its local
 *    label. Renaming an ALREADY-NAMED wallet is a different problem and this
 *    screen says so in as many words instead of pretending.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../api'
import { CHAIN_BY_KEY, useWallet, type ChainKey, type WalletNameDTO } from '../store'
import { chainsForNetworks } from '@/lib/chains'
import { LABEL_MAX, acceptLabel, fullNameFor, labelPreviewIssue, normalizeLabelPreview } from '@/lib/format'
import { ChevronRight, Refresh, Trash } from '../components/Icons'
import { brand } from '@config'

export interface WalletDetailProps {
  /** Which wallet from `w.wallets` this screen is showing. */
  walletId: string
}

type ReadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; name: WalletNameDTO }
  | { status: 'error'; message: string }

type CheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'free'; label: string }
  | { status: 'taken'; label: string }
  /** The server rejected the label itself — too short, reserved, bad chars. */
  | { status: 'invalid'; message: string }
  /** We could not find out. Not "taken", and never shown as one. */
  | { status: 'unknown'; message: string }

export function WalletDetail({ walletId }: WalletDetailProps) {
  const w = useWallet()
  const wallet = w.wallets.find((x) => x.id === walletId) ?? w.wallet
  const fullName = wallet?.name?.fullName ?? null

  // Claiming writes through the store, which always acts on the ACTIVE wallet.
  // Opening this screen therefore makes its wallet active, or a claim made here
  // would land on someone else's row.
  useEffect(() => {
    if (wallet && w.activeWalletId !== wallet.id) w.activateWallet(wallet.id)
  }, [wallet, w.activeWalletId, w])

  /* --------------------------------------------------- what it resolves to */

  const [read, setRead] = useState<ReadState>({ status: 'idle' })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!fullName) {
      setRead({ status: 'idle' })
      return
    }
    let cancelled = false
    setRead({ status: 'loading' })
    api
      .readName(fullName)
      .then((name) => {
        if (!cancelled) setRead({ status: 'ok', name })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Could not read the name'
        setRead({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [fullName, tick])

  /**
   * Every chain the wallet's enabled networks need a record for, in CHAINS
   * order, plus anything the registry holds that is no longer toggled on —
   * records are never deleted, so a name can outlive the toggle that made it.
   */
  const chains = useMemo(() => {
    // This wallet's own networks, not the active wallet's — the two are the
    // same after the effect above runs, but not on the first render.
    const wanted = chainsForNetworks(wallet?.enabledNetworkIds ?? [])
    const held = read.status === 'ok' ? (Object.keys(read.name.addresses) as ChainKey[]) : []
    return [...wanted, ...held.filter((c) => !wanted.includes(c))]
  }, [wallet, read])

  /* ------------------------------------------------------------ the claim */

  const [draft, setDraft] = useState('')
  const [check, setCheck] = useState<CheckState>({ status: 'idle' })
  const [claimError, setClaimError] = useState<string | null>(null)
  const label = normalizeLabelPreview(draft)
  const seq = useRef(0)

  const runCheck = useCallback(
    (value: string) => {
      const id = ++seq.current
      if (!value) {
        setCheck({ status: 'idle' })
        return
      }
      const issue = labelPreviewIssue(value)
      if (issue) {
        setCheck({ status: 'invalid', message: issue })
        return
      }
      setCheck({ status: 'checking' })
      w.checkName(value)
        .then((result) => {
          if (id !== seq.current) return
          setCheck({
            status: result.available ? 'free' : 'taken',
            label: result.label,
          })
        })
        .catch((error: unknown) => {
          if (id !== seq.current) return
          // The server writes these messages for the user; render them as-is.
          // A coded 400 is a judgement about the label; anything else is an
          // outage, which must not read as "taken" — the mint is the only
          // authority anyway, so claiming stays possible (same call as
          // NameWallet makes).
          if (error instanceof api.ApiError && error.status === 400) {
            setCheck({ status: 'invalid', message: error.message })
            return
          }
          setCheck({
            status: 'unknown',
            message:
              error instanceof Error ? error.message : 'Could not check this name right now',
          })
        })
    },
    [w],
  )

  useEffect(() => {
    if (fullName) return
    const timer = window.setTimeout(() => runCheck(label), 400)
    return () => window.clearTimeout(timer)
  }, [label, fullName, runCheck])

  async function claim() {
    setClaimError(null)
    const result = await w.claimName(label, wallet.id)
    if (result.ok) {
      setDraft('')
      setCheck({ status: 'idle' })
      setTick((n) => n + 1)
      w.showToast(`${fullNameFor(label, w.parent)} is yours`)
    } else {
      setClaimError(result.error)
    }
  }

  // `unknown` stays claimable: if the availability route is down or the demo
  // runs without a key, a permanently dead button is a worse failure than a
  // request that comes back with the mint's own error.
  const canClaim =
    (check.status === 'free' || check.status === 'unknown') && !w.busy

  /* ------------------------------------------------------- the delete */

  // Deletion is destructive, so it asks twice: the first tap arms the row,
  // the second commits. Arming decays on its own so a stray tap never leaves
  // a loaded delete sitting there.
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const timer = window.setTimeout(() => setArmed(false), 3500)
    return () => window.clearTimeout(timer)
  }, [armed])

  const deletable = w.wallets.length > 1

  function deleteWallet() {
    if (!armed) {
      setArmed(true)
      return
    }
    setArmed(false)
    w.removeWallet(wallet.id)
    w.back()
  }

  return (
    <div className="wd">
      <style>{CSS}</style>

      <header className="wd-head">
        <button className="wd-back" onClick={w.back} aria-label="Back">
          <ChevronRight size={22} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 className="wd-title">Wallet</h1>
      </header>

      <div className="wd-body scroll">
        {/* ------------------------------------------------------- identity */}
        <div className="wd-hero">
          <div className="wd-hero-name">{fullName ?? wallet?.label ?? brand.copy.unnamedLabel}</div>
          <div className="wd-hero-sub">
            {wallet?.kind === 'hardware' ? 'Hardware Wallet' : 'Mobile Wallet'} &middot; $0.00
          </div>
        </div>

        {/* ------------------------------------------- what it resolves to */}
        <div className="wd-group-head">
          <span>Resolves to</span>
          {fullName && (
            <button className="wd-refresh" onClick={() => setTick((n) => n + 1)} aria-label="Refresh">
              <Refresh size={17} />
            </button>
          )}
        </div>

        <div className="wd-card">
          {!fullName && (
            <p className="wd-note wd-note--pad">
              This wallet has no name, so nothing resolves to it yet. Claim one below and every
              network you have turned on gets an address record under it.
            </p>
          )}

          {fullName && read.status === 'loading' && (
            <p className="wd-note wd-note--pad">Reading {fullName} from the registry…</p>
          )}

          {fullName && read.status === 'error' && (
            <p className="wd-note wd-note--pad wd-note--bad">
              {read.message} — this is what the registry said, not a local cache.
            </p>
          )}

          {fullName &&
            read.status === 'ok' &&
            chains.map((chain) => {
              const address = read.status === 'ok' ? read.name.addresses[chain] : undefined
              const spec = CHAIN_BY_KEY[chain]
              return (
                <div className="wd-record" key={chain}>
                  <div className="wd-record-head">
                    <span className="wd-record-net">{spec.network}</span>
                    <span className="wd-record-coin">coin {spec.coin}</span>
                  </div>
                  {address ? (
                    <div className="wd-record-addr">{address}</div>
                  ) : (
                    <div className="wd-record-addr wd-record-addr--missing">
                      No record on the name yet
                    </div>
                  )}
                </div>
              )
            })}
        </div>

        {fullName && (
          <p className="wd-note">
            Read back from the registry through <code>/api/subnames</code>, so this is what the rest
            of the world sees — not what this device believes it wrote.
          </p>
        )}

        {/* ----------------------------------------------------- the rename */}
        <div className="wd-group-head">
          <span>{fullName ? 'Name' : 'Claim a name'}</span>
        </div>

        {fullName ? (
          <>
            <div className="wd-card">
              <div className="wd-field wd-field--locked">
                <span className="wd-field-value">{fullName}</span>
              </div>
            </div>
            <p className="wd-note">
              This name is already issued. Renaming it here would not move anything: the old name
              keeps resolving, anyone who saved it keeps paying it, and a new label is simply a
              second name pointing at the same addresses. Doing it properly means issuing the new
              name, copying every address record, and leaving the old one in place as a forward —
              a migration, not an edit — so this build does not offer it rather than fake it. There
              is no delete either; a name someone may be paying is not something to remove behind
              their back.
            </p>
          </>
        ) : (
          <>
            <div className="wd-card">
              <div className="wd-field">
                <input
                  value={draft}
                  onChange={(event) => setDraft(acceptLabel(event.target.value))}
                  onKeyDown={(event) => {
                    if (event.key === ' ') event.preventDefault()
                  }}
                  maxLength={LABEL_MAX}
                  placeholder={brand.copy.exampleLabel}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Wallet name"
                />
                <span className="wd-field-parent">.{w.parent}</span>
              </div>
            </div>

            {/* The label is ASCII-only, so show the change while it is made
             * rather than mangling the input at submit time. */}
            {label && label !== draft.trim().toLowerCase() && (
              <p className="wd-note">
                Will be claimed as <strong>{fullNameFor(label, w.parent)}</strong>.
              </p>
            )}

            {check.status === 'checking' && <p className="wd-note">Checking…</p>}
            {check.status === 'free' && (
              <p className="wd-note wd-note--good">
                {fullNameFor(check.label, w.parent)} is available.
              </p>
            )}
            {check.status === 'taken' && (
              <p className="wd-note wd-note--bad">
                {fullNameFor(check.label, w.parent)} is already taken.
              </p>
            )}
            {check.status === 'invalid' && <p className="wd-note wd-note--bad">{check.message}</p>}
            {check.status === 'unknown' && (
              <p className="wd-note">
                {check.message} — the mint will still answer if the name is free.
              </p>
            )}
            {claimError && <p className="wd-note wd-note--bad">{claimError}</p>}

            <button className="wd-claim" onClick={claim} disabled={!canClaim}>
              {w.busy ? 'Claiming…' : 'Claim name'}
            </button>

            <p className="wd-note">
              This is a real subname under {w.parent}, written to Ethereum mainnet, covering every
              network this wallet has turned on.
            </p>
          </>
        )}

        {/* ---------------------------------------------------- the delete */}
        {deletable && (
          <>
            <div className="wd-group-head">
              <span>This device</span>
            </div>
            <div className="wd-card">
              <button
                className="wd-delete"
                data-armed={armed}
                onClick={deleteWallet}
                aria-label={armed ? 'Tap again to delete this wallet' : 'Delete this wallet'}
              >
                <span className="wd-delete__icon">
                  <Trash size={19} />
                </span>
                <span className="wd-delete__main">
                  <span className="wd-delete__title">
                    {armed ? 'Tap again to delete' : 'Delete wallet'}
                  </span>
                  <span className="wd-delete__sub">
                    Removes this wallet from this device. Its name is a real subname and stays on
                    the registry.
                  </span>
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- css */

const CSS = `
.wd {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.wd-head {
  flex: none;
  position: relative;
  height: 108px;
  display: flex;
  align-items: flex-end;
  padding: 0 16px 18px;
}

.wd-back {
  width: 42px;
  height: 42px;
  border-radius: var(--r-icon);
  background: var(--bg-elevated);
  color: var(--icon-ink);
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-float);
}
.wd-back:active { opacity: .7; }

.wd-title {
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

.wd-body {
  flex: 1;
  min-height: 0;
  padding: 0 16px 48px;
}

.wd-hero {
  padding: 4px 4px 22px;
}

.wd-hero-name {
  font-size: 24px;
  font-weight: var(--fw-bold);
  letter-spacing: -.02em;
  word-break: break-all;
}

.wd-hero-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-3);
}

.wd-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px 8px;
  font-size: 15px;
  color: var(--text-3);
}

.wd-refresh { color: var(--text-3); display: grid; place-items: center; }
.wd-refresh:active { opacity: .5; }

.wd-card {
  background: var(--bg-card);
  border-radius: var(--r-card);
  overflow: hidden;
}

.wd-record {
  padding: 14px 18px;
}
.wd-record + .wd-record {
  box-shadow: inset 0 var(--divider-w) 0 var(--divider);
}

.wd-record-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.wd-record-net {
  font-size: 15px;
  font-weight: var(--fw-semibold);
}

.wd-record-coin {
  font-size: 12px;
  color: var(--text-3);
}

.wd-record-addr {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  color: var(--text-3);
  word-break: break-all;
}
.wd-record-addr--missing {
  font-family: var(--font);
  color: var(--price-down);
}

.wd-note {
  margin: 10px 6px 20px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--text-3);
}
.wd-note--pad { margin: 0; padding: 16px 18px; }
.wd-note--good { color: var(--accent); }
.wd-note--bad { color: var(--price-down); }
.wd-note code {
  font-family: var(--font-mono);
  font-size: 12px;
}

.wd-field {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 56px;
  padding: 0 18px;
  font-size: 17px;
}
.wd-field input {
  flex: 1;
  min-width: 0;
  font-size: 17px;
  font-weight: var(--fw-semibold);
}
.wd-field input::placeholder { color: var(--text-3); font-weight: var(--fw-regular); }

.wd-field-parent { color: var(--text-3); font-size: 17px; }

.wd-field--locked { color: var(--text-3); }
.wd-field-value {
  font-size: 17px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  word-break: break-all;
}

.wd-claim {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--h-button);
  margin-top: 6px;
  border-radius: var(--r-button);
  background: var(--text-1);
  color: var(--text-on-dark);
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
}
.wd-claim:disabled { opacity: .35; cursor: default; }
.wd-claim:active:not(:disabled) { opacity: .8; }

/* The delete row. Same row language as the rest of the card, red ink. The
 * armed state deepens the tint and stiffens the copy — that is the confirm. */
.wd-delete {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 64px;
  padding: 10px 18px;
  text-align: left;
}

.wd-delete__icon {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  color: var(--danger);
  display: grid;
  place-items: center;
}

.wd-delete__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wd-delete__title {
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--danger);
}

.wd-delete__sub {
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-3);
}

.wd-delete[data-armed="true"] .wd-delete__icon { background: var(--danger); color: #fff; }
.wd-delete[data-armed="true"]:active { opacity: .7; }
`
