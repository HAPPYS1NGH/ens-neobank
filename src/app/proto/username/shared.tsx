'use client'

/**
 * Throwaway proto helpers. Billboard name field + local profile (avatar / name / X).
 * Availability is mocked — flipping variants never hits the registry.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Back, Check, Close, Plus, XLogo } from '@/wallet/components/Icons'
import { registry } from '@config'
import { labelPreviewIssue, normalizeLabelPreview } from '@/lib/format'

export const PARENT = registry.productionParent
export const TAKEN = new Set(['happy', 'wallet', 'vitalik', 'admin'])

export type Status =
  | { kind: 'empty' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'taken' }
  | { kind: 'rejected'; message: string }

export type Phase = 'form' | 'claiming' | 'profile' | 'skipped' | 'done'

export type ClaimApi = ReturnType<typeof useNameClaim>

function readDurationMs() {
  const el = document.querySelector('.proto-tune')
  if (!el) return 900
  const raw = getComputedStyle(el).getPropertyValue('--duration').trim()
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : 900
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useNameClaim() {
  const [raw, setRaw] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'empty' })
  const [phase, setPhase] = useState<Phase>('form')
  const [claimError, setClaimError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [xHandle, setXHandle] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const seq = useRef(0)
  const avatarUrlRef = useRef<string | null>(null)

  const label = normalizeLabelPreview(raw)
  const fullName = label ? `${label}.${PARENT}` : ''
  const typed = raw.trim().toLowerCase()
  const adjusted = label.length > 0 && label !== typed

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
      if (seq.current !== mine) return
      setStatus(TAKEN.has(label) ? { kind: 'taken' } : { kind: 'available' })
    }, 380)
    return () => window.clearTimeout(timer)
  }, [label])

  useEffect(
    () => () => {
      if (avatarUrlRef.current) URL.revokeObjectURL(avatarUrlRef.current)
    },
    [],
  )

  const canClaim = label.length > 0 && status.kind === 'available'

  const submit = useCallback(() => {
    if (!canClaim || phase === 'claiming') return
    setClaimError(null)
    setPhase('claiming')
    const wait = reducedMotion() ? 0 : readDurationMs()
    window.setTimeout(() => {
      if (TAKEN.has(label)) {
        setPhase('form')
        setClaimError('That name was just taken. Try another.')
        setStatus({ kind: 'taken' })
        return
      }
      setPhase('profile')
    }, wait)
  }, [canClaim, label, phase])

  const skipNow = useCallback(() => setPhase('skipped'), [])
  const finish = useCallback(() => setPhase('done'), [])

  const reset = useCallback(() => {
    setPhase('form')
    setClaimError(null)
  }, [])

  const onFormSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canClaim || phase === 'claiming') return
    submit()
  }

  const onAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (avatarUrlRef.current) URL.revokeObjectURL(avatarUrlRef.current)
    const url = URL.createObjectURL(file)
    avatarUrlRef.current = url
    setAvatarUrl(url)
  }

  const xClean = xHandle.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '')

  return {
    raw,
    setRaw,
    status,
    phase,
    claimError,
    label,
    fullName,
    adjusted,
    canClaim,
    submit,
    onFormSubmit,
    skipNow,
    finish,
    reset,
    busy: phase === 'claiming',
    disabled: !canClaim || phase === 'claiming',
    parent: PARENT,
    displayName,
    setDisplayName,
    xHandle,
    setXHandle,
    xClean,
    avatarUrl,
    onAvatar,
    initial: (label[0] ?? '?').toUpperCase(),
  }
}

/* ----------------------------------------------------------- billboard form */

