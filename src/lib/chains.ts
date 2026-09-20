/**
 * Tangem's chain taxonomy, mapped onto what the Namespace registry can hold.
 *
 * Tangem does not present a flat list of chains. It presents COINS — Bitcoin,
 * Ethereum, Tether, BNB, XRP… — and each coin expands into the NETWORKS that
 * coin lives on, each with its own toggle (`IMG_4303`, `IMG_4304`,
 * `IMG_4305`). So this file has two layers:
 *
 *   COINS      the eleven rows of Organize tokens, in Tangem's order
 *   NETWORKS   every toggle under them, writable or not
 *
 * Only some of those networks can be written to the registry. Add chain and
 * Organize tokens list the writable set. Unwritable chains (XRP, TRON, …)
 * stay in this file so the taxonomy is complete, but they are not offered as
 * toggles. `ChainKey` is the writable set and nothing else — `src/server/namespace.ts`
 * maps a `ChainKey` straight onto the SDK's `ChainName` enum, so every key here
 * must be a literal `ChainName` value or the write fails closed at runtime.
 *
 * Four things carried over from the D'CENT build, all verified against a live
 * name. Do not delete them:
 *
 * 1. `coin` is what we WRITE. It is not always what the world READS. The
 *    Namespace CCIP gateway remaps raw EVM chain IDs to their ENSIP-11 coin
 *    types on read, so Base is written as 8453 and resolves at 2147492101.
 *    `publicCoin` records that second number so the UI can verify a record
 *    through a standard ENS client.
 *
 * 2. Coin `2147483648` (0x80000000) is ENSIP-11's EVM fallback and it is OURS.
 *    A name mints bare (no addresses); the fallback is written alongside the
 *    first EVM address the user adds, so the name then resolves on EVM chains
 *    added later. The read-merge-write path in `namespace.ts` must recognise
 *    it or the second network write fails closed. `EVM_DEFAULT_COIN` below.
 *
 * 3. XRP cannot be written. The registry rejects coin type 144 outright
 *    ("addresses.5.coin is not a valid coin"). This is not an SDK gap and no
 *    client-side workaround exists. XRP is not offered as a toggle.
 *
 * 4. The ENSIP-11 number for any EVM chain is `2147483648 + chainId`. Every
 *    `publicCoin` below follows it; the three non-EVM chains do not.
 */

/** ENSIP-11's EVM fallback record. Mirrored in src/server/namespace.ts. */
export const EVM_DEFAULT_COIN = 2147483648

/**
 * The writable set. Each value is a literal `ChainName` from
 * `@thenamespace/offchain-manager` — see the note above before adding one.
 */
export type ChainKey =
  | 'btc'
  | 'eth'
  | 'arb'
  | 'base'
  | 'op'
  | 'linea'
  | 'scroll'
  | 'zksync'
  | 'zora'
  | 'polygon'
  | 'bsc'
  | 'avax'
  | 'sol'

export interface ChainSpec {
  key: ChainKey
  /** The SDK's ChainName enum value. Equal to `key` by construction. */
  name: string
  /** Coin type we write to the registry. */
  coin: number
  /** Coin type a public ENS client reads this record at. */
  publicCoin: number
  /** Human network name, e.g. "Arbitrum One". Used in errors and headers. */
  network: string
  /** Native ticker of the network, e.g. "ETH". */
  ticker: string
  color: string
  /** EVM chains share one address; non-EVM chains get their own keypair. */
  evm: boolean
  /** Prefix for any auto-generated account label, e.g. ETH-01. */
  accountPrefix: string
}

