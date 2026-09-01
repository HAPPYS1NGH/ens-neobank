/**
 * Typed client for the four API routes. Nothing here touches the Namespace
 * SDK or the API key — that all lives behind `src/server/*`, which the check
 * in `npm run check:secrets` enforces.
 *
 * Routes:
 *   GET   /api/subnames/availability?label=   is this name free
 *   GET   /api/subnames?owner=                the wallet's name, if it has one
 *   GET   /api/subnames/<label|fullName>      read one name's records
 *   POST  /api/subnames                       mint
 *   PATCH /api/subnames                       add one chain's address record
 *   GET   /api/resolve?name=&chain=           resolve anything Send accepts
 */
import type { ChainKey } from '@/lib/chains'

export interface WalletNameDTO {
  /** Real, fully-qualified name as written, e.g. `harpreet.tange.eth`. */
  fullName: string
  label: string
  parentName: string
  owner?: string
  /** Chain key → address, for chains this app knows about. */
  addresses: Partial<Record<ChainKey, string>>
  /** Raw coin type → address, including the EVM fallback record. */
  rawAddresses: Record<string, string>
  texts: Record<string, string>
  metadata: Record<string, string>
}

/**
 * The parent is `tange.eth`, not `tangem.eth`. That is the name the repo owner
 * actually controls, it is what the server writes to, and it is what every
 * screen must show. Do not "correct" it.
 */
export const DISPLAY_PARENT = process.env.NEXT_PUBLIC_DISPLAY_PARENT || 'tange.eth'

export function displayName(name: Pick<WalletNameDTO, 'fullName'>): string {
  return name.fullName
}

/**
 * These two must match `src/server/proof.ts` byte for byte — the server
 * rebuilds the string and verifies the signature against it. The prefix is
 * a shared constant, not a label: change it here and there together, or
 * every write fails verification.
 */
export function claimMessage(label: string, address: string): string {
  return `Tangem demo\nClaim name: ${label}\nAccount: ${address.toLowerCase()}`
}

export function addAddressMessage(fullName: string, chain: string, address: string): string {
  return `Tangem demo\nAdd address to: ${fullName}\nChain: ${chain}\nAddress: ${address}`
}

interface Envelope<T> {
  ok: boolean
  data?: T
  error?: string
  code?: string
}

/** Carries the server's error code through so a screen can react to `NAME_TAKEN`. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(input, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiError('Could not reach the server', 'NETWORK', 0)
  }
  const body = (await response.json().catch(() => null)) as Envelope<T> | null
  if (!response.ok || !body?.ok) {
    throw new ApiError(body?.error ?? 'Request failed', body?.code ?? 'UNKNOWN', response.status)
  }
  return body.data as T
}

/* ----------------------------- availability ----------------------------- */

export interface AvailabilityDTO {
  /** The normalized label the server would actually claim. */
  label: string
  available: boolean
  parentName: string
}

/**
 * The route already inverts the registry's backwards 404-means-free behaviour,
 * so `available` here means what it says. A rejected label (too short,
 * reserved, bad characters) comes back as an ApiError whose message is written
 * for the user — render it verbatim under the field.
 */
export async function checkAvailability(label: string): Promise<AvailabilityDTO> {
  return request<AvailabilityDTO>(
    `/api/subnames/availability?label=${encodeURIComponent(label)}`,
  )
}

/* --------------------------------- read --------------------------------- */

/**
 * There is no reverse resolution for offchain subnames, so "which name does
 * this wallet own" is answered by filtering the parent on owner, server-side.
 * Returns null for a wallet that has none — including one whose user ticked
 * *Continue without a name*.
 */
export async function getNameByOwner(owner: string): Promise<WalletNameDTO | null> {
  const { name } = await request<{ name: WalletNameDTO | null }>(
    `/api/subnames?owner=${encodeURIComponent(owner)}`,
  )
  return name
}

/**
 * Reads one name's records. Accepts a bare label or a full name; the route
 * strips the suffix either way. Used by the Address book to show what a
 * contact's name currently resolves to.
 */
export async function readName(nameOrLabel: string): Promise<WalletNameDTO> {
  const { name } = await request<{ name: WalletNameDTO }>(
    `/api/subnames/${encodeURIComponent(nameOrLabel)}`,
  )
  return name
}

/* --------------------------------- mint --------------------------------- */

export interface MintInput {
  label: string
  /** The chain whose address seeds the first record. */
  chain: ChainKey
  address: string
  owner: string
  signature: string
  /** Stored as the `name` text record — what the user actually typed. */
  displayName: string
}

export async function mintName(input: MintInput): Promise<WalletNameDTO> {
  const { name } = await request<{ name: WalletNameDTO }>('/api/subnames', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return name
}

/* ------------------------------ add address ----------------------------- */

export interface AddAddressInput {
  fullName: string
  chain: ChainKey
  address: string
  owner: string
  signature: string
}

/**
 * Adds one chain's address to a name that already exists. The server does the
 * read-merge-write, because `updateSubname` is a full-replace upsert and any
 * record left out of the request is cleared.
 */
export async function addAddress(input: AddAddressInput): Promise<WalletNameDTO> {
  const { name } = await request<{ name: WalletNameDTO }>('/api/subnames', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return name
}

/* -------------------------------- resolve ------------------------------- */

export interface ResolutionDTO {
  /** The name as it should be shown back to the user. */
  name: string
  address: string
  /** `internal` came from our registry, `ens` from public ENS via CCIP-Read. */
  source: 'internal' | 'ens'
  /** The coin type that answered, so Send can show what was queried. */
  coinType: number
}

/**
 * Resolves whatever the Send field or the Address book holds, for one chain.
 * A bare label or a name under `tange.eth` is answered from our own registry;
 * anything else (`vitalik.eth`) goes through public ENS. See
 * `src/server/resolve.ts`.
 */
export async function resolveForChain(query: string, chain: ChainKey): Promise<ResolutionDTO> {
  return request<ResolutionDTO>(
    `/api/resolve?name=${encodeURIComponent(query)}&chain=${encodeURIComponent(chain)}`,
  )
}
