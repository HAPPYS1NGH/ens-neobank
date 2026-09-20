'use client'

import { Back, Check, Close, Warning } from '@/wallet/components/Icons'
import { brand } from '@config'
import { Done, PARENT, SHARED_CSS, TAKEN, useNameClaim } from './shared'

const CHIPS: { raw: string; caption: string }[] = [
  { raw: 'happy', caption: 'taken' },
  { raw: 'alex', caption: 'free' },
  { raw: 'Harpreet S', caption: 'spaces → hyphens' },
  { raw: 'supercalifragilistic', caption: '20-char max' },
  { raw: 'xx', caption: 'too short' },
]

/** Axis: pick or type — chips seed the field; skip is a text action. */
export function Suggest() {
  const f = useNameClaim()

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

  return (
    <form className="pns" onSubmit={f.onFormSubmit}>
      <style>{SHARED_CSS + CSS}</style>
      <button type="button" className="circle-btn pn-back" aria-label="Back">
        <Back size={22} />
      </button>

      <div className="pns__body scroll">
        <h1 className="title pns__title">Pick a name</h1>
        <p className="pns__lede">
          People send to <strong>you.{PARENT}</strong> instead of a hex address. Tap a suggestion
          or type your own.
        </p>

        <div
          className="card pns__field"
          data-state={f.status.kind}
          onClick={(e) => {
            const input = (e.currentTarget as HTMLElement).querySelector('input')
            input?.focus()
          }}
        >
          <label htmlFor="pns-name" className="pns__sr">
            Wallet name
          </label>
          <span className="pns__entry">
            <span className="pns__sizer" aria-hidden="true">
              {f.raw || brand.copy.exampleLabel}
            </span>
            <input
              id="pns-name"
              className="pns__input"
              value={f.raw}
              onChange={(e) => f.setRaw(e.target.value)}
              placeholder={brand.copy.exampleLabel}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={32}
              size={1}
              data-1p-ignore
              data-lpignore="true"
              aria-describedby="pns-status"
            />
          </span>
          <span className="pns__suffix" aria-hidden="true">
            .{f.parent}
          </span>
        </div>

        <p id="pns-status" className="pns__status" data-kind={f.status.kind} role="status">
          {f.status.kind === 'empty' && `Try a chip, or type at least 3 characters.`}
          {f.status.kind === 'checking' && (
            <>
              <span className="pns__spinner" aria-hidden="true" />
              Checking {f.fullName}…
            </>
          )}
          {f.status.kind === 'available' && (
            <>
              <Check size={15} />
              {f.fullName} is free
            </>
          )}
          {f.status.kind === 'taken' && (
            <>
              <Close size={15} />
              {f.fullName} is taken
            </>
          )}
          {f.status.kind === 'rejected' && (
            <>
              <Close size={15} />
              {f.status.message}
            </>
          )}
        </p>

        {f.adjusted && (
          <p className="pns__note">
            Claimed as <strong>{f.label}</strong>
          </p>
        )}

        <p className="pns__chips-label">Suggestions</p>
        <div className="pns__chips">
          {CHIPS.map((chip) => {
            const active = f.raw === chip.raw
            const taken = TAKEN.has(chip.raw.toLowerCase())
            return (
              <button
                key={chip.raw}
                type="button"
                className="pns__chip"
                data-active={active || undefined}
                data-taken={taken || undefined}
                onClick={() => f.setRaw(chip.raw)}
              >
                <span className="pns__chip-name">{chip.raw}</span>
                <span className="pns__chip-cap">{chip.caption}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="pns__foot">
        {f.claimError && (
          <div className="pns__error" role="alert">
            <Warning size={18} />
            <span>{f.claimError}</span>
          </div>
        )}
        <button className="btn btn--primary" type="submit" disabled={f.disabled}>
          {f.busy ? brand.copy.claimingCta : brand.copy.claimCta}
        </button>
        <button type="button" className="pns__skip" onClick={f.skipNow}>
          {brand.copy.continueWithoutName}
        </button>
      </div>
    </form>
  )
}

const CSS = `
.pns {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  padding: 60px 0 34px;
}
.pns__body {
  flex: 1;
  min-height: 0;
  padding: 100px var(--pad-onboard) 12px;
}
.pns__title { text-align: center; color: var(--text-1); text-wrap: balance; }
.pns__lede {
  margin: 10px auto 0;
  max-width: 340px;
  text-align: center;
  font-size: var(--fs-sub);
  color: var(--text-2);
  line-height: var(--lh-body);
  text-wrap: pretty;
}
.pns__lede strong { font-weight: var(--fw-semibold); color: var(--text-1); }
.pns__sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
.pns__field {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 28px;
  min-height: 56px;
  padding: 0 16px;
  cursor: text;
  transition: box-shadow .18s ease;
}
.pns__field[data-state="available"] { box-shadow: inset 0 0 0 1.5px var(--accent); }
.pns__field[data-state="taken"],
.pns__field[data-state="rejected"] { box-shadow: inset 0 0 0 1.5px var(--price-down); }
.pns__input {
  width: 100%;
  min-width: 0;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  letter-spacing: -0.01em;
  color: var(--text-1);
  field-sizing: content;
}
.pns__input::placeholder { color: var(--text-3); font-weight: var(--fw-regular); }
.pns__input:focus-visible { outline: none; }
.pns__entry { display: inline-grid; max-width: 220px; }
.pns__entry > * { grid-area: 1 / 1; }
.pns__sizer {
  visibility: hidden;
  white-space: pre;
  pointer-events: none;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  letter-spacing: -0.01em;
}
.pns__suffix {
  flex: none;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  letter-spacing: -0.01em;
  color: var(--text-3);
  pointer-events: none;
}
.pns__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  min-height: 20px;
  font-size: var(--fs-sub);
  color: var(--text-3);
  text-align: center;
}
.pns__status[data-kind="available"] { color: var(--accent); }
.pns__status[data-kind="taken"],
.pns__status[data-kind="rejected"] { color: var(--price-down); }
.pns__spinner {
  width: 13px; height: 13px; flex: none;
  border-radius: 999px;
  border: 1.6px solid var(--track-off);
  border-top-color: var(--text-2);
  animation: pns-spin .7s linear infinite;
}
@keyframes pns-spin { to { transform: rotate(360deg) } }
.pns__note {
  margin-top: 8px;
  text-align: center;
  font-size: var(--fs-sub);
  color: var(--text-2);
}
.pns__note strong { color: var(--text-1); font-weight: var(--fw-semibold); }
.pns__chips-label {
  margin: 28px 2px 10px;
  font-size: 11px;
  font-weight: var(--fw-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
}
.pns__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pns__chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 44px;
  padding: 8px 12px;
  border: 0;
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  text-align: start;
  font: inherit;
  transition: background 150ms ease, box-shadow 150ms ease, transform 150ms cubic-bezier(0.32, 0.72, 0, 1);
}
.pns__chip:active { transform: scale(0.96); }
.pns__chip[data-active] {
  box-shadow: inset 0 0 0 1.5px var(--text-1);
}
.pns__chip:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset);
}
.pns__chip-name {
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  overflow-wrap: anywhere;
}
.pns__chip-cap {
  font-size: 11px;
  color: var(--text-3);
}
.pns__chip[data-taken] .pns__chip-cap { color: var(--price-down); }
.pns__foot {
  flex: none;
  padding: 0 var(--pad-onboard);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pns__error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  margin-bottom: 8px;
  border-radius: 16px;
  background: var(--bg-subtle);
  color: var(--price-down);
  font-size: var(--fs-sub);
}
.pns__skip {
  min-height: 44px;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--text-2);
  cursor: pointer;
}
.pns__skip:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset);
  border-radius: 8px;
}
@media (hover: hover) and (pointer: fine) {
  .pns__skip:hover { color: var(--text-1); }
  .pns__chip:hover { background: var(--bg-elevated); }
}
@media (prefers-reduced-motion: no-preference) {
  .pns__title,
  .pns__lede,
  .pns__field,
  .pns__chip {
    animation: pns-in 200ms cubic-bezier(0.32, 0.72, 0, 1) both;
  }
  .pns__lede { animation-delay: 40ms; }
  .pns__field { animation-delay: 70ms; }
  .pns__chip:nth-child(1) { animation-delay: 100ms; }
  .pns__chip:nth-child(2) { animation-delay: 130ms; }
  .pns__chip:nth-child(3) { animation-delay: 160ms; }
  .pns__chip:nth-child(4) { animation-delay: 190ms; }
  .pns__chip:nth-child(5) { animation-delay: 220ms; }
}
@keyframes pns-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .pns__spinner { animation: none; }
}
`
