'use client'

/**
 * Screen 2 — Name your wallet. The claim, and the whole argument of the demo.
 *
 * There is no screenshot for this one. It is built out of the pieces IMG_4295
 * already establishes: the 26/700 centred title, the 12/400 grey line under it,
 * a white card field (the same object Send and Address book use), and the same
 * 46pt button stack pinned to the bottom. Tangem has always had a wallet-name
 * field; this is that field, with a registry behind it.
 *
 * Three things earn their complexity here:
 *
 *  1. **The label is shown, not applied silently.** Labels are ASCII
 *     (src/server/validation.ts) so "Harpreet S" becomes "harpreet-s". The
 *     field keeps what was typed and the line beneath it states what will
 *     actually be claimed — the user sees the change before committing to it.
 *  2. **Availability is checked live, debounced.** `api.checkAvailability`
 *     already un-inverts the registry's 404-means-free behaviour (verified
 *     against src/app/api/subnames/availability/route.ts), so `available`
 *     means available. Nothing in this file re-inverts it.
 *  3. **Failures are visible.** No API key is a 503 on the very first run of a
 *     fresh clone, so the check falling over must leave a usable screen: it
 *     says what happened and still lets the user try, because the mint is the
 *     only authority anyway.
 *
 * The asymmetry SPEC.md asks for: an empty field cannot be submitted, but
 * ticking one box can. Skipping stays possible and stays deliberate.
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Back, Check, Close, Warning } from '../components/Icons'
import { ApiError } from '../api'
import { brand } from '@config'
import { useWallet } from '../store'
import { labelPreviewIssue, normalizeLabelPreview } from '@/lib/format'

/* --------------------------------------------------------------- status */

type Status =
  | { kind: 'empty' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'taken' }
  /** The server rejected the label itself — too short, reserved, bad chars. */
  | { kind: 'rejected'; message: string }
  /** We could not find out. Not the same as "taken", and never shown as one. */
  | { kind: 'unknown'; message: string }

/** How long after the last keystroke we ask the registry. */
const DEBOUNCE_MS = 400

/* ---------------------------------------------------------------- screen */

export interface NameWalletProps {
  /**
   * `onboarding` — the first wallet, Continue lands on the claim confirmation.
   * `addWallet` — a wallet just added from Details; same step, said differently
   *   because the user already has a named wallet and needs to know this is a
   *   second, separate one rather than a rename of the first.
   * `rename` — Details → a wallet with no name; Back returns where it came from.
   */
  purpose?: 'onboarding' | 'addWallet' | 'rename'
  /**
   * Which wallet is being named. Passed through to the claim so it lands on
   * this row even if the active wallet changed underneath the screen.
   */
  walletId?: string
}

