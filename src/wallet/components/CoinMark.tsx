'use client'

/**
 * The round coin marks, and the small blue network dot that sits on them.
 *
 * Three facts from the screenshots drive this file:
 *
 *  1. Not every mark has a disc. Bitcoin is a white glyph on an orange circle
 *     (IMG_4306), but Ethereum is a bare diamond with no background at all, and
 *     so is Solana. So a mark is `{ bg?, art }`, not "always a coloured disc".
 *  2. Manage tokens greys a coin's mark until that coin is in the portfolio
 *     (IMG_4302 — Tether, BNB, USDC and TRON all sample monochrome). That is
 *     the `muted` prop, and it is a greyscale filter rather than a second set
 *     of colours, because the greys DESIGN.md sampled are just the brand marks
 *     desaturated.
 *  3. The per-network rows (IMG_4303, IMG_4305) put the network's logo on a
 *     #F1F1F1 disc with an accent-blue dot at the top-right, separated from the
 *     art by a ring of the card behind it. That ring is why `dot` needs to know
 *     the surrounding colour — it defaults to white, which every card is.
 *
 * Only the four marks a screenshot actually shows are drawn by hand. Everything
 * else falls back to the coin's glyph from `src/lib/assets.ts` on its brand
 * colour — which is also what the real app does with a token it has no icon for.
 */

import { useId } from 'react'
import type { ReactNode } from 'react'
import { ASSETS, type AssetMeta } from '@/lib/assets'
import { NETWORK_BY_ID, type CoinId } from '@/lib/chains'

interface Art {
  /** Disc colour behind the art. Omitted for marks that are just a shape. */
  bg?: string
  art: ReactNode
}

/** Every path below is drawn in a 32 x 32 box and scaled by the `size` prop. */
function bitcoin(): Art {
  return {
    bg: 'var(--coin-btc)',
    art: (
      <text
        x="16"
        y="23"
        textAnchor="middle"
        fontSize="19"
        fontWeight="700"
        fill="#fff"
        fontFamily="Helvetica, Arial, sans-serif"
      >
        ₿
      </text>
    ),
  }
}

/** The lavender-grey octahedron. No disc — IMG_4306 draws it on bare card. */
function ethereum(): Art {
  return {
    art: (
      <g>
        <path d="M16 2.6 8.9 16.1 16 20.2Z" fill="var(--coin-eth-light)" />
        <path d="M16 2.6 23.1 16.1 16 20.2Z" fill="var(--coin-eth-mid)" />
        <path d="M16 22 8.9 17.9 16 29.4Z" fill="var(--coin-eth-mid)" />
        <path d="M16 22 23.1 17.9 16 29.4Z" fill="var(--coin-eth-dark)" />
      </g>
    ),
  }
}

/** Base: a thick blue ring with a bar running from the left edge to the centre. */
function base(): Art {
  return {
    art: (
      <g>
        <circle cx="16" cy="16" r="13.2" fill="none" stroke="var(--coin-base)" strokeWidth="5.6" />
        <rect x="3.4" y="15" width="12.6" height="2" fill="var(--coin-base)" />
      </g>
    ),
  }
}

/** Solana: three slanted bars, purple into mint. No disc. */
function solana(gradientId: string): Art {
  return {
    art: (
      <g>
        <defs>
          <linearGradient id={gradientId} x1="6" y1="26" x2="26" y2="6">
            <stop offset="0" stopColor="var(--coin-sol-from)" />
            <stop offset="1" stopColor="var(--coin-sol-to)" />
          </linearGradient>
        </defs>
        <path d="M9.4 9.2h16.4l-3.2 3.6H6.2l3.2-3.6Z" fill={`url(#${gradientId})`} />
        <path d="M6.2 14.2h16.4l3.2 3.6H9.4l-3.2-3.6Z" fill={`url(#${gradientId})`} />
        <path d="M9.4 19.2h16.4l-3.2 3.6H6.2l3.2-3.6Z" fill={`url(#${gradientId})`} />
      </g>
    ),
  }
}

/** The fallback: the coin's glyph, white on its brand colour. */
function glyphDisc(asset: AssetMeta): Art {
  return {
    bg: asset.color,
    art: (
      <text
        x="16"
        y="22.4"
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        fill={asset.ink}
        fontFamily="Helvetica, Arial, sans-serif"
      >
        {asset.mark}
      </text>
    ),
  }
}