export const CHAINS: readonly ChainSpec[] = [
  { key: 'btc',     name: 'btc',     coin: 0,       publicCoin: 0,          network: 'Bitcoin',      ticker: 'BTC',   color: '#F7931A', evm: false, accountPrefix: 'BTC' },
  { key: 'eth',     name: 'eth',     coin: 60,      publicCoin: 60,         network: 'Ethereum',     ticker: 'ETH',   color: '#627EEA', evm: true,  accountPrefix: 'ETH' },
  { key: 'arb',     name: 'arb',     coin: 42161,   publicCoin: 2147525809, network: 'Arbitrum One', ticker: 'ETH',   color: '#12AAFF', evm: true,  accountPrefix: 'ARB' },
  { key: 'base',    name: 'base',    coin: 8453,    publicCoin: 2147492101, network: 'Base',         ticker: 'ETH',   color: '#0052FF', evm: true,  accountPrefix: 'BASE' },
  { key: 'op',      name: 'op',      coin: 10,      publicCoin: 2147483658, network: 'Optimism',     ticker: 'ETH',   color: '#FF0420', evm: true,  accountPrefix: 'OP' },
  { key: 'linea',   name: 'linea',   coin: 59144,   publicCoin: 2147542792, network: 'Linea',        ticker: 'ETH',   color: '#121212', evm: true,  accountPrefix: 'LINEA' },
  { key: 'scroll',  name: 'scroll',  coin: 534352,  publicCoin: 2148018000, network: 'Scroll',       ticker: 'ETH',   color: '#FFEEDA', evm: true,  accountPrefix: 'SCRL' },
  { key: 'zksync',  name: 'zksync',  coin: 324,     publicCoin: 2147483972, network: 'zkSync Era',   ticker: 'ETH',   color: '#1E69FF', evm: true,  accountPrefix: 'ZKS' },
  { key: 'zora',    name: 'zora',    coin: 7777777, publicCoin: 2155261425, network: 'Zora',         ticker: 'ETH',   color: '#2B5DF0', evm: true,  accountPrefix: 'ZORA' },
  { key: 'polygon', name: 'polygon', coin: 137,     publicCoin: 2147483785, network: 'Polygon',      ticker: 'POL',   color: '#8247E5', evm: true,  accountPrefix: 'POL' },
  { key: 'bsc',     name: 'bsc',     coin: 56,      publicCoin: 2147483704, network: 'BNB Smart Chain', ticker: 'BNB', color: '#F0B90B', evm: true, accountPrefix: 'BNB' },
  { key: 'avax',    name: 'avax',    coin: 43114,   publicCoin: 2147526762, network: 'Avalanche',    ticker: 'AVAX',  color: '#E84142', evm: true,  accountPrefix: 'AVAX' },
  { key: 'sol',     name: 'sol',     coin: 501,     publicCoin: 501,        network: 'Solana',       ticker: 'SOL',   color: '#14F195', evm: false, accountPrefix: 'SOL' },
] as const

export const CHAIN_BY_KEY: Record<ChainKey, ChainSpec> = Object.fromEntries(
  CHAINS.map((c) => [c.key, c]),
) as Record<ChainKey, ChainSpec>

export function chainByCoin(coin: number): ChainSpec | undefined {
  return CHAINS.find((c) => c.coin === coin || c.publicCoin === coin)
}

export function isChainKey(value: string): value is ChainKey {
  return CHAINS.some((c) => c.key === value)
}

/* ------------------------------------------------------------------------ */
/* Coins — the eleven rows of Manage tokens                                  */
/* ------------------------------------------------------------------------ */

export type CoinId =
  | 'bitcoin'
  | 'ethereum'
  | 'tether'
  | 'bnb'
  | 'xrp'
  | 'usdc'
  | 'solana'
  | 'tron'
  | 'hyperliquid'
  | 'dogecoin'
  | 'zcash'

export interface CoinSpec {
  id: CoinId
  /** Row title, e.g. "Bitcoin". */
  name: string
  /** Grey ticker beside it, e.g. "BTC". */
  ticker: string
}

/** Exactly the order Tangem lists them in, top to bottom (IMG_4302/IMG_4304). */
export const COINS: readonly CoinSpec[] = [
  { id: 'bitcoin',     name: 'Bitcoin',     ticker: 'BTC' },
  { id: 'ethereum',    name: 'Ethereum',    ticker: 'ETH' },
  { id: 'tether',      name: 'Tether',      ticker: 'USDT' },
  { id: 'bnb',         name: 'BNB',         ticker: 'BNB' },
  { id: 'xrp',         name: 'XRP',         ticker: 'XRP' },
  { id: 'usdc',        name: 'USDC',        ticker: 'USDC' },
  { id: 'solana',      name: 'Solana',      ticker: 'SOL' },
  { id: 'tron',        name: 'TRON',        ticker: 'TRX' },
  { id: 'hyperliquid', name: 'Hyperliquid', ticker: 'HYPE' },
  { id: 'dogecoin',    name: 'Dogecoin',    ticker: 'DOGE' },
  { id: 'zcash',       name: 'Zcash',       ticker: 'ZEC' },
] as const

export const COIN_BY_ID: Record<CoinId, CoinSpec> = Object.fromEntries(
  COINS.map((c) => [c.id, c]),
) as Record<CoinId, CoinSpec>

/* ------------------------------------------------------------------------ */
/* Networks — the toggles under each coin                                    */
/* ------------------------------------------------------------------------ */

