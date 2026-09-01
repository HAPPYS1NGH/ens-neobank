'use client'

/**
 * The device shell: the iPhone frame, the simulated iOS status bar, and the
 * bottom-sheet primitive every modal screen in this build sits inside.
 *
 * Size. `docs/DESIGN.md` measures the reference PNGs at 1320 x 2868 @3x, which
 * is 440 x 956 points — an iPhone 17 Pro Max, not the 402 x 874 Pro that
 * SPEC.md guessed at. We render 1 CSS px = 1 iOS point, so every measurement in
 * DESIGN.md drops straight into this file as a px value.
 *
 * The status bar is drawn, not chrome. Unlike the D'CENT build these shots were
 * taken with the status bar visible (IMG_4306: 5:55, four bars, wifi, 73%), and
 * the Dynamic Island sits over the top of the wash — so leaving it out would
 * change the composition of the Home screen, not just its trim.
 *
 * Sheets. Every modal screen (IMG_4300, IMG_4301, IMG_4302, IMG_4308) is the
 * same object: an 8px-inset card floating 36px above the bottom edge, 32px
 * corners all round, a centred 15/600 title and a white circular X on the same
 * line, over a flat black scrim at 0.71. One primitive, no variants beyond the
 * white `plain` background the Receive sheet uses (IMG_4299).
 */

import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Close } from './Icons'

/** The screen, in points. Everything else is measured against these. */
export const SCREEN_WIDTH = 440
export const SCREEN_HEIGHT = 956
/** Status bar height, and the strip the home indicator occupies. */
export const STATUS_BAR_HEIGHT = 60
export const HOME_INDICATOR_HEIGHT = 34

/* -------------------------------------------------------------- status bar */

/** Signal strength: four bars, three filled plus a short one (IMG_4306). */
function Cellular() {
  return (
    <svg width={19} height={13} viewBox="0 0 19 13" fill="currentColor" aria-hidden="true">
      <rect x="0" y="8.6" width="3.1" height="4.4" rx="1.1" />
      <rect x="5.3" y="6" width="3.1" height="7" rx="1.1" />
      <rect x="10.6" y="3.2" width="3.1" height="9.8" rx="1.1" />
      <rect x="15.9" y="0" width="3.1" height="13" rx="1.1" />
    </svg>
  )
}

function Wifi() {
  return (
    <svg width={18} height={13} viewBox="0 0 18 13" fill="currentColor" aria-hidden="true">
      <path d="M9 1.1c3.2 0 6.2 1.2 8.4 3.3a.7.7 0 0 1 0 1l-1 1a.7.7 0 0 1-1 0A9.2 9.2 0 0 0 9 3.8a9.2 9.2 0 0 0-6.4 2.6.7.7 0 0 1-1 0l-1-1a.7.7 0 0 1 0-1A12.1 12.1 0 0 1 9 1.1Z" />
      <path d="M9 6.1c1.8 0 3.5.7 4.8 1.9a.7.7 0 0 1 0 1l-1 1a.7.7 0 0 1-1 0A5 5 0 0 0 9 8.7a5 5 0 0 0-2.8 1.3.7.7 0 0 1-1 0l-1-1a.7.7 0 0 1 0-1A6.9 6.9 0 0 1 9 6.1Z" />
      <path d="m9 10.5 2 2a.6.6 0 0 1 0 .5H7a.6.6 0 0 1 0-.5l2-2Z" />
    </svg>
  )
}

/**
 * iOS 26 draws the level as a number inside the fill, white on the charged
 * part and dark on the empty part. We only ever show one level, so the number
 * sits over the fill and stays white.
 */
function Battery({ level }: { level: number }) {
  const bodyW = 27
  const fillW = Math.max(3, Math.round((bodyW - 2) * (level / 100)))
  return (
    <svg width={31} height={14} viewBox="0 0 31 14" aria-hidden="true">
      <rect x="0" y="0" width={bodyW} height="14" rx="4.6" fill="currentColor" opacity="0.32" />
      <rect x="1" y="1" width={fillW} height="12" rx="3.8" fill="currentColor" />
      <path d="M28.6 4.6c1.1.4 1.7 1.2 1.7 2.4s-.6 2-1.7 2.4V4.6Z" fill="currentColor" opacity="0.32" />
      <text
        x={bodyW / 2}
        y="10.6"
        textAnchor="middle"
        fontSize="10.2"
        fontWeight="700"
        fill="#fff"
        fontFamily="var(--font)"
      >
        {level}
      </text>
    </svg>
  )
}