export function NameWallet({ purpose = 'onboarding', walletId }: NameWalletProps) {
  const w = useWallet()

  const [raw, setRaw] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'empty' })
  const [skip, setSkip] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  const label = normalizeLabelPreview(raw)
  const fullName = label ? `${label}.${w.parent}` : ''
  // What was typed, minus case and edge whitespace. If normalization changed
  // anything beyond that, the user needs to be told.
  const typed = raw.trim().toLowerCase()
  const adjusted = label.length > 0 && label !== typed

  /* --------------------------- live availability --------------------------- */

  // Every check carries a sequence number; a stale response is dropped rather
  // than allowed to overwrite the answer for a newer label.
  const seq = useRef(0)

  useEffect(() => {
    setClaimError(null)
    if (!label) {
      seq.current += 1
      setStatus({ kind: 'empty' })
      return
    }

    const issue = labelPreviewIssue(label)
    if (issue) {
      seq.current += 1
      setStatus({ kind: 'rejected', message: issue })
      return
    }

    setStatus({ kind: 'checking' })
    const mine = ++seq.current
    const timer = window.setTimeout(() => {
      w.checkName(label)
        .then((result) => {
          if (seq.current !== mine) return
          setStatus(result.available ? { kind: 'available' } : { kind: 'taken' })
        })
        .catch((error: unknown) => {
          if (seq.current !== mine) return
          if (error instanceof ApiError && error.status === 400) {
            // A coded 400 is a judgement about the label, written for the user.
            setStatus({ kind: 'rejected', message: error.message })
            return
          }
          setStatus({
            kind: 'unknown',
            message:
              error instanceof Error ? error.message : 'Could not check this name right now',
          })
        })
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
    // `w.checkName` is stable per render of the provider; the label is what
    // actually drives a new lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label])

  /* -------------------------------- claim --------------------------------- */

  // Enabled on `unknown` too: if the availability route is down or unconfigured
  // the mint is the only thing that can answer, and a permanently dead button
  // is a worse failure than a request that comes back with a real error.
  const canClaim =
    !skip && label.length > 0 && (status.kind === 'available' || status.kind === 'unknown')

  const submit = useCallback(async () => {
    if (skip) {
      w.skipName()
      return
    }
    if (!canClaim || w.busy) return

    setClaimError(null)
    const result = await w.claimName(label, walletId)
    if (result.ok) {
      w.go({ name: 'nameClaimed' })
      return
    }

    setClaimError(result.error)
    // The name may have gone between the check and the submit, so re-ask
    // rather than leaving a stale green tick sitting over a red error.
    const mine = ++seq.current
    setStatus({ kind: 'checking' })
    w.checkName(label)
      .then((r) => {
        if (seq.current === mine) setStatus(r.available ? { kind: 'available' } : { kind: 'taken' })
      })
      .catch(() => {
        if (seq.current === mine) {
          setStatus({ kind: 'unknown', message: 'Could not re-check this name' })
        }
      })
  }, [canClaim, label, skip, w, walletId])

  const disabled = skip ? false : !canClaim || w.busy

  /* --------------------------------- view --------------------------------- */

  const title =
    purpose === 'onboarding'
      ? brand.copy.nameOnboardingTitle
      : purpose === 'addWallet'
        ? brand.copy.nameAddWalletTitle
        : brand.copy.nameRenameTitle
  const lede =
    purpose === 'addWallet' ? brand.copy.nameAddWalletLede : brand.copy.nameOnboardingLede

  const onFormSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (disabled) return
    void submit()
  }

  return (
    <form className="tgn" onSubmit={onFormSubmit}>
      <style>{NAME_WALLET_CSS}</style>

      <button type="button" className="circle-btn tgn__back" onClick={w.back} aria-label="Back">
        <Back size={22} />
      </button>

      <div className="tgn__body scroll">
        <h1 className="title tgn__title">{title}</h1>
        <p className="tgn__lede">{lede}</p>

        <label className="card tgn__field" data-state={status.kind} data-skip={skip}>
          <span className="tgn__sr">Wallet name</span>
          <span className="tgn__entry">
            <span className="tgn__sizer" aria-hidden="true">
              {raw || brand.copy.exampleLabel}
            </span>
            <input
              id="wallet-name"
              className="tgn__input"
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              placeholder={brand.copy.exampleLabel}
              disabled={skip}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={32}
              size={1}
              data-1p-ignore
              data-lpignore="true"
            />
          </span>
          <span className="tgn__parent" aria-hidden="true">
            .{w.parent}
          </span>
        </label>

        <StatusLine status={status} fullName={fullName} parent={w.parent} />

        {adjusted && (
          <p className="tgn__note">
            Claimed as <strong>{label}</strong> — names use lowercase letters, numbers and
            hyphens.
          </p>
        )}
      </div>

      <div className="tgn__foot">
        {claimError && (
          <div className="tgn__error" role="alert">
            <Warning size={18} />
            <span>{claimError}</span>
          </div>
        )}

        <label className="tgn__skip">
          <input
            type="checkbox"
            checked={skip}
            onChange={(event) => setSkip(event.target.checked)}
          />
          <span className="tgn__box" aria-hidden="true">
            <Check size={14} />
          </span>
          <span className="tgn__skip-text">
            {brand.copy.continueWithoutName}
            <span className="tgn__skip-sub">{brand.copy.continueWithoutNameSub}</span>
          </span>
        </label>

        <button className="btn btn--primary" type="submit" disabled={disabled}>
          {w.busy ? brand.copy.claimingCta : skip ? brand.copy.continueCta : brand.copy.claimCta}
        </button>
      </div>
    </form>
  )
}

/* ----------------------------------------------------------- status line */

/**
 * The authoritative line: the exact name that will exist, and what we know
 * about it. It is deliberately one row so the screen does not jump as the
 * state changes while someone is typing.
 */
function StatusLine({
  status,
  fullName,
  parent,
}: {
  status: Status
  fullName: string
  parent: string
}) {
  if (status.kind === 'empty') {
    return (
      <p className="tgn__status tgn__status--idle">
        Your name will read {brand.copy.exampleLabel}.{parent}
      </p>
    )
  }

  if (status.kind === 'rejected') {
    return (
      <p className="tgn__status tgn__status--bad">
        <Close size={15} />
        <span>{status.message}</span>
      </p>
    )
  }

  const tone =
    status.kind === 'available' ? 'good' : status.kind === 'taken' ? 'bad' : 'idle'

  return (
    <p className={`tgn__status tgn__status--${tone}`}>
      {status.kind === 'checking' && <span className="tgn__spinner" aria-hidden="true" />}
      {status.kind === 'available' && <Check size={15} />}
      {status.kind === 'taken' && <Close size={15} />}
      <span className="tgn__status-name">{fullName}</span>
      <span className="tgn__status-word">
        {status.kind === 'checking' && 'checking…'}
        {status.kind === 'available' && 'is available'}
        {status.kind === 'taken' && 'is taken'}
        {status.kind === 'unknown' && status.message}
      </span>
    </p>
  )
}

/* ------------------------------------------------------------------- css */

const NAME_WALLET_CSS = `
.tgn {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  padding: 60px 0 34px;
}

.tgn__back {
  position: absolute;
  top: 62px;
  left: 16px;
  width: 44px;
  height: 44px;
  z-index: 5;
}

.tgn__body {
  flex: 1;
  min-height: 0;
  padding: 118px var(--pad-onboard) 0;
}

.tgn__title { text-align: center; color: var(--text-1); }

.tgn__lede {
  margin: 10px auto 0;
  max-width: 320px;
  text-align: center;
  font-size: var(--fs-sub);
  color: var(--text-2);
  line-height: var(--lh-body);
}

/* Same object as Send's recipient field and Address book's contact field:
   a white card, 56px tall, 16px type. The parent sits inside the card as a
   suffix overlay so the hit area is the whole row, not just the typed label. */
.tgn__field {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 32px;
  min-height: 56px;
  padding: 0 var(--pad-row);
  cursor: text;
  transition: box-shadow .18s ease, opacity .18s ease;
}

.tgn__field[data-state="available"] { box-shadow: inset 0 0 0 1.5px var(--accent); }
.tgn__field[data-state="taken"],
.tgn__field[data-state="rejected"] { box-shadow: inset 0 0 0 1.5px var(--price-down); }
.tgn__field[data-skip="true"] { opacity: .4; pointer-events: none; }

.tgn__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.tgn__input {
  width: 100%;
  min-width: 0;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  letter-spacing: -0.01em;
  color: var(--text-1);
  field-sizing: content;
}

.tgn__input::placeholder {
  color: var(--text-3);
  font-weight: var(--fw-regular);
}

.tgn__entry {
  display: inline-grid;
  max-width: 220px;
}
.tgn__entry > * { grid-area: 1 / 1; }

.tgn__sizer {
  visibility: hidden;
  white-space: pre;
  pointer-events: none;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  letter-spacing: -0.01em;
}

.tgn__parent {
  flex: none;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  letter-spacing: -0.01em;
  color: var(--text-3);
  pointer-events: none;
}

/* Status ------------------------------------------------------------------ */

.tgn__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
  min-height: 20px;
  font-size: var(--fs-sub);
  line-height: 1.3;
  text-align: center;
}

.tgn__status--idle { color: var(--text-3); }
.tgn__status--good { color: var(--accent); }
.tgn__status--bad { color: var(--price-down); }

.tgn__status-name {
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  word-break: break-all;
}

.tgn__status--idle .tgn__status-name { color: var(--text-2); }

.tgn__spinner {
  width: 13px;
  height: 13px;
  flex: none;
  border-radius: 999px;
  border: 1.6px solid var(--track-off);
  border-top-color: var(--text-2);
  animation: tgn-spin .7s linear infinite;
}

@keyframes tgn-spin { to { transform: rotate(360deg) } }

.tgn__note {
  margin-top: 10px;
  text-align: center;
  font-size: var(--fs-sub);
  color: var(--text-2);
  line-height: var(--lh-body);
}

.tgn__note strong { font-weight: var(--fw-semibold); color: var(--text-1); }

/* Foot -------------------------------------------------------------------- */

.tgn__foot {
  flex: none;
  padding: 0 var(--pad-onboard);
  display: flex;
  flex-direction: column;
  gap: var(--gap-row);
}

.tgn__error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  margin-bottom: 4px;
  border-radius: 16px;
  background: var(--bg-subtle);
  color: var(--price-down);
  font-size: var(--fs-sub);
  line-height: var(--lh-body);
}

.tgn__error svg { flex: none; margin-top: 1px; }

/* The opt-out. A blank field is far more often someone skipping past the step
   than someone declining it, so declining takes one deliberate tick. */
.tgn__skip {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 2px 8px;
  cursor: pointer;
}

.tgn__skip input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.tgn__box {
  flex: none;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border-radius: 7px;
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--track-off);
  color: transparent;
  display: grid;
  place-items: center;
  transition: background .15s ease, box-shadow .15s ease;
}

.tgn__skip input:checked + .tgn__box {
  background: var(--text-1);
  box-shadow: inset 0 0 0 1.5px var(--text-1);
  color: var(--text-on-dark);
}

.tgn__skip-text {
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  line-height: 1.3;
}

.tgn__skip-sub {
  display: block;
  margin-top: 2px;
  font-size: var(--fs-sub);
  font-weight: var(--fw-regular);
  color: var(--text-3);
}
`

export default NameWallet
