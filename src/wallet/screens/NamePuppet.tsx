'use client'

/**
 * The onboarding name field: a ninja holding the label on a scroll.
 *
 * The label and the parent sit on one baseline. The scroll widens until it
 * can't, then the row scales with a transform so the parent stays glued to
 * the label. Poses settle on a spring. Claiming lets the scroll go and
 * brings the ENS mark into the hands.
 */

import { useEffect, useLayoutEffect, useRef, type Ref } from 'react'
import { LABEL_MAX, acceptLabel } from '@/lib/format'

const INK = '#1f1f1f'
const ENS_BLUE = '#5474f6'

const SHOULDER_Y = 30
const SHOULDER_X = 84
const PAPER_H = 68
const PAPER_MIN = 168
const PAPER_MAX = 292
const TYPE_K = 460
const TYPE_C = 2 * Math.sqrt(TYPE_K)
const POSE_K = 180
const POSE_C = 25
const HOP = 16
const STRETCH = 0.7
const CATCH_Y = -158
const OVERHEAD_Y = -172

export type PuppetMood =
  | 'empty'
  | 'checking'
  | 'available'
  | 'taken'
  | 'rejected'
  | 'claiming'
  | 'skipped'

class Spring {
  x: number
  v = 0
  target: number
  constructor(x: number) {
    this.x = x
    this.target = x
  }
  step(dt: number, opts?: { stiffness?: number; damping?: number }) {
    const k = opts?.stiffness ?? POSE_K
    const c = opts?.damping ?? POSE_C
    const h = 1 / 120
    let left = dt
    while (left > 1e-4) {
      const d = Math.min(h, left)
      this.v += (k * (this.target - this.x) - c * this.v) * d
      this.x += this.v * d
      left -= d
    }
    if (Math.abs(this.target - this.x) < 0.05 && Math.abs(this.v) < 0.05) {
      this.x = this.target
      this.v = 0
    }
    return this.x
  }
  snap(x: number) {
    this.x = x
    this.target = x
    this.v = 0
  }
}

const SLIT =
  'M -0.62 0.05 C -0.5 -0.13, 0.5 -0.13, 0.62 0.05 C 0.72 0.2, 0.62 0.42, 0.42 0.4 C 0.25 0.38, 0.12 0.3, 0 0.31 C -0.12 0.3, -0.25 0.38, -0.42 0.4 C -0.62 0.42, -0.72 0.2, -0.62 0.05 Z'

function Head({
  headRef,
  eyeRef,
}: {
  headRef: Ref<SVGGElement>
  eyeRef: Ref<SVGPathElement>
}) {
  return (
    <g ref={headRef} transform="translate(0 -88) scale(30 30)">
      <path d="M -0.95 -0.17 L -1.62 -0.34 L -1.62 -0.06 L -0.96 0.08 Z" fill={INK} />
      <path d="M -0.9 0.2 L -1.62 0.32 L -1.6 0.66 L -0.8 0.43 Z" fill={INK} />
      <circle r="1" fill={INK} />
      <path ref={eyeRef} d={SLIT} fill="#fff" />
    </g>
  )
}

function Glove() {
  return (
    <g transform="scale(1.15)">
      <path d="M -11 -2 L 11 -2 L 11 26 C 11 38, -11 38, -11 26 Z" fill="#fff" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path
        d="M -11 4 C -18 8, -19 22, -12 26 C -8 28, -6 22, -7 14 Z"
        fill="url(#np-dots)"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M -11 4 C -18 8, -19 22, -12 26 C -8 28, -6 22, -7 14 Z" fill="#fff" fillOpacity="0.35" />
      <path d="M 1 16 L 1 30" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  )
}

function EnsBadge() {
  return (
    <g>
      <circle r="34" fill="#fff" stroke={INK} strokeWidth="2.4" />
      <circle r="24.5" fill={INK} />
      <g transform="scale(1.133)">
        <path d="M 0 -15 L -9 0 L 0 -4 Z" fill="#9fb3ff" />
        <path d="M 0 -15 L 9 0 L 0 -4 Z" fill="#fff" />
        <path d="M 0 -4 L -9 0 L 0 15 Z" fill={ENS_BLUE} />
        <path d="M 0 -4 L 9 0 L 0 15 Z" fill="#c9d4ff" />
      </g>
    </g>
  )
}

