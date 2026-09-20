'use client'

/**
 * Coin and network marks. Art is vendored from @web3icons/core (MIT) into
 * `public/marks/` — background (logo on a brand plate) and branded (glyph).
 *
 * Three facts still drive the layout:
 *
 *  1. Not every mark has a disc. Ethereum and Solana stay branded, with no
 *     kit circle — the same treatment Tangem uses for those two. Everything
 *     else uses the background plate, circle-cropped here.
 *  2. Manage tokens greys a coin's mark until that coin is in the portfolio.
 *     That is the `muted` prop: `filter: grayscale(1)` on the art, not a
 *     second palette. The status dot is outside the filter, so it stays blue.
 *  3. Per-network rows put the glyph on a #F1F1F1 disc with an accent-blue
 *     dot at the top-right. `disc` selects the branded file so we never stack
 *     a background plate on that grey circle.
 *
 * Token-on-host rows (USDT, USDC, BEP20 / ERC20 / SPL / TRC20) keep the
 * token's mark, not the host chain's.
 */

import { ASSETS } from '@/lib/assets'
import {
  NETWORK_BY_ID,
  NETWORKS,
  type CoinId,
  type NetworkSpec,
} from '@/lib/chains'

type Variant = 'branded' | 'background'

interface Resolved {
  src: string
  /** True when the SVG already paints a brand-coloured plate. */
  filled: boolean
}

const TOKEN_SLUG: Record<Exclude<CoinId, 'hyperliquid'>, string> = {
  bitcoin: 'btc',
  ethereum: 'eth',
  tether: 'usdt',
  bnb: 'bnb',
  xrp: 'xrp',
  usdc: 'usdc',
  solana: 'sol',
  tron: 'trx',
  dogecoin: 'doge',
  zcash: 'zec',
}

/**
 * Network-identity files. Token-on-host rows never consult this — they go
 * through the coin map instead.
 */
const NETWORK_FILE: Record<string, { kind: 'networks' | 'tokens'; file: string }> = {
  'btc-main': { kind: 'networks', file: 'bitcoin' },
  'eth-main': { kind: 'networks', file: 'ethereum' },
  'eth-arb-nova': { kind: 'networks', file: 'arbitrum-nova' },
  'eth-arb': { kind: 'networks', file: 'arbitrum-one' },
  'eth-aurora': { kind: 'networks', file: 'aurora' },
  'eth-base': { kind: 'networks', file: 'base' },
  'eth-blast': { kind: 'networks', file: 'blast' },
  'eth-cyber': { kind: 'tokens', file: 'cyber' },
  'eth-linea': { kind: 'networks', file: 'linea' },
  'eth-op': { kind: 'networks', file: 'optimism' },
  'eth-scroll': { kind: 'networks', file: 'scroll' },
  'eth-taiko': { kind: 'networks', file: 'taiko' },
  'eth-zksync': { kind: 'networks', file: 'zksync' },
  'eth-zora': { kind: 'networks', file: 'zora' },
  'bnb-smart': { kind: 'networks', file: 'binance-smart-chain' },
  'bnb-beacon': { kind: 'tokens', file: 'bnb' },
  'xrp-main': { kind: 'networks', file: 'xrp' },
  'sol-main': { kind: 'networks', file: 'solana' },
  'tron-main': { kind: 'networks', file: 'tron' },
  'hype-evm': { kind: 'networks', file: 'hyper-evm' },
  'doge-main': { kind: 'tokens', file: 'doge' },
  'zec-main': { kind: 'tokens', file: 'zec' },
}

/** IMG_4305. The plate under a network row's logo when the art has no circle. */
const NETWORK_DISC = '#F1F1F1'

function isTokenOnHost(network: NetworkSpec): boolean {
  return (
    network.tag === 'ERC20' ||
    network.tag === 'BEP20' ||
    network.tag === 'TRC20' ||
    network.tag === 'SPL'
  )
}