/**
 * The blue tag Tangem prints after the network name. `MAIN` for a coin's home
 * chain, `MAIN L2` for a rollup, and a token standard for a coin that lives as
 * a contract on someone else's chain.
 */
export type NetworkTag = 'MAIN' | 'MAIN L2' | 'ERC20' | 'BEP20' | 'TRC20' | 'SPL'

export interface NetworkSpec {
  /** Stable id used everywhere else in the app, e.g. `eth-base`. */
  id: string
  coinId: CoinId
  /** Uppercase row title exactly as Tangem prints it: `ARBITRUM ONE`. */
  title: string
  tag: NetworkTag
  /** Sentence-case name for headers and warnings: "Arbitrum One". */
  network: string
  /** What the home token row is titled: "Base (ETH)" (IMG_4306). */
  rowName: string
  /** Ticker of the balance shown on that row. */
  ticker: string
  color: string
  /**
   * The address record this toggle writes. Present only when `writable`.
   * Several networks share a chain (USDC on Ethereum and ETH on Ethereum both
   * write coin 60) — that is correct: one address, many things arriving at it.
   */
  chain?: ChainKey
  /** false → render the row, disable the toggle, show `reason`. */
  writable: boolean
  /** Why it cannot be written. Shown to the user; never hide the network. */
  reason?: string
}

/** Reasons, written once so the same network never gets two explanations. */
const NO_COIN_TYPE = (coin: number, name: string) =>
  `The registry has no coin type for ${name} (SLIP-44 ${coin}), so this address cannot be stored on the name.`
const NO_EVM_ENTRY = (name: string) =>
  `${name} is not in the registry's chain list yet, so there is no coin type to write this address to.`