export function BillboardForm({ f }: { f: ClaimApi }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const error =
    f.status.kind === 'taken'
      ? 'Taken'
      : f.status.kind === 'rejected'
        ? f.status.message
        : f.claimError

  const live =
    f.status.kind === 'checking'
      ? 'Checking availability'
      : f.status.kind === 'available'
        ? `${f.fullName} is available`
        : f.status.kind === 'taken'
          ? `${f.fullName} is taken`
          : ''

  return (
    <form className="pnh" onSubmit={f.onFormSubmit}>
      <style>{BILLBOARD_CSS}</style>
      <button type="button" className="circle-btn pn-back" aria-label="Back">
        <Back size={22} />
      </button>

      <div className="pnh__body">
        <div className="pnh__hero" data-state={f.status.kind} onClick={() => inputRef.current?.focus()}>
          <label htmlFor="pnh-name" className="pnh__sr">
            Username
          </label>
          <input
            ref={inputRef}
            id="pnh-name"
            className="pnh__input"
            value={f.raw}
            onChange={(e) => f.setRaw(e.target.value)}
            placeholder="alex"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={32}
            data-1p-ignore
            data-lpignore="true"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby="pnh-live"
          />
          <p className="pnh__parent">
            <span>.{f.parent}</span>
            <span className="pnh__glyph" aria-hidden="true">
              {f.status.kind === 'checking' && <span className="pnh__dot" />}
              {f.status.kind === 'available' && <Check size={14} />}
              {f.status.kind === 'taken' && <Close size={14} />}
            </span>
          </p>
        </div>

        <p id="pnh-live" className="pnh__sr" aria-live="polite">
          {live}
        </p>

        {error && (
          <p className="pnh__err" role="alert">
            {error}
          </p>
        )}
        {f.adjusted && !error && <p className="pnh__note">as {f.label}</p>}
      </div>

      <div className="pnh__foot">
        <button className="btn btn--primary" type="submit" disabled={f.disabled}>
          Claim
        </button>
        <button type="button" className="pnh__skip" onClick={f.skipNow}>
          Skip for now
        </button>
      </div>
    </form>
  )
}

/* ----------------------------------------------------------- profile fields */

export function ProfileFields({ f }: { f: ClaimApi }) {
  return (
    <div className="pn-fields">
      <label className="pn-field">
        <span className="pn-field__lab">Name</span>
        <input
          className="pn-field__in"
          value={f.displayName}
          onChange={(e) => f.setDisplayName(e.target.value)}
          placeholder="Harpreet Singh"
          autoComplete="nickname"
          maxLength={40}
        />
      </label>
      <label className="pn-field">
        <span className="pn-field__lab">
          <XLogo size={13} />
          X
        </span>
        <span className="pn-field__x">
          <span aria-hidden="true">@</span>
          <input
            className="pn-field__in"
            value={f.xHandle.replace(/^@/, '')}
            onChange={(e) => f.setXHandle(e.target.value.replace(/^@/, ''))}
            placeholder="harpreetsingh"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={15}
            inputMode="text"
          />
        </span>
      </label>
    </div>
  )
}

export function AvatarButton({
  f,
  className,
  children,
}: {
  f: ClaimApi
  className: string
  children?: ReactNode
}) {
  const id = 'pn-avatar'
  return (
    <div className={className}>
      {f.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={f.avatarUrl} alt="" className="pn-avatar__img" />
      ) : (
        children
      )}
      <label htmlFor={id} className="pn-avatar__add">
        <span className="pnh__sr">Upload avatar</span>
        <Plus size={16} />
      </label>
      <input
        id={id}
        className="pnh__sr"
        type="file"
        accept="image/*"
        onChange={f.onAvatar}
      />
    </div>
  )
}

export function SkipDone({ onBack }: { onBack: () => void }) {
  return (
    <div className="pn-done">
      <style>{SHARED_CSS}</style>
      <button type="button" className="circle-btn pn-back" onClick={onBack} aria-label="Back">
        <Back size={22} />
      </button>
      <div className="pn-done__body">
        <h1 className="title pn-done__title">No name yet</h1>
        <p className="pn-done__lede">You can claim one later from Details → Wallets.</p>
      </div>
      <div className="pn-done__foot">
        <button className="btn btn--primary" type="button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  )
}

export function ProfileDone({ f }: { f: ClaimApi }) {
  const shown = f.displayName.trim() || f.label
  return (
    <div className="pn-done">
      <style>{SHARED_CSS}</style>
      <button type="button" className="circle-btn pn-back" onClick={f.reset} aria-label="Back">
        <Back size={22} />
      </button>
      <div className="pn-done__body">
        <div className="pn-done__av">
          {f.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.avatarUrl} alt="" className="pn-avatar__img" />
          ) : (
            <span>{f.initial}</span>
          )}
        </div>
        <h1 className="title pn-done__title">{shown}</h1>
        <p className="pn-done__name">{f.fullName}</p>
        {f.xClean && <p className="pn-done__x">@{f.xClean}</p>}
      </div>
      <div className="pn-done__foot">
        <button className="btn btn--primary" type="button" onClick={f.reset}>
          Edit again
        </button>
      </div>
    </div>
  )
}

