/**
 * Asset metadata and the one place simulated market data lives.
 *
 * ================= SIMULATED DATA — NOT A PRICE FEED =================
 * Every price and percentage in this file is a hardcoded constant, chosen to
 * sit close to the reference screenshots (IMG_4296, IMG_4306) so the app looks
 * like a wallet rather than a stub. Nothing here is fetched, nothing here
 * updates, and no screen should ever present it as live. Balances are zero
 * because the demo wallet is genuinely empty — the seed in localStorage is a
 * real spendable key and must never be funded.
 *
 * The names, however, are real. `src/wallet/api.ts` writes them to the ENS
 * registry under `tange.eth` for actual money to arrive at. That asymmetry is
 * the whole point of the demo, so keep the fake half fenced off here.
 * =====================================================================
 */
import { COINS, COIN_BY_ID, NETWORK_BY_ID, type CoinId, type NetworkSpec } from './chains'

export interface AssetMeta {
  id: CoinId
  /** Full name as Tangem prints it: "Bitcoin". */
  name: string
  ticker: string
  /** Brand colour, used for the coin mark's fill. */
  color: string
  /** Foreground colour for the mark, picked for contrast against `color`. */
  ink: string
  /**
   * A single glyph standing in for the coin's logo. No image assets ship with
   * this build, so the mark is drawn as text inside a circle — which is also
   * how Tangem renders a token it has no icon for.
   */
  mark: string
  /** SIMULATED spot price in USD. */
  price: number
  /** SIMULATED 24h change, as a signed percentage. */
  change24h: number
}

/**
 * Keyed by coin, in Tangem's list order. Prices are anchored to the values
 * legible in IMG_4306 (BTC $77,974.62 −0.38 %, ETH $2,454.50 −0.09 %); the
 * rest are plausible values from the same afternoon.
 */
export const ASSETS: Record<CoinId, AssetMeta> = {
  bitcoin:     { id: 'bitcoin',     name: 'Bitcoin',     ticker: 'BTC',  color: '#F7931A', ink: '#FFFFFF', mark: '₿', price: 77974.62, change24h: -0.38 },
  ethereum:    { id: 'ethereum',    name: 'Ethereum',    ticker: 'ETH',  color: '#627EEA', ink: '#FFFFFF', mark: 'Ξ', price: 2454.50,  change24h: -0.09 },
  tether:      { id: 'tether',      name: 'Tether',      ticker: 'USDT', color: '#26A17B', ink: '#FFFFFF', mark: '₮', price: 1.0,      change24h: 0.01 },
  bnb:         { id: 'bnb',         name: 'BNB',         ticker: 'BNB',  color: '#B8B8B8', ink: '#FFFFFF', mark: '◈', price: 604.18,   change24h: -1.12 },
  xrp:         { id: 'xrp',         name: 'XRP',         ticker: 'XRP',  color: '#23292F', ink: '#FFFFFF', mark: '✕', price: 2.14,     change24h: 0.42 },
  usdc:        { id: 'usdc',        name: 'USDC',        ticker: 'USDC', color: '#2775CA', ink: '#FFFFFF', mark: '$', price: 1.0,      change24h: 0.0 },
  solana:      { id: 'solana',      name: 'Solana',      ticker: 'SOL',  color: '#9945FF', ink: '#FFFFFF', mark: '≋', price: 138.62,   change24h: -0.87 },
  tron:        { id: 'tron',        name: 'TRON',        ticker: 'TRX',  color: '#1B1B1B', ink: '#FFFFFF', mark: '▽', price: 0.2914,   change24h: 0.24 },
  hyperliquid: { id: 'hyperliquid', name: 'Hyperliquid', ticker: 'HYPE', color: '#072723', ink: '#97FCE4', mark: '∞', price: 34.18,    change24h: -2.05 },
  dogecoin:    { id: 'dogecoin',    name: 'Dogecoin',    ticker: 'DOGE', color: '#C2A633', ink: '#FFFFFF', mark: 'Ð', price: 0.1482,   change24h: -1.31 },
  zcash:       { id: 'zcash',       name: 'Zcash',       ticker: 'ZEC',  color: '#B0B0B0', ink: '#FFFFFF', mark: 'ⓩ', price: 42.60,    change24h: 3.11 },
}

/** Tangem's list order, for any screen that wants to walk every coin. */
export const ASSET_LIST: readonly AssetMeta[] = COINS.map((c) => ASSETS[c.id])

export function assetFor(coinId: CoinId): AssetMeta {
  return ASSETS[coinId]
}

/** The asset behind a network toggle, e.g. `eth-base` → Ethereum. */
export function assetForNetwork(networkId: string): AssetMeta | undefined {
  const network = NETWORK_BY_ID[networkId]
  return network ? ASSETS[network.coinId] : undefined
}

/** SIMULATED. Fiat value of a holding. Every balance in this demo is zero. */
export function fiatValue(coinId: CoinId, balance: number): number {
  return balance * ASSETS[coinId].price
}

/**
 * One row of the home token list (IMG_4306): coin mark, network row name,
 * simulated price and change on the left, fiat and coin balance on the right.
 *
 * A row is a NETWORK, not a coin — that is why the third row reads
 * "Base (ETH)" rather than a second "Ethereum".
 */
export interface TokenRow {
  networkId: string
  network: NetworkSpec
  asset: AssetMeta
  /** What the row title reads, from NetworkSpec.rowName. */
  name: string
  ticker: string
  /** Address this row receives at, or '' before the wallet has booted. */
  address: string
  /** SIMULATED — always 0 in this build. */
  balance: number
  /** SIMULATED — always 0 in this build. */
  fiat: number
  price: number
  change24h: number
  /** false when the registry cannot hold this network's address record. */
  writable: boolean
}

export function tokenRow(networkId: string, address: string): TokenRow | undefined {
  const network = NETWORK_BY_ID[networkId]
  if (!network) return undefined
  const asset = ASSETS[network.coinId]
  return {
    networkId,
    network,
    asset,
    name: network.rowName,
    ticker: network.ticker,
    address,
    balance: 0,
    fiat: 0,
    price: asset.price,
    change24h: asset.change24h,
    writable: network.writable,
  }
}

/**
 * The home list, in the order the user enabled the networks — Tangem keeps
 * whatever order Organize tokens left them in rather than re-sorting.
 */
export function tokenRows(
  enabledIds: readonly string[],
  addressFor: (networkId: string) => string,
): TokenRow[] {
  const rows: TokenRow[] = []
  for (const id of enabledIds) {
    const row = tokenRow(id, addressFor(id))
    if (row) rows.push(row)
  }
  return rows
}

/** SIMULATED. The `$0.00` above the wallet name. */
export function portfolioTotal(rows: readonly TokenRow[]): number {
  return rows.reduce((sum, row) => sum + row.fiat, 0)
}

export { COIN_BY_ID }