export const NETWORKS: readonly NetworkSpec[] = [
  // --- Bitcoin -----------------------------------------------------------
  { id: 'btc-main', coinId: 'bitcoin', title: 'BITCOIN', tag: 'MAIN', network: 'Bitcoin', rowName: 'Bitcoin', ticker: 'BTC', color: '#F7931A', chain: 'btc', writable: true },

  // --- Ethereum and its L2s (IMG_4305) ------------------------------------
  { id: 'eth-main',      coinId: 'ethereum', title: 'ETHEREUM',     tag: 'MAIN',    network: 'Ethereum',     rowName: 'Ethereum',        ticker: 'ETH', color: '#627EEA', chain: 'eth',    writable: true },
  { id: 'eth-arb-nova',  coinId: 'ethereum', title: 'ARBITRUM NOVA', tag: 'MAIN L2', network: 'Arbitrum Nova', rowName: 'Arbitrum Nova (ETH)', ticker: 'ETH', color: '#EF8220', writable: false, reason: NO_EVM_ENTRY('Arbitrum Nova') },
  { id: 'eth-arb',       coinId: 'ethereum', title: 'ARBITRUM ONE', tag: 'MAIN L2', network: 'Arbitrum One', rowName: 'Arbitrum One (ETH)', ticker: 'ETH', color: '#12AAFF', chain: 'arb',   writable: true },
  { id: 'eth-aurora',    coinId: 'ethereum', title: 'AURORA',       tag: 'MAIN L2', network: 'Aurora',       rowName: 'Aurora (ETH)',    ticker: 'ETH', color: '#70D44B', writable: false, reason: NO_EVM_ENTRY('Aurora') },
  { id: 'eth-base',      coinId: 'ethereum', title: 'BASE',         tag: 'MAIN L2', network: 'Base',         rowName: 'Base (ETH)',      ticker: 'ETH', color: '#0052FF', chain: 'base',  writable: true },
  { id: 'eth-blast',     coinId: 'ethereum', title: 'BLAST',        tag: 'MAIN L2', network: 'Blast',        rowName: 'Blast (ETH)',     ticker: 'ETH', color: '#FCFC03', writable: false, reason: NO_EVM_ENTRY('Blast') },
  { id: 'eth-cyber',     coinId: 'ethereum', title: 'CYBER',        tag: 'MAIN L2', network: 'Cyber',        rowName: 'Cyber (ETH)',     ticker: 'ETH', color: '#32A0FF', writable: false, reason: NO_EVM_ENTRY('Cyber') },
  { id: 'eth-linea',     coinId: 'ethereum', title: 'LINEA',        tag: 'MAIN L2', network: 'Linea',        rowName: 'Linea (ETH)',     ticker: 'ETH', color: '#121212', chain: 'linea', writable: true },
  { id: 'eth-op',        coinId: 'ethereum', title: 'OPTIMISM',     tag: 'MAIN L2', network: 'Optimism',     rowName: 'Optimism (ETH)',  ticker: 'ETH', color: '#FF0420', chain: 'op',    writable: true },
  { id: 'eth-scroll',    coinId: 'ethereum', title: 'SCROLL',       tag: 'MAIN L2', network: 'Scroll',       rowName: 'Scroll (ETH)',    ticker: 'ETH', color: '#EBC28E', chain: 'scroll', writable: true },
  { id: 'eth-taiko',     coinId: 'ethereum', title: 'TAIKO',        tag: 'MAIN L2', network: 'Taiko',        rowName: 'Taiko (ETH)',     ticker: 'ETH', color: '#E81899', writable: false, reason: NO_EVM_ENTRY('Taiko') },
  { id: 'eth-zksync',    coinId: 'ethereum', title: 'ZKSYNC ERA',   tag: 'MAIN L2', network: 'zkSync Era',   rowName: 'zkSync Era (ETH)', ticker: 'ETH', color: '#1E69FF', chain: 'zksync', writable: true },
  { id: 'eth-zora',      coinId: 'ethereum', title: 'ZORA',         tag: 'MAIN L2', network: 'Zora',         rowName: 'Zora (ETH)',      ticker: 'ETH', color: '#2B5DF0', chain: 'zora',  writable: true },

  // --- Tether: a token, so every row writes the host chain's address ------
  { id: 'usdt-eth',     coinId: 'tether', title: 'ETHEREUM',        tag: 'ERC20', network: 'Ethereum',        rowName: 'Tether',            ticker: 'USDT', color: '#26A17B', chain: 'eth',     writable: true },
  { id: 'usdt-bsc',     coinId: 'tether', title: 'BNB SMART CHAIN', tag: 'BEP20', network: 'BNB Smart Chain', rowName: 'Tether (BEP20)',    ticker: 'USDT', color: '#26A17B', chain: 'bsc',     writable: true },
  { id: 'usdt-polygon', coinId: 'tether', title: 'POLYGON',         tag: 'ERC20', network: 'Polygon',         rowName: 'Tether (Polygon)',  ticker: 'USDT', color: '#26A17B', chain: 'polygon', writable: true },
  { id: 'usdt-arb',     coinId: 'tether', title: 'ARBITRUM ONE',    tag: 'ERC20', network: 'Arbitrum One',    rowName: 'Tether (Arbitrum)', ticker: 'USDT', color: '#26A17B', chain: 'arb',     writable: true },
  { id: 'usdt-sol',     coinId: 'tether', title: 'SOLANA',          tag: 'SPL',   network: 'Solana',          rowName: 'Tether (SPL)',      ticker: 'USDT', color: '#26A17B', chain: 'sol',     writable: true },
  { id: 'usdt-tron',    coinId: 'tether', title: 'TRON',            tag: 'TRC20', network: 'Tron',            rowName: 'Tether (TRC20)',    ticker: 'USDT', color: '#26A17B', writable: false, reason: NO_COIN_TYPE(195, 'Tron') },

  // --- BNB (IMG_4303) -----------------------------------------------------
  { id: 'bnb-smart',  coinId: 'bnb', title: 'BNB SMART CHAIN',  tag: 'MAIN',  network: 'BNB Smart Chain',  rowName: 'BNB',          ticker: 'BNB', color: '#F0B90B', chain: 'bsc', writable: true },
  { id: 'bnb-beacon', coinId: 'bnb', title: 'BNB BEACON CHAIN', tag: 'MAIN',  network: 'BNB Beacon Chain', rowName: 'BNB (Beacon)', ticker: 'BNB', color: '#F0B90B', writable: false, reason: NO_COIN_TYPE(714, 'BNB Beacon Chain') },
  { id: 'bnb-erc20',  coinId: 'bnb', title: 'ETHEREUM',         tag: 'ERC20', network: 'Ethereum',         rowName: 'BNB (ERC20)',  ticker: 'BNB', color: '#F0B90B', chain: 'eth', writable: true },

  // --- XRP: the one everybody assumes works ------------------------------
  {
    id: 'xrp-main', coinId: 'xrp', title: 'XRP LEDGER', tag: 'MAIN', network: 'XRP Ledger',
    rowName: 'XRP', ticker: 'XRP', color: '#23292F', writable: false,
    reason: 'The registry rejects coin type 144 outright, so an XRP address cannot be written to a name. No client-side workaround exists.',
  },

  // --- USDC ---------------------------------------------------------------
  { id: 'usdc-eth',     coinId: 'usdc', title: 'ETHEREUM',      tag: 'ERC20', network: 'Ethereum',      rowName: 'USDC',            ticker: 'USDC', color: '#2775CA', chain: 'eth',     writable: true },
  { id: 'usdc-base',    coinId: 'usdc', title: 'BASE',          tag: 'ERC20', network: 'Base',          rowName: 'USDC (Base)',     ticker: 'USDC', color: '#2775CA', chain: 'base',    writable: true },
  { id: 'usdc-arb',     coinId: 'usdc', title: 'ARBITRUM ONE',  tag: 'ERC20', network: 'Arbitrum One',  rowName: 'USDC (Arbitrum)', ticker: 'USDC', color: '#2775CA', chain: 'arb',     writable: true },
  { id: 'usdc-op',      coinId: 'usdc', title: 'OPTIMISM',      tag: 'ERC20', network: 'Optimism',      rowName: 'USDC (Optimism)', ticker: 'USDC', color: '#2775CA', chain: 'op',      writable: true },
  { id: 'usdc-polygon', coinId: 'usdc', title: 'POLYGON',       tag: 'ERC20', network: 'Polygon',       rowName: 'USDC (Polygon)',  ticker: 'USDC', color: '#2775CA', chain: 'polygon', writable: true },
  { id: 'usdc-avax',    coinId: 'usdc', title: 'AVALANCHE',     tag: 'ERC20', network: 'Avalanche',     rowName: 'USDC (Avalanche)', ticker: 'USDC', color: '#2775CA', chain: 'avax',   writable: true },
  { id: 'usdc-sol',     coinId: 'usdc', title: 'SOLANA',        tag: 'SPL',   network: 'Solana',        rowName: 'USDC (SPL)',      ticker: 'USDC', color: '#2775CA', chain: 'sol',     writable: true },

  // --- Solana (IMG_4304) --------------------------------------------------
  { id: 'sol-main', coinId: 'solana', title: 'SOLANA', tag: 'MAIN', network: 'Solana', rowName: 'Solana', ticker: 'SOL', color: '#14F195', chain: 'sol', writable: true },

  // --- The remaining four coins, none of which the registry can hold ------
  {
    id: 'tron-main', coinId: 'tron', title: 'TRON', tag: 'MAIN', network: 'Tron',
    rowName: 'TRON', ticker: 'TRX', color: '#EB0029', writable: false,
    reason: NO_COIN_TYPE(195, 'Tron'),
  },
  {
    id: 'hype-evm', coinId: 'hyperliquid', title: 'HYPEREVM', tag: 'MAIN', network: 'HyperEVM',
    rowName: 'Hyperliquid', ticker: 'HYPE', color: '#072723', writable: false,
    reason: NO_EVM_ENTRY('HyperEVM'),
  },
  {
    id: 'doge-main', coinId: 'dogecoin', title: 'DOGECOIN', tag: 'MAIN', network: 'Dogecoin',
    rowName: 'Dogecoin', ticker: 'DOGE', color: '#C2A633', writable: false,
    reason: NO_COIN_TYPE(3, 'Dogecoin'),
  },
  {
    id: 'zec-main', coinId: 'zcash', title: 'ZCASH', tag: 'MAIN', network: 'Zcash',
    rowName: 'Zcash', ticker: 'ZEC', color: '#ECB244', writable: false,
    reason: NO_COIN_TYPE(133, 'Zcash'),
  },
] as const