function coinVariant(coinId: CoinId): Variant {
  return coinId === 'ethereum' || coinId === 'solana' ? 'branded' : 'background'
}

function resolveCoin(coinId: CoinId, variant: Variant): Resolved {
  if (coinId === 'hyperliquid') {
    return {
      src: `/marks/networks/${variant}/hyper-evm.svg`,
      filled: variant === 'background',
    }
  }
  return {
    src: `/marks/tokens/${variant}/${TOKEN_SLUG[coinId]}.svg`,
    filled: variant === 'background',
  }
}

function resolveNetwork(networkId: string, disc: boolean): Resolved | null {
  const network = NETWORK_BY_ID[networkId]
  if (!network) return null

  if (isTokenOnHost(network)) {
    const variant = disc ? 'branded' : coinVariant(network.coinId)
    return resolveCoin(network.coinId, variant)
  }

  const file = NETWORK_FILE[networkId]
  if (!file) return null

  const variant: Variant = disc
    ? 'branded'
    : networkId === 'eth-main' || networkId === 'sol-main'
      ? 'branded'
      : 'background'

  return {
    src: `/marks/${file.kind}/${variant}/${file.file}.svg`,
    filled: variant === 'background',
  }
}

for (const network of NETWORKS) {
  if (isTokenOnHost(network)) continue
  if (!NETWORK_FILE[network.id]) {
    throw new Error(`missing network mark mapping for ${network.id}`)
  }
}

function letterFallback(letter: string, color: string, size: number) {
  return (
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        borderRadius: '999px',
        background: color,
        color: '#fff',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontWeight: 700,
        fontSize: Math.round(size * 0.47),
        lineHeight: 1,
      }}
    >
      {letter}
    </span>
  )
}

function Mark({
  src,
  filled,
  size,
  muted,
  dot,
  dotRing,
  disc,
  title,
  fallback,
}: {
  src: string | null
  filled: boolean
  size: number
  muted: boolean
  dot: boolean
  dotRing: string
  disc: boolean
  title?: string
  fallback: ReturnType<typeof letterFallback>
}) {
  const plate = disc && !filled
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
      <span
        style={{
          display: 'block',
          width: size,
          height: size,
          borderRadius: '999px',
          background: plate ? NETWORK_DISC : undefined,
          overflow: filled ? 'hidden' : undefined,
          filter: muted ? 'grayscale(1)' : undefined,
        }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            width={size}
            height={size}
            draggable={false}
            style={{
              display: 'block',
              width: size,
              height: size,
              objectFit: 'contain',
              // Branded glyphs on the grey plate need a little air — Base's
              // mark is a full-bleed rounded square and would otherwise fill
              // the disc.
              boxSizing: 'border-box',
              padding: plate ? Math.max(2, Math.round(size * 0.12)) : 0,
            }}
          />
        ) : (
          fallback
        )}
      </span>
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
  const art = resolveCoin(coinId, coinVariant(coinId))
  const asset = ASSETS[coinId]
  return (
    <Mark
      src={art.src}
      filled={art.filled}
      size={size}
      muted={muted}
      dot={dot}
      dotRing={dotRing}
      disc={false}
      title={label}
      fallback={letterFallback(asset.mark, asset.color, size)}
    />
  )
}

/**
 * A network's mark. Home token rows use it bare at 39px; the indented network
 * rows in Manage tokens use it at 22px, muted, dotted, on the sampled #F1F1F1
 * disc those rows draw behind every logo that has no built-in plate.
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
  const art = resolveNetwork(networkId, disc)
  const network = NETWORK_BY_ID[networkId]
  const letter = network?.title.charAt(0) ?? '?'
  const color = network?.color ?? '#B8B8B8'
  return (
    <Mark
      src={art?.src ?? null}
      filled={art?.filled ?? false}
      size={size}
      muted={muted}
      dot={dot}
      dotRing={dotRing}
      disc={disc}
      title={label}
      fallback={letterFallback(letter, color, size)}
    />
  )
}
