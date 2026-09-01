import 'server-only'
import {
  ChainName,
  type AddressRecord,
  type TextRecord,
} from '@thenamespace/offchain-manager'
import { createNamespaceClient, getServerConfig } from './config'
import { httpError } from './http'
import { CHAINS, chainByCoin, type ChainKey } from '@/lib/chains'
import { normalizeLabel, validateLabel } from './validation'

/**
 * Every name this app creates carries this metadata pair.
 *
 * The parent registry is shared with an earlier partner demo whose names are
 * already in it. Without a tag, a listing shows a stranger's data. The tag is
 * applied server-side so a client cannot spoof or omit it.
 */
/**
 * ENSIP-11's EVM fallback record (0x80000000). We write it at mint time so a
 * name resolves on any EVM chain the wallet later adds, which means the
 * read-merge-write path must recognise it — it is ours, not an unknown record.
 */
const EVM_DEFAULT_COIN = 2147483648

export const DEMO_TAG_KEY = 'demo'
export const DEMO_TAG_VALUE = 'tangem-ios'

export interface WalletName {
  /** Real, fully-qualified name as written, e.g. `harpreet.àlias.eth`. */
  fullName: string
  label: string
  parentName: string
  owner?: string
  /** Chain key → address, for chains this app knows about. */
  addresses: Partial<Record<ChainKey, string>>
  /** Raw coin type → address, including anything we don't surface. */
  rawAddresses: Record<string, string>
  texts: Record<string, string>
  metadata: Record<string, string>
}

/**
 * `getSingleSubname` throws an HTTP 404 for an unregistered name rather than
 * resolving to null, whatever the SDK docs say. Callers promising `| null`
 * translate it here; anything else still propagates as a real failure.
 */
function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const err = error as { status?: unknown; response?: { status?: unknown } }
  return err.status === 404 || err.response?.status === 404
}

function chainNameFor(key: ChainKey): ChainName {
  const match = Object.values(ChainName).find((value) => value === key)
  if (!match) {
    // Drift between src/lib/chains.ts and the SDK enum. Fail closed rather than
    // write a name with a silently missing chain record.
    throw httpError(`Chain ${key} is not supported by this registry`, 500, 'CHAIN_UNSUPPORTED')
  }
  return match
}

function toWalletName(subname: {
  fullName: string
  label: string
  parentName: string
  owner?: string
  addresses?: Record<string, string>
  texts?: Record<string, string>
  metadata?: Record<string, string>
}): WalletName {
  const raw = subname.addresses ?? {}
  const addresses: Partial<Record<ChainKey, string>> = {}
  for (const [coin, value] of Object.entries(raw)) {
    if (!value) continue
    const spec = chainByCoin(Number(coin))
    if (spec) addresses[spec.key] = value
  }
  return {
    fullName: subname.fullName,
    label: subname.label,
    parentName: subname.parentName,
    owner: subname.owner,
    addresses,
    rawAddresses: raw,
    texts: subname.texts ?? {},
    metadata: subname.metadata ?? {},
  }
}

export function fullNameFor(label: string): string {
  const cfg = getServerConfig()
  const normalized = normalizeLabel(label)
  validateLabel(normalized)
  return `${normalized}.${cfg.parentName}`
}