export const NETWORK_BY_ID: Record<string, NetworkSpec> = Object.fromEntries(
  NETWORKS.map((n) => [n.id, n]),
)

export function networksForCoin(coinId: CoinId): NetworkSpec[] {
  return NETWORKS.filter((n) => n.coinId === coinId)
}

export function writableNetworksForCoin(coinId: CoinId): NetworkSpec[] {
  return networksForCoin(coinId).filter((n) => n.writable)
}

export function networkById(id: string): NetworkSpec | undefined {
  return NETWORK_BY_ID[id]
}

/**
 * True when every network under a coin is unwritable. Organize tokens drops
 * these coins rather than showing a row that cannot be turned on.
 */
export function coinIsUnsupported(coinId: CoinId): boolean {
  return networksForCoin(coinId).every((n) => !n.writable)
}

/** The chains a set of enabled network ids actually needs address records for. */
export function chainsForNetworks(ids: readonly string[]): ChainKey[] {
  const seen = new Set<ChainKey>()
  for (const id of ids) {
    const chain = NETWORK_BY_ID[id]?.chain
    if (chain) seen.add(chain)
  }
  // Return in CHAINS order so writes are deterministic and easy to read in logs.
  return CHAINS.filter((c) => seen.has(c.key)).map((c) => c.key)
}
