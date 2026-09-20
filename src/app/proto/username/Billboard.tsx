'use client'

import { useRef } from 'react'
import { Back, Check, Close, Warning } from '@/wallet/components/Icons'
import { brand } from '@config'
import { Done, SHARED_CSS, useNameClaim } from './shared'

/** Axis: identity-first — the name is the screen, not a form field with a suffix. */
export function Billboard() {
  const f = useNameClaim()
  const inputRef = useRef<HTMLInputElement>(null)

  if (f.phase === 'claimed') {
    return (
      <>
        <style>{SHARED_CSS}</style>
        <Done kind="claimed" name={f.fullName} onBack={f.reset}>
          {brand.copy.claimedLedeBare}
        </Done>
      </>
    )
  }
  if (f.phase === 'skipped') {
    return (
      <>
        <style>{SHARED_CSS}</style>
        <Done kind="skipped" onBack={f.reset}>
          You can add one later from Details → Wallets. Home will keep offering the claim.
        </Done>
      </>
    )
  }

  const word =
    f.status.kind === 'empty'
      ? 'Type a name people can send to'
      : f.status.kind === 'checking'
        ? 'Checking the registry…'
        : f.status.kind === 'available'
          ? 'Available — this becomes how you get paid'
          : f.status.kind === 'taken'
            ? 'Taken. Pick another label.'
            : f.status.message

  return (
    <form className="pnh" onSubmit={f.onFormSubmit}>
      <style>{SHARED_CSS + CSS}</style>
      <button type="button" className="circle-btn pn-back" aria-label="Back">
        <Back size={22} />
      </button>

      <div className="pnh__body">
        <p className="pnh__kicker">Your wallet name</p>
        <div className="pnh__hero" onClick={() => inputRef.current?.focus()}>
          <label htmlFor="pnh-name" className="pnh__sr">
            Wallet name
          </label>
          <input
            ref={inputRef}
            id="pnh-name"
            className="pnh__input"
            value={f.raw}
            onChange={(e) => f.setRaw(e.target.value)}
            placeholder={brand.copy.exampleLabel}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={32}
            data-1p-ignore
            data-lpignore="true"
            aria-describedby="pnh-status"
          />
          <p className="pnh__parent">.{f.parent}</p>
        </div>

        <p id="pnh-status" className="pnh__status" data-kind={f.status.kind} role="status">
          {f.status.kind === 'checking' && <span className="pnh__spinner" aria-hidden="true" />}
          {f.status.kind === 'available' && <Check size={15} />}
          {(f.status.kind === 'taken' || f.status.kind === 'rejected') && <Close size={15} />}
          <span>{word}</span>
        </p>

        {f.adjusted && (
          <p className="pnh__note">
            Claimed as <strong>{f.label}</strong> — names use lowercase letters, numbers and
            hyphens.
          </p>
        )}
      </div>

      <div className="pnh__foot">
        {f.claimError && (
          <div className="pnh__error" role="alert">
            <Warning size={18} />
            <span>{f.claimError}</span>
          </div>
        )}
        <button className="btn btn--primary" type="submit" disabled={f.disabled}>
          {f.busy ? brand.copy.claimingCta : brand.copy.claimCta}
        </button>
        <button type="button" className="pnh__skip" onClick={f.skipNow}>
          {brand.copy.continueWithoutName}
        </button>
      </div>
    </form>
  )
}

const CSS = `
.pnh {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  padding: 60px 0 34px;
}
.pnh__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 28px 24px;
}
.pnh__kicker {
  font-size: 11px;
  font-weight: var(--fw-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 12px;
}
.pnh__sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
.pnh__hero { display: block; cursor: text; }
.pnh__label-row { display: block; }
.pnh__input {
  display: block;
  width: 100%;
  font-size: 40px;
  font-weight: var(--fw-bold);
  letter-spacing: -0.04em;
  line-height: 1.05;
  color: var(--text-1);
  background: transparent;
  caret-color: var(--accent);
}
.pnh__input::placeholder { color: var(--text-3); font-weight: var(--fw-bold); }
.pnh__input:focus-visible {
  outline: none;
}
.pnh__hero:focus-within .pnh__input {
  /* caret is the focus; no ring on 40px type */
}
.pnh__parent {
  display: block;
  margin-top: 4px;
  font-size: var(--fs-heading);
  font-weight: var(--fw-semibold);
  letter-spacing: -0.02em;
  color: var(--text-3);
  overflow-wrap: anywhere;
}
.pnh__status {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 22px;
  margin-top: 22px;
  font-size: var(--fs-label);
  line-height: 1.35;
  color: var(--text-2);
}
.pnh__status[data-kind="available"] { color: var(--accent); }
.pnh__status[data-kind="taken"],
.pnh__status[data-kind="rejected"] { color: var(--price-down); }
.pnh__spinner {
  width: 13px; height: 13px; flex: none;
  border-radius: 999px;
  border: 1.6px solid var(--track-off);
  border-top-color: var(--text-2);
  animation: pnh-spin .7s linear infinite;
}
@keyframes pnh-spin { to { transform: rotate(360deg) } }
.pnh__note {
  margin-top: 10px;
  font-size: var(--fs-sub);
  color: var(--text-2);
  line-height: var(--lh-body);
}
.pnh__note strong { font-weight: var(--fw-semibold); color: var(--text-1); }
.pnh__foot {
  flex: none;
  padding: 0 var(--pad-onboard);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pnh__error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  margin-bottom: 8px;
  border-radius: 16px;
  background: var(--bg-subtle);
  color: var(--price-down);
  font-size: var(--fs-sub);
  line-height: var(--lh-body);
}
.pnh__skip {
  min-height: 44px;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--text-2);
  cursor: pointer;
}
.pnh__skip:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset);
  border-radius: 8px;
}
@media (hover: hover) and (pointer: fine) {
  .pnh__skip:hover { color: var(--text-1); }
}
@media (prefers-reduced-motion: no-preference) {
  .pnh__kicker,
  .pnh__status {
    animation: pnh-in 240ms cubic-bezier(0.32, 0.72, 0, 1) both;
  }
  .pnh__status { animation-delay: 60ms; }
}
@keyframes pnh-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`