export async function readName(fullName: string): Promise<WalletName | null> {
  const client = createNamespaceClient()
  try {
    const subname = await client.getSingleSubname(fullName)
    return subname ? toWalletName(subname) : null
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export async function isAvailable(label: string): Promise<boolean> {
  const cfg = getServerConfig()
  const normalized = normalizeLabel(label)
  validateLabel(normalized)
  const client = createNamespaceClient()
  const { isAvailable } = await client.isSubnameAvailable(`${normalized}.${cfg.parentName}`)
  return isAvailable
}

/**
 * There is no reverse resolution for offchain subnames — you cannot ask ENS
 * "which name does this address own". The owner is set at create time and
 * found again by filtering the parent's names on it.
 */
export async function findNameByOwner(owner: string): Promise<WalletName | null> {
  const cfg = getServerConfig()
  const client = createNamespaceClient()
  const page = await client.getFilteredSubnames({
    parentName: cfg.parentName,
    owner: owner.toLowerCase(),
    size: 1,
  })
  const first = page?.items?.[0]
  return first ? toWalletName(first) : null
}

export interface MintInput {
  label: string
  owner: string
  /** The account being named, whose address seeds the first record. */
  chain: ChainKey
  address: string
  /** Display name text record, i.e. what the user typed. */
  displayName?: string
}

export async function mintName(input: MintInput): Promise<WalletName> {
  const cfg = getServerConfig()
  const normalized = normalizeLabel(input.label)
  validateLabel(normalized)
  const fullName = `${normalized}.${cfg.parentName}`

  const client = createNamespaceClient()
  const { isAvailable } = await client.isSubnameAvailable(fullName)
  if (!isAvailable) throw httpError('That name is already taken', 409, 'NAME_TAKEN')

  const addresses: AddressRecord[] = [
    { chain: chainNameFor(input.chain), value: input.address },
  ]
  // Seed the EVM fallback record too, so the name resolves on any EVM chain
  // the wallet later adds rather than showing nothing but the one account.
  if (CHAINS.find((c) => c.key === input.chain)?.evm) {
    addresses.push({ chain: ChainName.Default, value: input.address })
  }

  const texts: TextRecord[] = []
  if (input.displayName?.trim()) {
    texts.push({ key: 'name', value: input.displayName.trim().slice(0, 200) })
  }

  await client.createSubname({
    label: normalized,
    parentName: cfg.parentName,
    owner: input.owner,
    addresses,
    texts,
    metadata: [{ key: DEMO_TAG_KEY, value: DEMO_TAG_VALUE }],
  })

  const created = await readName(fullName)
  if (!created) throw httpError('Name was created but could not be read back', 502, 'READBACK_FAILED')
  return created
}

export interface AddAddressInput {
  fullName: string
  owner: string
  chain: ChainKey
  address: string
}

/**
 * Adds one account's address to an existing name.
 *
 * `updateSubname` is a full-replace upsert: any record omitted from the
 * request is CLEARED. There is no merge. So this reads the current state and
 * re-sends every record it means to keep, then adds the new one.
 */
export async function addAddress(input: AddAddressInput): Promise<WalletName> {
  const client = createNamespaceClient()

  const existing = await readName(input.fullName)
  if (!existing) throw httpError('Name not found', 404, 'NAME_NOT_FOUND')
  if (!existing.owner || existing.owner.toLowerCase() !== input.owner.toLowerCase()) {
    throw httpError('Not the owner of this name', 403, 'NOT_OWNER')
  }

  // Start from every existing record, keyed by coin type.
  const byCoin: Record<string, string> = { ...existing.rawAddresses }
  const spec = CHAINS.find((c) => c.key === input.chain)
  if (!spec) throw httpError(`Unknown chain ${input.chain}`, 400, 'CHAIN_UNKNOWN')
  byCoin[String(spec.coin)] = input.address

  // Fail closed: refuse to write rather than silently drop a record whose coin
  // type we cannot map back to a chain the SDK will accept.
  const addresses: AddressRecord[] = []
  for (const [coin, value] of Object.entries(byCoin)) {
    if (!value) continue
    if (Number(coin) === EVM_DEFAULT_COIN) {
      addresses.push({ chain: ChainName.Default, value })
      continue
    }
    const known = chainByCoin(Number(coin))
    if (!known) {
      throw httpError(
        `Refusing to update: existing record has unknown coin type ${coin}`,
        409,
        'COIN_UNKNOWN',
      )
    }
    addresses.push({ chain: chainNameFor(known.key), value })
  }

  const texts: TextRecord[] = Object.entries(existing.texts)
    .filter(([, v]) => v)
    .map(([key, value]) => ({ key, value }))
  const metadata: TextRecord[] = Object.entries(existing.metadata)
    .filter(([, v]) => v)
    .map(([key, value]) => ({ key, value }))

  await client.updateSubname(input.fullName, { addresses, texts, metadata })

  const updated = await readName(input.fullName)
  if (!updated) throw httpError('Update accepted but read-back failed', 502, 'READBACK_FAILED')
  return updated
}
