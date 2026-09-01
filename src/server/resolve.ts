import 'server-only'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import { getCoderByCoinType } from '@ensdomains/address-encoder'
import { getServerConfig } from './config'
import { readName } from './namespace'
import { httpError } from './http'
import { CHAIN_BY_KEY, type ChainKey } from '@/lib/chains'

export type ResolutionSource = 'internal' | 'ens'

export interface Resolution {
  /** The name as it should be displayed back to the user. */
  name: string
  address: string
  source: ResolutionSource
  /** Which coin type answered, so the UI can show what was actually queried. */
  coinType: number
}

/**
 * Two different lookups hide behind one input field.
 *
 * A bare label, or anything under our own parent, is answered from the
 * registry we write to — it is authoritative, it is one request, and it works
 * for a name claimed seconds ago before any gateway has seen it.
 *
 * Anything else is a name we do not issue (`vitalik.eth`, `someone.id`), so it
 * goes through standard ENS with CCIP-Read via viem. That path is what proves
 * the wallet resolves the whole namespace, not just its own corner of it.
 */
export function classify(input: string): { kind: ResolutionSource; query: string } {
  const cfg = getServerConfig()
  const raw = input.trim().toLowerCase()
  if (!raw) throw httpError('No name given', 400, 'NAME_MISSING')

  if (!raw.includes('.')) {
    return { kind: 'internal', query: raw }
  }
  if (raw === cfg.parentName || raw.endsWith(`.${cfg.parentName}`)) {
    return { kind: 'internal', query: raw.slice(0, raw.length - cfg.parentName.length - 1) }
  }
  return { kind: 'ens', query: raw }
}

let client: ReturnType<typeof createPublicClient> | null = null
function ensClient() {
  if (!client) {
    const rpc = process.env.ENS_RPC_URL?.trim()
    client = createPublicClient({
      chain: mainnet,
      transport: http(rpc || undefined),
    })
  }
  return client
}

/**
 * viem hands back the ABI-decoded `bytes` for ENSIP-9 records and only
 * coerces to a checksummed string when the payload is 20 bytes. Bitcoin comes
 * back as a script and Solana as 32 raw bytes, so anything non-EVM has to be
 * run back through the coin's own encoder.
 */
function decodeAddress(value: string, coinType: number): string | null {
  if (!value || value === '0x') return null
  if (/^0x[0-9a-fA-F]{40}$/.test(value)) return value
  try {
    const coder = getCoderByCoinType(coinType)
    return coder.encode(Buffer.from(value.slice(2), 'hex'))
  } catch {
    return null
  }
}

export async function resolveForChain(input: string, chain: ChainKey): Promise<Resolution> {
  const spec = CHAIN_BY_KEY[chain]
  if (!spec) throw httpError('Unknown chain', 400, 'CHAIN_UNKNOWN')

  const { kind, query } = classify(input)
  const cfg = getServerConfig()

  if (kind === 'internal') {
    const name = await readName(`${query}.${cfg.parentName}`)
    if (!name) throw httpError('No wallet uses that name', 404, 'NAME_NOT_FOUND')
    const address = name.addresses[chain]
    if (!address) {
      throw httpError(
        `${name.fullName} has no ${spec.network} address`,
        404,
        'NO_ADDRESS_FOR_CHAIN',
      )
    }
    return { name: name.fullName, address, source: 'internal', coinType: spec.coin }
  }

  // External ENS. Query the coin type a standard client would use — which for
  // the L2s is the ENSIP-11 number, not the raw chain id we write internally.
  let normalized: string
  try {
    normalized = normalize(query)
  } catch {
    throw httpError('That is not a valid ENS name', 400, 'NAME_INVALID')
  }

  const coinType = spec.publicCoin
  let raw: string | null
  try {
    raw = await ensClient().getEnsAddress({
      name: normalized,
      coinType: BigInt(coinType),
    })
  } catch {
    throw httpError('Could not reach ENS to resolve that name', 502, 'ENS_UNAVAILABLE')
  }

  const address = raw ? decodeAddress(raw, coinType) : null
  if (!address) {
    throw httpError(
      `${normalized} has no ${spec.network} address set`,
      404,
      'NO_ADDRESS_FOR_CHAIN',
    )
  }
  return { name: normalized, address, source: 'ens', coinType }
}
