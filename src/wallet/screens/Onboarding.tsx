'use client'

/**
 * Screen 1 — Create Mobile Wallet. A clone of `reference/screens/IMG_4295.PNG`.
 *
 * Nothing here is invented. The layout is measured off that shot, in the 440 x
 * 956 point space `Shell.tsx` renders into:
 *
 *   back button   circle at (16, 62), 44pt              — device (48, 186)
 *   illustration  66pt tall, centred, top at 178pt      — device y 534..732
 *   title         26/700, centred, cap band 281..298pt  — device y 841..894
 *   feature rows  40pt chip at x 40, first row top 343  — device (120, 1010)
 *   buttons       46pt pills, 16pt inset, 8pt apart     — device x 48..1271
 *   terms         12/400 over two lines, centred
 *
 * The only departure from the screenshot is behavioural: `Create wallet` walks
 * into the name step rather than straight to Home, because in this build the
 * name IS the wallet creation flow. See SPEC.md.
 */

import { brand } from '@config'
import { Back, type IconComponent } from '../components/Icons'
import { useWallet } from '../store'

/* --------------------------------------------------------------- artwork */

/**
 * The wallet-and-phone outline above the title. Drawn rather than shipped as an
 * asset so it inherits `currentColor` and scales with the frame; the reference
 * stroke measures ~5 device px at 3x, which is the 1.7 below.
 */
function WalletArt({ size = 66 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 68 68"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* The flap peeking above the body, narrower than the wallet itself. */}
      <path d="M11 22v-5.5A5.5 5.5 0 0 1 16.5 11h33a5.5 5.5 0 0 1 5.5 5.5V22" />
      {/* The wallet body. */}
      <rect x="6" y="22" width="49" height="35" rx="7.5" />
      {/* The stud on the left-hand face — a ring, like the embossed snap. */}
      <circle cx="17.5" cy="33" r="3" strokeWidth={1.8} />
      {/* The phone laid over the wallet's bottom-right corner. It is filled
          with the page colour so the wallet's outline stops behind it, exactly
          as the reference draws the overlap. */}
      <rect x="40" y="30" width="19" height="31" rx="5" fill="var(--bg-page)" />
      <path d="M47 35.5h5" />
    </svg>
  )
}

/* ---------------------------------------------------- the feature glyphs */

/**
 * The three feature icons are the one place IMG_4295 breaks from the app's
 * stroked glyph set: here they are solid fills (the lock is a black padlock,
 * the upgrade card is a black chip with the TT knocked out). The stroked set in
 * `Icons.tsx` reads as a different icon at this size, so these three are traced
 * filled instead. Knock-outs are painted in the chip colour rather than
 * transparent so the shapes sit on the #EBEBEB circle the way the shot draws
 * them.
 */
function LockFilled({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 10.4V7.9a4 4 0 0 1 8 0v2.5"
        stroke="currentColor"
        strokeWidth={2.1}
        strokeLinecap="round"
      />
      <rect x="4.9" y="10.2" width="14.2" height="10" rx="2.8" fill="currentColor" />
    </svg>
  )
}