/**
 * The status bar. `tint` is the ink colour; it defaults to the near-black
 * `--text-1` because this build is light-theme only.
 */
export function StatusBar({
  time = '5:55',
  battery = 73,
  tint,
}: {
  time?: string
  battery?: number
  tint?: string
}) {
  return (
    <div className="tg-status" style={tint ? ({ color: tint } as CSSProperties) : undefined}>
      <div className="tg-status__time">{time}</div>
      <div className="tg-status__island" />
      <div className="tg-status__icons">
        <Cellular />
        <Wifi />
        <Battery level={battery} />
      </div>
    </div>
  )
}

/** The bar at the bottom edge. Drawn dark because there is no dark theme here. */
export function HomeIndicator() {
  return <div className="tg-home-indicator" aria-hidden="true" />
}

/* ------------------------------------------------------------------ frame */

/** `useLayoutEffect` on the client, a no-op effect during SSR (which warns). */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * The frame. On a phone it is the whole viewport; on a desktop it is an
 * iPhone-shaped card in the middle of a black stage, scaled down continuously
 * so the whole device — 956pt plus the bezel — always fits the window. The
 * media-query steps in the CSS are only the pre-hydration fallback; once the
 * effect runs, the inline transform takes over and tracks resizes exactly.
 *
 * Centring is done by the transform (`translate(-50%, -50%)` off the stage's
 * midpoint), not by the stage's alignment. The frame's *layout* box is always
 * the full 464 x 980 — `scale()` shrinks what you see, not what the box
 * measures — so a flex/grid `center` would clamp that oversized box to the top
 * of a short window and then scale it about the wrong point, which is what
 * left a gap above the phone and cut the bezel off below.
 *
 * Children render inside a `position: relative` screen, so every screen and
 * sheet can position itself absolutely against the device rather than the page.
 */