function clamp01(k: number) {
  return k < 0 ? 0 : k > 1 ? 1 : k
}
function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k
}
function easeOutQuint(k: number) {
  return 1 - (1 - k) ** 5
}
function easeInCubic(k: number) {
  return k * k * k
}

export function NamePuppet({
  value,
  onValue,
  parent,
  placeholder,
  mood,
  disabled,
}: {
  value: string
  onValue: (next: string) => void
  parent: string
  placeholder: string
  mood: PuppetMood
  disabled?: boolean
}) {
  const live = useRef({ mood, len: value.length })
  live.current = { mood, len: value.length }

  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const bodyRef = useRef<SVGGElement>(null)
  const headRef = useRef<SVGGElement>(null)
  const eyeRef = useRef<SVGPathElement>(null)
  const armL = useRef<SVGPathElement>(null)
  const armR = useRef<SVGPathElement>(null)
  const gloveL = useRef<SVGGElement>(null)
  const gloveR = useRef<SVGGElement>(null)
  const scrollRef = useRef<SVGGElement>(null)
  const paperRef = useRef<SVGRectElement>(null)
  const rodL = useRef<SVGRectElement>(null)
  const rodR = useRef<SVGRectElement>(null)
  const badgeRef = useRef<SVGGElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLLabelElement>(null)
  const textW = useRef(180)

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    textW.current = row.offsetWidth
  }, [value, parent, placeholder])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const textUnits = () => {
      const svg = svgRef.current
      const w = svg?.clientWidth ?? 0
      const h = svg?.clientHeight ?? 0
      const unit = w > 0 && h > 0 ? Math.min(w / 420, h / 500) : 1
      return { unit, w, h, px: textW.current / unit }
    }
    const first = textUnits()
    const w0 = Math.max(PAPER_MIN, Math.min(PAPER_MAX, first.px + 44))
    const s = {
      sx: new Spring(0),
      sy: new Spring(118),
      sw: new Spring(w0),
      rot: new Spring(0),
      lx: new Spring(-w0 / 2 - 6),
      ly: new Spring(118),
      rx: new Spring(w0 / 2 + 6),
      ry: new Spring(118),
      tilt: new Spring(4),
      fit: new Spring(1),
    }
    let t = 0
    let last = performance.now()
    let pose: PuppetMood = live.current.mood
    let poseAt = 0
    let raf = 0
    let scrollOp = 1
    let badgeOp = 0
    let fromScrollOp = 1
    let fromBadgeOp = 0
    let drift = 0
    let fromDrift = 0

    const focus = () => {
      anchorRef.current?.querySelector('input')?.focus()
    }
    paperRef.current?.addEventListener('click', focus)

    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.034, (now - last) / 1000))
      last = now
      t += dt
      const m = live.current.mood
      if (m !== pose) {
        fromScrollOp = scrollOp
        fromBadgeOp = badgeOp
        fromDrift = drift
        pose = m
        poseAt = t
      }
      const since = t - poseAt
      const hide = m === 'claiming'
      const fade = reduced ? 1 : clamp01(since / 0.24)
      const enterK = easeOutQuint(fade)
      const exitK = easeInCubic(fade)
      if (hide) {
        scrollOp = lerp(fromScrollOp, 0, exitK)
        badgeOp = lerp(fromBadgeOp, 1, enterK)
        drift = lerp(fromDrift, -18, exitK)
      } else {
        scrollOp = lerp(fromScrollOp, 1, enterK)
        badgeOp = lerp(fromBadgeOp, 0, exitK)
        drift = lerp(fromDrift, 0, enterK)
      }

      const { unit, w: svgW, h: svgH, px } = textUnits()
      const paperTarget = Math.max(PAPER_MIN, Math.min(PAPER_MAX, px + 44))
      const inner = paperTarget - 40
      const fitTarget = px > 0 ? Math.min(1, Math.max(0.42, inner / px)) : 1

      let sy = 118
      let rot = 0
      let tilt = 4
      let hold = true
      if (m === 'checking') {
        sy = 104
        tilt = 6
      } else if (m === 'available') {
        sy = OVERHEAD_Y
        tilt = -8
      } else if (m === 'taken' || m === 'rejected') {
        sy = 136
        rot = 5
        tilt = 7
      } else if (hide) {
        sy = s.sy.x
        rot = s.rot.x
        tilt = -6
        hold = false
      }

      if (reduced) {
        s.sy.snap(hide ? s.sy.x : sy)
        s.rot.snap(rot)
        s.tilt.snap(tilt)
        s.sw.snap(paperTarget)
        s.fit.snap(fitTarget)
      } else {
        if (!hide) {
          s.sy.target = sy
          s.rot.target = rot
        }
        s.tilt.target = tilt
        s.sw.target = paperTarget
        s.fit.target = fitTarget
        s.sy.step(dt)
        s.rot.step(dt)
        s.tilt.step(dt)
        s.sw.step(dt, { stiffness: TYPE_K, damping: TYPE_C })
        s.fit.step(dt, { stiffness: TYPE_K, damping: TYPE_C })
      }

      const drawY = s.sy.x + drift
      const W = s.sw.x
      const edgeL = -W / 2 - 6
      const edgeR = W / 2 + 6

      let hop = 0
      if (m === 'available' && !reduced) hop = -HOP * Math.sin(Math.PI * clamp01(since / 0.42))
      const shake =
        (m === 'taken' || m === 'rejected') && !reduced
          ? Math.sin(clamp01(since / 0.4) * Math.PI * 4) * 6 * (1 - clamp01(since / 0.4))
          : 0

      let hxL: number
      let hyL: number
      let hxR: number
      let hyR: number
      if (hold) {
        const rad = (s.rot.x * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const grip = (localX: number) => ({
          x: s.sx.x + localX * cos,
          y: drawY + localX * sin,
        })
        const left = grip(edgeL)
        const right = grip(edgeR)
        hxL = left.x
        hyL = left.y
        hxR = right.x
        hyR = right.y
        s.lx.snap(hxL)
        s.ly.snap(hyL)
        s.rx.snap(hxR)
        s.ry.snap(hyR)
      } else {
        s.lx.target = -42
        s.ly.target = CATCH_Y
        s.rx.target = 42
        s.ry.target = CATCH_Y
        if (reduced) {
          s.lx.snap(-42)
          s.ly.snap(CATCH_Y)
          s.rx.snap(42)
          s.ry.snap(CATCH_Y)
        } else {
          s.lx.step(dt)
          s.ly.step(dt)
          s.rx.step(dt)
          s.ry.step(dt)
        }
        hxL = s.lx.x
        hyL = s.ly.x
        hxR = s.rx.x
        hyR = s.ry.x
      }

      bodyRef.current?.setAttribute('transform', `translate(0 ${hop})`)
      headRef.current?.setAttribute(
        'transform',
        `translate(0 ${-88 + hop}) rotate(${s.tilt.x + shake}) scale(30 30)`,
      )
      const eye =
        m === 'checking' && !reduced
          ? Math.sin(t * 2.4)
          : m === 'taken' || m === 'rejected'
            ? -0.35
            : m === 'available'
              ? 0.15
              : 0
      const blink = !reduced && t % 4.2 < 0.1 ? 0.15 : 1
      eyeRef.current?.setAttribute('transform', `translate(${eye * 0.18} 0) scale(1 ${blink})`)

      const sag = 18 + 48 * STRETCH
      const arm = (dir: -1 | 1, hx: number, hy: number, path: SVGPathElement | null, glove: SVGGElement | null) => {
        const x0 = dir * SHOULDER_X
        const y0 = SHOULDER_Y + hop
        const c1x = x0 + dir * sag
        const c1y = y0 + 8
        const c2x = hx + dir * 10
        const c2y = hy + (hy < y0 ? sag * 0.65 : sag * 0.75)
        path?.setAttribute('d', `M ${x0} ${y0} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${hx} ${hy}`)
        const ang = (Math.atan2(hy - c2y, hx - c2x) * 180) / Math.PI - 90
        glove?.setAttribute('transform', `translate(${hx} ${hy}) rotate(${ang})`)
      }
      arm(-1, hxL, hyL, armL.current, gloveL.current)
      arm(1, hxR, hyR, armR.current, gloveR.current)

      scrollRef.current?.setAttribute('transform', `translate(${s.sx.x} ${drawY}) rotate(${s.rot.x})`)
      scrollRef.current?.setAttribute('opacity', reduced ? (hide ? '0' : '1') : scrollOp.toFixed(3))
      paperRef.current?.setAttribute('x', String(-W / 2))
      paperRef.current?.setAttribute('width', String(W))
      rodL.current?.setAttribute('x', String(-W / 2 - 7))
      rodR.current?.setAttribute('x', String(W / 2 - 3))

      const badgeScale = 0.95 + 0.05 * badgeOp
      const badgeY = CATCH_Y + (1 - badgeOp) * 16
      badgeRef.current?.setAttribute(
        'transform',
        `translate(0 ${badgeY}) scale(${reduced ? (hide ? 1 : 0.95) : badgeScale})`,
      )
      badgeRef.current?.setAttribute('opacity', reduced ? (hide ? '1' : '0') : badgeOp.toFixed(3))

      const anchor = anchorRef.current
      const fit = fitRef.current
      if (anchor && fit && svgW > 0 && svgH > 0) {
        const offX = (svgW - 420 * unit) / 2
        const offY = (svgH - 500 * unit) / 2
        const x = offX + (s.sx.x + 210) * unit
        const y = offY + (drawY + 250) * unit
        anchor.style.transform = `translate(${x}px, ${y}px) rotate(${s.rot.x}deg)`
        anchor.style.opacity = reduced ? (hide ? '0' : '1') : scrollOp.toFixed(3)
        anchor.style.pointerEvents = scrollOp < 0.45 ? 'none' : 'auto'
        fit.style.transform = `translate(-50%, -50%) scale(${s.fit.x})`
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      paperRef.current?.removeEventListener('click', focus)
    }
  }, [])

  const struck = mood === 'taken' || mood === 'rejected'

  return (
    <div className="np-stage" ref={stageRef} data-mood={mood} data-dim={mood === 'skipped' || undefined}>
      <svg ref={svgRef} className="np" viewBox="-210 -250 420 500" aria-hidden="true">
        <defs>
          <pattern id="np-dots" width="4.2" height="4.2" patternUnits="userSpaceOnUse">
            <circle cx="2.1" cy="2.1" r="0.95" fill={INK} />
          </pattern>
        </defs>
        <ellipse cx="0" cy="222" rx="92" ry="8" fill="#1f1f1f" opacity="0.14" />
        <g ref={badgeRef} opacity="0" transform="translate(0 -142) scale(0.95)">
          <EnsBadge />
        </g>
        <g ref={bodyRef}>
          <path d="M -58 212 L -58 40 C -58 -22, 58 -22, 58 40 L 58 212" fill="none" stroke={INK} strokeWidth="64" strokeLinejoin="round" />
          <path d="M -30 34 L 30 34" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        </g>
        <Head headRef={headRef} eyeRef={eyeRef} />
        <g ref={scrollRef} transform="translate(0 118)">
          <rect ref={paperRef} className="np-paper" x={-84} y={-34} width={168} height={PAPER_H} rx={4} fill="#fff" stroke={INK} strokeWidth="2.4" />
          <rect ref={rodL} x={-91} y={-40} width={10} height={80} rx={4} fill={INK} />
          <rect ref={rodR} x={81} y={-40} width={10} height={80} rx={4} fill={INK} />
        </g>
        <path ref={armL} fill="none" stroke={INK} strokeWidth="26" strokeLinecap="butt" />
        <path ref={armR} fill="none" stroke={INK} strokeWidth="26" strokeLinecap="butt" />
        <g ref={gloveL}>
          <Glove />
        </g>
        <g ref={gloveR}>
          <g transform="scale(-1 1)">
            <Glove />
          </g>
        </g>
      </svg>

      <div ref={anchorRef} className="np-anchor">
        <div ref={fitRef} className="np-fit">
          <label ref={rowRef} className="np-row" data-struck={struck || undefined}>
            <span className="np-sr">Wallet name</span>
            <span className="np-entry">
              <span className="np-sizer" aria-hidden="true">
                {value || placeholder}
              </span>
              <input
                id="wallet-name"
                className="np-input"
                value={value}
                disabled={disabled}
                placeholder={placeholder}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="text"
                enterKeyHint="done"
                pattern="[a-z0-9-]*"
                maxLength={LABEL_MAX}
                size={1}
                data-1p-ignore
                data-lpignore="true"
                aria-invalid={struck || undefined}
                aria-describedby="wallet-name-status"
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault()
                }}
                onChange={(e) => {
                  const el = e.target
                  const caret = el.selectionStart ?? el.value.length
                  const next = acceptLabel(el.value)
                  const kept = acceptLabel(el.value.slice(0, caret)).length
                  onValue(next)
                  requestAnimationFrame(() => el.setSelectionRange(kept, kept))
                }}
                onPaste={(e) => {
                  e.preventDefault()
                  const el = e.currentTarget
                  const start = el.selectionStart ?? el.value.length
                  const end = el.selectionEnd ?? start
                  const inserted = e.clipboardData.getData('text')
                  const next = acceptLabel(el.value.slice(0, start) + inserted + el.value.slice(end))
                  const kept = acceptLabel(el.value.slice(0, start) + inserted).length
                  onValue(next)
                  requestAnimationFrame(() => el.setSelectionRange(kept, kept))
                }}
              />
            </span>
            <span className="np-parent" aria-hidden="true">
              .{parent}
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}