function SeedFilled({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3.7" y="4.7" width="15.4" height="14.2" rx="3.2" />
      <path d="M7.3 9.4h6M7.3 13h3.8" strokeWidth={2} />
      {/* The shield overlapping the card's bottom-right edge; the chip-coloured
          stroke separates it from the card outline, as in the shot. */}
      <path
        d="M16.8 11.8c1.2 1 2.4 1.3 3.6 1.1.2 2.9-.6 5.6-2.9 7-2.3-1.4-3.1-4.1-2.9-7 1.2.2 2.4-.1 3.6-1.1Z"
        fill="currentColor"
        stroke="var(--bg-subtle)"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CardFilled({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.7" y="6.4" width="16.6" height="11.2" rx="3.4" fill="currentColor" />
      {/* The TT mark, knocked out in the chip colour like the embossed card. */}
      <g fill="var(--bg-subtle)">
        <rect x="8.2" y="9.5" width="7.6" height="2" rx="1" />
        <rect x="8.2" y="12.7" width="2.7" height="3.1" rx="0.9" />
        <rect x="13.1" y="12.7" width="2.7" height="3.1" rx="0.9" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ rows */

const FEATURE_ICONS: readonly IconComponent[] = [LockFilled, SeedFilled, CardFilled]

/* ---------------------------------------------------------------- screen */

export interface OnboardingProps {
  /** Defaults to walking into the name step. */
  onCreate?: () => void
  /** Defaults to a toast; this demo has one deterministic seed to import. */
  onImport?: () => void
  /** Defaults to `back()`. Rendered only when there is somewhere to go. */
  onBack?: () => void
}

export function Onboarding({ onCreate, onImport, onBack }: OnboardingProps) {
  const w = useWallet()

  const create =
    onCreate ?? (() => w.go({ name: 'nameWallet', purpose: 'onboarding', walletId: w.wallet?.id }))

  // The real app imports a seed phrase. This build derives every key from one
  // stored demo seed (src/lib/keys.ts), so there is nothing honest to import —
  // say so rather than opening a text box that does nothing.
  const importWallet =
    onImport ??
    (() => w.showToast('This demo derives one wallet from a local seed — import is out of scope.'))

  return (
    <div className="tgo">
      <style>{ONBOARDING_CSS}</style>

      {/* Rendered only when there is somewhere to go. On a first run there is
          nothing behind this screen, and `back()` would land on a home the user
          has not onboarded into — the one history state this screen refuses. */}
      {w.history.length > 0 && (
        <button className="circle-btn tgo__back" onClick={onBack ?? w.back} aria-label="Back">
          <Back size={22} />
        </button>
      )}

      <div className="tgo__body">
        <div className="tgo__art">
          <WalletArt />
        </div>

        <h1 className="title tgo__title">{brand.copy.onboardingTitle}</h1>

        <ul className="tgo__features">
          {brand.copy.features.map((feature, index) => {
            const Icon = FEATURE_ICONS[index]
            return (
              <li className="tgo__feature" key={feature.title}>
                <span className="tgo__chip">
                  <Icon size={20} />
                </span>
                <div className="tgo__feature-text">
                  <p className="tgo__feature-title">{feature.title}</p>
                  <p className="tgo__feature-body">{feature.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="tgo__foot">
        <button className="btn btn--secondary" onClick={importWallet}>
          {brand.copy.importWallet}
        </button>
        <button className="btn btn--primary" onClick={create}>
          {brand.copy.createWallet}
        </button>
        <p className="tgo__terms">
          {brand.copy.termsPrefix}
          <br />
          <a href={brand.copy.termsHref} target="_blank" rel="noreferrer noopener">
            {brand.copy.termsLabel}
          </a>
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- css */
/* Scoped `tgo-` so it cannot collide with globals.css, which another agent
 * owns, or with the `tg-` set in Shell.tsx. */

const ONBOARDING_CSS = `
.tgo {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  padding: 60px 0 34px;
}

/* The reference circle is 44pt, not the 46pt action circle .circle-btn sizes to. */
.tgo__back {
  position: absolute;
  top: 62px;
  left: 16px;
  width: 44px;
  height: 44px;
  z-index: 5;
}

.tgo__body { flex: 1; min-height: 0; }

.tgo__art {
  display: flex;
  justify-content: center;
  padding-top: 118px;
  color: var(--text-2);
}

.tgo__title {
  margin-top: 37px;
  text-align: center;
  color: var(--text-1);
}

/* The feature list sits 40pt in, 24pt further than the buttons below it. */
.tgo__features {
  margin-top: 32px;
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.tgo__feature {
  display: flex;
  align-items: center;
  gap: 16px;
}

@media (prefers-reduced-motion: no-preference) {
  .tgo__feature {
    opacity: 0;
    transform: translateY(8px);
    animation: tgo-feature-in 180ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  .tgo__feature:nth-child(1) { animation-delay: 0ms; }
  .tgo__feature:nth-child(2) { animation-delay: 50ms; }
  .tgo__feature:nth-child(3) { animation-delay: 100ms; }
}

@keyframes tgo-feature-in {
  to { opacity: 1; transform: translateY(0); }
}

.tgo__chip {
  flex: none;
  width: var(--sz-icon-chip);
  height: var(--sz-icon-chip);
  border-radius: var(--r-icon);
  background: var(--bg-subtle);
  color: var(--icon-ink);
  display: grid;
  place-items: center;
}

.tgo__feature-text { min-width: 0; }

.tgo__feature-title {
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  line-height: 1.3;
}

.tgo__feature-body {
  margin-top: 3px;
  font-size: var(--fs-sub);
  color: var(--text-2);
  line-height: var(--lh-body);
}

.tgo__foot {
  flex: none;
  padding: 0 var(--pad-onboard);
  display: flex;
  flex-direction: column;
  gap: var(--gap-row);
}

.tgo__terms {
  margin-top: 10px;
  text-align: center;
  font-size: var(--fs-sub);
  color: var(--text-3);
  line-height: 1.35;
}
`

export default Onboarding