export function Shell({
  children,
  statusTime,
  statusTint,
  showStatusBar = true,
  showHomeIndicator = true,
}: {
  children: ReactNode
  statusTime?: string
  statusTint?: string
  showStatusBar?: boolean
  showHomeIndicator?: boolean
}) {
  // null → no inline transform yet; the CSS media-query steps apply instead.
  const [fit, setFit] = useState<number | null>(null)

  // Layout effect so the measured scale lands in the same paint as hydration;
  // a plain effect would show the coarse media-query step for a frame first.
  useIsomorphicLayoutEffect(() => {
    const update = () => {
      // On a phone the frame fills the viewport unscaled — CSS owns it there.
      if (window.innerWidth <= 520) {
        setFit(null)
        return
      }
      const scale = Math.min(
        1,
        (window.innerHeight - 28) / (SCREEN_HEIGHT + 24),
        (window.innerWidth - 28) / (SCREEN_WIDTH + 24),
      )
      setFit(scale)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className="tg-stage">
      <style>{SHELL_CSS}</style>
      <div
        className="tg-frame"
        style={
          fit !== null ? { transform: `translate(-50%, -50%) scale(${fit})` } : undefined
        }
      >
        <div className="tg-screen">
          {children}
          {showStatusBar && <StatusBar time={statusTime} tint={statusTint} />}
          {showHomeIndicator && <HomeIndicator />}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ sheets */

/** The flat black overlay behind a sheet. Sampled at 0.71 with no blur. */
export function Scrim({ onClick }: { onClick?: () => void }) {
  return <div className="tg-scrim" onClick={onClick} />
}

/**
 * The bottom sheet. `footer` is the sticky area a Save button lives in
 * (IMG_4302); it stays put while the body scrolls.
 *
 * `plain` switches the body to white for the Receive sheet, which is the one
 * sheet in the app that is not `--bg-sheet` grey.
 */
export function Sheet({
  title,
  onClose,
  children,
  footer,
  plain = false,
  full = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  plain?: boolean
  /** Take the full height a sheet is allowed rather than hugging its content. */
  full?: boolean
}) {
  return (
    <div className="tg-sheet-layer">
      <Scrim onClick={onClose} />
      <div
        className={`tg-sheet${plain ? ' tg-sheet--plain' : ''}${full ? ' tg-sheet--full' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="tg-sheet__head">
          <h2 className="tg-sheet__title">{title}</h2>
          <button className="tg-sheet__close" onClick={onClose} aria-label="Close">
            <Close size={23} />
          </button>
        </div>
        <div className="tg-sheet__body scroll">{children}</div>
        {footer && <div className="tg-sheet__foot">{footer}</div>}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- css */
/* Kept here rather than in globals.css because globals.css is another agent's
 * file. Everything is prefixed `tg-` so the two sets cannot collide. */

const SHELL_CSS = `
.tg-stage {
  position: fixed;
  inset: 0;
  background: #0a0a0b;
  overflow: hidden;
}

.tg-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  padding: 12px;
  border-radius: 68px;
  background: #050505;
  box-shadow: 0 0 0 2px #2a2a2e, 0 30px 80px rgba(0, 0, 0, .55);
  transform-origin: center;
  transform: translate(-50%, -50%);
}

.tg-screen {
  position: relative;
  width: ${SCREEN_WIDTH}px;
  height: ${SCREEN_HEIGHT}px;
  border-radius: 56px;
  overflow: hidden;
  background: var(--bg-page);
  color: var(--text-1);
  isolation: isolate;
}

/* Short windows: pre-hydration fallback only. The Shell effect scales the
   frame continuously once JS is live, so the screen is never cropped and the
   layout a screen agent measured against 440x956 never changes. */
@media (max-height: 1000px) { .tg-frame { transform: translate(-50%, -50%) scale(.94); } }
@media (max-height: 940px)  { .tg-frame { transform: translate(-50%, -50%) scale(.88); } }
@media (max-height: 880px)  { .tg-frame { transform: translate(-50%, -50%) scale(.82); } }
@media (max-height: 820px)  { .tg-frame { transform: translate(-50%, -50%) scale(.76); } }
@media (max-height: 760px)  { .tg-frame { transform: translate(-50%, -50%) scale(.70); } }
@media (max-height: 700px)  { .tg-frame { transform: translate(-50%, -50%) scale(.64); } }

/* On a phone the app is the phone: no bezel, no scaling, fill the viewport. */
@media (max-width: 520px) {
  .tg-stage { background: var(--bg-page); }
  .tg-frame {
    position: static;
    padding: 0;
    border-radius: 0;
    background: none;
    box-shadow: none;
    transform: none;
  }
  .tg-screen {
    width: 100vw;
    height: 100dvh;
    border-radius: 0;
  }
}

/* Status bar --------------------------------------------------------------- */

.tg-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${STATUS_BAR_HEIGHT}px;
  display: flex;
  align-items: center;
  color: var(--text-1);
  pointer-events: none;
  z-index: 40;
}

/* The time sits in the left ear, centred on x = 73 in IMG_4306. */
.tg-status__time {
  width: 159px;
  padding-top: 3px;
  text-align: center;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

.tg-status__island {
  width: 122px;
  height: 32px;
  margin-top: 1px;
  border-radius: 16px;
  background: #000;
}

.tg-status__icons {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding-right: 30px;
  padding-top: 2px;
}

.tg-home-indicator {
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: 140px;
  height: 5px;
  margin-left: -70px;
  border-radius: 3px;
  background: var(--text-1);
  opacity: .3;
  pointer-events: none;
  z-index: 45;
}

/* Sheets ------------------------------------------------------------------- */

.tg-sheet-layer {
  position: absolute;
  inset: 0;
  z-index: 50;
}

.tg-scrim {
  position: absolute;
  inset: 0;
  background: var(--scrim);
  animation: tg-fade .22s ease;
}

.tg-sheet {
  position: absolute;
  left: var(--pad-sheet);
  right: var(--pad-sheet);
  bottom: 36px;
  display: flex;
  flex-direction: column;
  max-height: calc(100% - 195px);
  border-radius: var(--r-sheet);
  background: var(--bg-sheet);
  box-shadow: var(--shadow-sheet);
  animation: tg-rise .26s cubic-bezier(.22, .8, .3, 1);
}

.tg-sheet--plain { background: var(--bg-sheet-plain); }
.tg-sheet--full { height: calc(100% - 195px); }

/* Title and close share one line, 38px down from the sheet's top edge. */
.tg-sheet__head {
  position: relative;
  flex: none;
  height: 76px;
  display: grid;
  place-items: center;
}

.tg-sheet__title {
  font-size: var(--fs-sheet-title);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}

.tg-sheet__close {
  position: absolute;
  top: 50%;
  right: 18px;
  width: 44px;
  height: 44px;
  margin-top: -22px;
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-1);
  display: grid;
  place-items: center;
}

.tg-sheet__close:active { opacity: .7; }

.tg-sheet__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 var(--pad-sheet-card) 16px;
}

.tg-sheet__foot {
  flex: none;
  padding: 12px var(--pad-sheet-card) 16px;
}

@keyframes tg-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes tg-rise { from { transform: translateY(24px); opacity: .4 } to { transform: none; opacity: 1 } }
`