/** A network with no logo of its own: its initial on the network's colour. */
function letterDisc(letter: string, color: string): Art {
  return {
    bg: color,
    art: (
      <text
        x="16"
        y="21.8"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="#fff"
        fontFamily="Helvetica, Arial, sans-serif"
      >
        {letter}
      </text>
    ),
  }
}

function artForCoin(coinId: CoinId, gradientId: string): Art {
  switch (coinId) {
    case 'bitcoin':
      return bitcoin()
    case 'ethereum':
      return ethereum()
    case 'solana':
      return solana(gradientId)
    default:
      return glyphDisc(ASSETS[coinId])
  }
}

/**
 * Which drawing a network row gets. `eth-base` is Base, not Ethereum — the row
 * shows the network's logo, which is the whole point of the sub-list.
 */
function artForNetwork(networkId: string, gradientId: string): Art {
  const network = NETWORK_BY_ID[networkId]
  if (!network) return letterDisc('?', '#B8B8B8')
  if (networkId === 'eth-base' || networkId === 'usdc-base') return base()
  if (network.chain === 'sol' && network.coinId === 'solana') return solana(gradientId)
  // A token row (USDC on Base, Tether on Tron) keeps its own coin's mark.
  if (network.coinId !== 'ethereum') return artForCoin(network.coinId, gradientId)
  if (networkId === 'eth-main') return ethereum()
  return letterDisc(network.title.charAt(0), network.color)
}

/* ---------------------------------------------------------------- rendering */

function Mark({
  art,
  size,
  muted,
  dot,
  dotRing,
  discBg,
  title,
}: {
  art: Art
  size: number
  muted: boolean
  dot: boolean
  dotRing: string
  /** Forces a disc behind art that has none — the network rows do this. */
  discBg?: string
  title?: string
}) {
  const bg = discBg ?? art.bg
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
      }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        style={{ display: 'block', filter: muted ? 'grayscale(1)' : undefined }}
      >
        {bg && <circle cx="16" cy="16" r="16" fill={bg} />}
        {art.art}
      </svg>
      {dot && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: Math.round(size * 0.3),
            height: Math.round(size * 0.3),
            borderRadius: '999px',
            background: 'var(--accent)',
            boxShadow: `0 0 0 ${Math.max(1.5, size * 0.075)}px ${dotRing}`,
          }}
        />
      )}
    </span>
  )
}

/**
 * A coin's mark — the eleven rows of Manage tokens, and any header that names
 * a coin rather than a network.
 */
export function CoinMark({
  coinId,
  size = 35,
  muted = false,
  dot = false,
  dotRing = 'var(--bg-card)',
  label,
}: {
  coinId: CoinId
  size?: number
  /** Greyscale, for a coin not yet in the portfolio (IMG_4302). */
  muted?: boolean
  /** The small accent dot at the top-right (IMG_4305). */
  dot?: boolean
  /** Colour of the ring separating the dot from the art behind it. */
  dotRing?: string
  label?: string
}) {
  const gradientId = useId()
  return (
    <Mark
      art={artForCoin(coinId, gradientId)}
      size={size}
      muted={muted}
      dot={dot}
      dotRing={dotRing}
      title={label}
    />
  )
}

/**
 * A network's mark. Home token rows use it bare at 39px; the indented network
 * rows in Manage tokens use it at 22px, muted, dotted, on the sampled #F1F1F1
 * disc those rows draw behind every logo.
 */
export function NetworkMark({
  networkId,
  size = 22,
  muted = false,
  dot = false,
  disc = false,
  dotRing = 'var(--bg-card)',
  label,
}: {
  networkId: string
  size?: number
  muted?: boolean
  dot?: boolean
  /** The grey plate the network rows put behind the logo. */
  disc?: boolean
  dotRing?: string
  label?: string
}) {
  const gradientId = useId()
  const art = artForNetwork(networkId, gradientId)
  return (
    <Mark
      art={art}
      size={size}
      muted={muted}
      dot={dot}
      dotRing={dotRing}
      discBg={disc && !art.bg ? NETWORK_DISC : undefined}
      title={label}
    />
  )
}

/** IMG_4305 (280, 1490). The plate under a network row's logo. */
const NETWORK_DISC = '#F1F1F1'
