/**
 * Deterministic demo keys, derived in the browser from one stored seed.
 *
 * A hardware wallet holds the keys; there is no "connect wallet" step to
 * imitate. So this app behaves the same way: it holds keys, and it signs with
 * them silently. One 32-byte seed lives in localStorage and every chain's
 * keypair is derived from it, so the same browser always shows the same
 * wallet and a reset genuinely starts over.
 *
 * Each wallet in the app is its own identity, so each one gets its own account
 * index and every derivation below takes it. Account 0 keeps the original
 * purpose strings ('evm', 'btc/0', 'sol/0') so a browser that already holds a
 * seed keeps the addresses — and the name — its first wallet was minted with.
 *
 * These are real, well-formed keys and real, well-formed addresses — the
 * Namespace registry validates address format per coin type, so a plausible
 * fake would be rejected. They are NOT for funding: the seed sits in
 * localStorage in plain text. The UI says so.
 */
import { secp256k1 } from '@noble/curves/secp256k1'
import { ed25519 } from '@noble/curves/ed25519'
import { sha256 } from '@noble/hashes/sha256'
import { ripemd160 } from '@noble/hashes/ripemd160'
import { keccak_256 } from '@noble/hashes/sha3'
import { bech32, base58 } from '@scure/base'
import type { ChainKey } from './chains'

const SEED_KEY = 'tangem.demo.seed.v1'

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

/** Reads the stored seed, creating one on first run. */
export function getSeed(): Uint8Array {
  if (typeof window === 'undefined') throw new Error('getSeed is browser-only')
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(SEED_KEY)
  } catch {
    // Private mode or blocked storage — fall through to an ephemeral seed.
  }
  if (stored && /^[0-9a-f]{64}$/.test(stored)) {
    const bytes = new Uint8Array(32)
    for (let i = 0; i < 32; i += 1) bytes[i] = parseInt(stored.slice(i * 2, i * 2 + 2), 16)
    return bytes
  }
  const seed = crypto.getRandomValues(new Uint8Array(32))
  try {
    window.localStorage.setItem(SEED_KEY, toHex(seed))
  } catch {
    // Non-persistent session. The wallet still works for this page load.
  }
  return seed
}

export function resetSeed(): void {
  try {
    window.localStorage.removeItem(SEED_KEY)
  } catch {
    // Nothing to clear.
  }
}

function derive(seed: Uint8Array, purpose: string): Uint8Array {
  return sha256(concat(seed, utf8(purpose)))
}

/** Account 0 keeps the pre-multi-wallet purpose string; later ones are suffixed. */
function evmPurpose(account: number): string {
  return account === 0 ? 'evm' : `evm/${account}`
}

/** EVM private key, shared by every EVM chain within one wallet. */
export function evmPrivateKey(seed: Uint8Array, account = 0): `0x${string}` {
  return `0x${toHex(derive(seed, evmPurpose(account)))}`
}

export function evmAddress(seed: Uint8Array, account = 0): `0x${string}` {
  const priv = derive(seed, evmPurpose(account))
  const pub = secp256k1.getPublicKey(priv, false).slice(1) // strip 0x04 prefix
  const hash = keccak_256(pub)
  return `0x${toHex(hash.slice(-20))}` as `0x${string}`
}

/** Native SegWit (P2WPKH) — the `bc1…` form D'CENT defaults to. */
export function btcAddress(seed: Uint8Array, index = 0): string {
  const priv = derive(seed, `btc/${index}`)
  const pub = secp256k1.getPublicKey(priv, true) // compressed
  const hash160 = ripemd160(sha256(pub))
  const words = bech32.toWords(hash160)
  return bech32.encode('bc', [0, ...words])
}

/** Solana addresses are the base58 of the raw ed25519 public key. */
export function solAddress(seed: Uint8Array, index = 0): string {
  const priv = derive(seed, `sol/${index}`)
  const pub = ed25519.getPublicKey(priv)
  return base58.encode(pub)
}

/**
 * The address one wallet receives at on one chain. `account` is the wallet's
 * own index, so two wallets in the app are two different identities on every
 * chain rather than one identity wearing two labels.
 */
export function addressFor(seed: Uint8Array, chain: ChainKey, account = 0): string {
  switch (chain) {
    case 'btc':
      return btcAddress(seed, account)
    case 'sol':
      return solAddress(seed, account)
    default:
      // Every EVM chain shares the one address, which is what a real wallet does.
      return evmAddress(seed, account)
  }
}

/**
 * Signs the ownership proof the server checks before it writes a name.
 * Not a session, not SIWE — one message, one signature, verified once.
 */
export async function signOwnership(
  seed: Uint8Array,
  message: string,
  account = 0,
): Promise<`0x${string}`> {
  const { privateKeyToAccount } = await import('viem/accounts')
  const signer = privateKeyToAccount(evmPrivateKey(seed, account))
  return signer.signMessage({ message })
}