export const SHARED_CSS = `
.pn-back {
  position: absolute;
  top: 62px;
  left: 16px;
  width: 44px;
  height: 44px;
  z-index: 5;
}
.pnh__sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
.pn-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pn-avatar__add {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--text-1);
  color: var(--text-on-dark);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.pn-avatar__add:focus-within {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset);
}
.pn-fields {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 28px;
}
.pn-field {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 0 16px;
  border-radius: 16px;
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}
.pn-field__lab {
  flex: none;
  width: 52px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: var(--fw-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-3);
}
.pn-field__in {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}
.pn-field__in::placeholder { color: var(--text-3); font-weight: var(--fw-regular); }
.pn-field__x {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--text-3);
}
.pn-done {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  padding: 60px 0 34px;
}
.pn-done__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 var(--pad-onboard);
  text-align: center;
}
.pn-done__av {
  width: 88px;
  height: 88px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--bg-subtle);
  color: var(--text-1);
  display: grid;
  place-items: center;
  font-size: 32px;
  font-weight: var(--fw-bold);
  margin-bottom: 18px;
}
.pn-done__title { color: var(--text-1); text-wrap: balance; overflow-wrap: anywhere; }
.pn-done__name {
  margin-top: 8px;
  font-size: var(--fs-sub);
  color: var(--text-2);
  word-break: break-all;
}
.pn-done__x {
  margin-top: 6px;
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}
.pn-done__lede {
  margin-top: 10px;
  max-width: 320px;
  font-size: var(--fs-sub);
  color: var(--text-2);
  line-height: var(--lh-body);
}
.pn-done__foot { flex: none; padding: 0 var(--pad-onboard); }
`

const BILLBOARD_CSS = SHARED_CSS + `
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
.pnh__hero { display: block; cursor: text; }
.pnh__input {
  display: block;
  width: 100%;
  font-size: 40px;
  font-weight: var(--fw-bold);
  letter-spacing: -0.04em;
  line-height: 1.05;
  color: var(--text-1);
  caret-color: var(--accent);
}
.pnh__input::placeholder { color: var(--text-3); font-weight: var(--fw-bold); }
.pnh__input:focus-visible { outline: none; }
.pnh__parent {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  min-height: 24px;
  font-size: var(--fs-heading);
  font-weight: var(--fw-semibold);
  letter-spacing: -0.02em;
  color: var(--text-3);
}
.pnh__glyph {
  width: 16px;
  height: 16px;
  flex: none;
  display: grid;
  place-items: center;
  color: var(--text-2);
}
.pnh__hero[data-state="available"] .pnh__glyph { color: var(--accent); }
.pnh__hero[data-state="taken"] .pnh__glyph { color: var(--price-down); }
.pnh__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--text-3);
  animation: pnh-pulse 900ms ease-in-out infinite;
}
.pnh__err {
  margin-top: 14px;
  font-size: var(--fs-label);
  color: var(--price-down);
}
.pnh__note {
  margin-top: 14px;
  font-size: var(--fs-sub);
  color: var(--text-3);
}
.pnh__foot {
  flex: none;
  padding: 0 var(--pad-onboard);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pnh__skip {
  min-height: 44px;
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
@media (prefers-reduced-motion: reduce) {
  .pnh__dot { animation: none; }
}
@keyframes pnh-pulse {
  50% { opacity: 0.35; transform: scale(0.85); }
}
`
