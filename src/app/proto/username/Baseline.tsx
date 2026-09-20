'use client'

import { Back, Check, Close, Warning } from '@/wallet/components/Icons'
import { brand } from '@config'
import { Done, SHARED_CSS, useNameClaim, type Status } from './shared'

/** Axis: current product — card field, status row, skip as a checkbox. */
export function Baseline() {
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
    <form className="pnb" onSubmit={f.onFormSubmit}>
      <style>{SHARED_CSS + CSS}</style>
      <button type="button" className="circle-btn pn-back" aria-label="Back">
        <Back size={22} />
      </button>

      <div className="pnb__body scroll">
        <h1 className="title pnb__title">{brand.copy.nameOnboardingTitle}</h1>
        <p className="pnb__lede">{brand.copy.nameOnboardingLede}</p>

        <label className="card pnb__field" data-state={f.status.kind} data-skip={f.skip}>
          <span className="pnb__sr">Wallet name</span>
          <span className="pnb__entry">
            <span className="pnb__sizer" aria-hidden="true">
              {f.raw || brand.copy.exampleLabel}
            </span>
            <input
              id="pnb-name"
              className="pnb__input"
              value={f.raw}
              onChange={(e) => f.setRaw(e.target.value)}
              placeholder={brand.copy.exampleLabel}
              disabled={f.skip}
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
          <span className="pnb__parent" aria-hidden="true">
            .{f.parent}
          </span>
        </label>

        <StatusLine status={f.status} fullName={f.fullName} parent={f.parent} />

        {f.adjusted && (
          <p className="pnb__note">
            Claimed as <strong>{f.label}</strong> — names use lowercase letters, numbers and
            hyphens.
          </p>
        )}
      </div>

      <div className="pnb__foot">
        {f.claimError && (
          <div className="pnb__error" role="alert">
            <Warning size={18} />
            <span>{f.claimError}</span>
          </div>
        )}

        <label className="pnb__skip">
          <input
            type="checkbox"
            checked={f.skip}
            onChange={(e) => f.setSkip(e.target.checked)}
          />
          <span className="pnb__box" aria-hidden="true">
            <Check size={14} />
          </span>
          <span className="pnb__skip-text">
            {brand.copy.continueWithoutName}
            <span className="pnb__skip-sub">{brand.copy.continueWithoutNameSub}</span>
          </span>
        </label>

        <button className="btn btn--primary" type="submit" disabled={f.disabled}>
          {f.busy ? brand.copy.claimingCta : f.skip ? brand.copy.continueCta : brand.copy.claimCta}
        </button>
      </div>
    </form>
  )
}

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
      <p className="pnb__status pnb__status--idle">
        Your name will read {brand.copy.exampleLabel}.{parent}
      </p>
    )
  }
  if (status.kind === 'rejected') {
    return (
      <p className="pnb__status pnb__status--bad">
        <Close size={15} />
        <span>{status.message}</span>
      </p>
    )
  }
  const tone =
    status.kind === 'available' ? 'good' : status.kind === 'taken' ? 'bad' : 'idle'
  return (
    <p className={`pnb__status pnb__status--${tone}`}>
      {status.kind === 'checking' && <span className="pnb__spinner" aria-hidden="true" />}
      {status.kind === 'available' && <Check size={15} />}
      {status.kind === 'taken' && <Close size={15} />}
      <span className="pnb__status-name">{fullName}</span>
      <span className="pnb__status-word">
        {status.kind === 'checking' && 'checking…'}
        {status.kind === 'available' && 'is available'}
        {status.kind === 'taken' && 'is taken'}
      </span>
    </p>
  )
}

const CSS = `
.pnb {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  padding: 60px 0 34px;
}
.pnb__body {
  flex: 1;
  min-height: 0;
  padding: 118px var(--pad-onboard) 0;
}
.pnb__title { text-align: center; color: var(--text-1); text-wrap: balance; }
.pnb__lede {
  margin: 10px auto 0;
  max-width: 320px;
  text-align: center;
  font-size: var(--fs-sub);
  color: var(--text-2);
  line-height: var(--lh-body);
  text-wrap: pretty;
}
.pnb__field {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 32px;
  min-height: 56px;
  padding: 0 var(--pad-row);
  cursor: text;
  transition: box-shadow .18s ease, opacity .18s ease;
}
.pnb__field[data-state="available"] { box-shadow: inset 0 0 0 1.5px var(--accent); }
.pnb__field[data-state="taken"],
.pnb__field[data-state="rejected"] { box-shadow: inset 0 0 0 1.5px var(--price-down); }
.pnb__field[data-skip="true"] { opacity: .4; pointer-events: none; }
.pnb__sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
.pnb__input {
  width: 100%;
  min-width: 0;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  letter-spacing: -0.01em;
  color: var(--text-1);
  field-sizing: content;
}
.pnb__input::placeholder { color: var(--text-3); font-weight: var(--fw-regular); }
.pnb__input:focus-visible { outline: none; }
.pnb__entry { display: inline-grid; max-width: 220px; }
.pnb__entry > * { grid-area: 1 / 1; }
.pnb__sizer {
  visibility: hidden;
  white-space: pre;
  pointer-events: none;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  letter-spacing: -0.01em;
}
.pnb__parent {
  flex: none;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  letter-spacing: -0.01em;
  color: var(--text-3);
  pointer-events: none;
}
.pnb__status {
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
.pnb__status--idle { color: var(--text-3); }
.pnb__status--good { color: var(--accent); }
.pnb__status--bad { color: var(--price-down); }
.pnb__status-name {
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  word-break: break-all;
}
.pnb__status--idle .pnb__status-name { color: var(--text-2); }
.pnb__spinner {
  width: 13px; height: 13px; flex: none;
  border-radius: 999px;
  border: 1.6px solid var(--track-off);
  border-top-color: var(--text-2);
  animation: pnb-spin .7s linear infinite;
}
@keyframes pnb-spin { to { transform: rotate(360deg) } }
.pnb__note {
  margin-top: 10px;
  text-align: center;
  font-size: var(--fs-sub);
  color: var(--text-2);
  line-height: var(--lh-body);
}
.pnb__note strong { font-weight: var(--fw-semibold); color: var(--text-1); }
.pnb__foot {
  flex: none;
  padding: 0 var(--pad-onboard);
  display: flex;
  flex-direction: column;
  gap: var(--gap-row);
}
.pnb__error {
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
.pnb__error svg { flex: none; margin-top: 1px; }
.pnb__skip {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 2px 8px;
  cursor: pointer;
}
.pnb__skip input { position: absolute; opacity: 0; width: 0; height: 0; }
.pnb__box {
  flex: none;
  width: 22px; height: 22px;
  margin-top: 1px;
  border-radius: 7px;
  box-shadow: inset 0 0 0 1.5px var(--track-off);
  color: transparent;
  display: grid;
  place-items: center;
  transition: background .15s ease, box-shadow .15s ease;
}
.pnb__skip input:checked + .pnb__box {
  background: var(--text-1);
  box-shadow: inset 0 0 0 1.5px var(--text-1);
  color: var(--text-on-dark);
}
.pnb__skip input:focus-visible + .pnb__box {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset);
}
.pnb__skip-text {
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  line-height: 1.3;
}
.pnb__skip-sub {
  display: block;
  margin-top: 2px;
  font-size: var(--fs-sub);
  font-weight: var(--fw-regular);
  color: var(--text-3);
}
`