export const NAME_PUPPET_CSS = `
.np-stage { position: absolute; inset: 0; transition: opacity 150ms ease-out; }
.np-stage[data-dim] { opacity: 0.45; }
.np { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; user-select: none; }
.np-paper { pointer-events: auto; cursor: text; transition: stroke 150ms ease; }
.np-stage:focus-within .np-paper { stroke: #fff; }
.np-stage[data-mood="taken"] .np-paper,
.np-stage[data-mood="rejected"] .np-paper { stroke: var(--price-down); }
.np-stage[data-dim] .np-paper { pointer-events: none; }
.np-anchor {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  transform-origin: 0 0;
  will-change: transform, opacity;
}
.np-fit { transform-origin: center center; will-change: transform; }
.np-row {
  display: flex;
  align-items: baseline;
  white-space: nowrap;
  color: #211d1d;
  cursor: text;
}
.np-entry { display: inline-grid; vertical-align: baseline; }
.np-sizer, .np-input {
  grid-area: 1 / 1;
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 24px;
  font-weight: var(--fw-medium);
  letter-spacing: -0.02em;
  line-height: 1.05;
  font-family: inherit;
}
.np-sizer { visibility: hidden; white-space: pre; }
.np-input {
  width: 100%;
  min-width: 0;
  color: #211d1d;
  caret-color: var(--accent);
  background: transparent;
  text-align: left;
  touch-action: manipulation;
}
.np-input:focus-visible { outline: none; }
.np-input::placeholder { color: rgba(33, 29, 29, 0.42); font-weight: var(--fw-medium); }
.np-parent {
  margin-left: 1px;
  font-size: 15px;
  font-weight: var(--fw-medium);
  letter-spacing: -0.01em;
  color: rgba(33, 29, 29, 0.46);
}
.np-row[data-struck] .np-input { text-decoration: line-through; text-decoration-thickness: 1.5px; }
.np-sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0);
  white-space: nowrap; border: 0;
}
@media (prefers-reduced-motion: reduce) {
  .np-stage, .np-paper { transition: none; }
}
`
