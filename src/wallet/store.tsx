'use client'

/**
 * ============================ INTERFACE SUMMARY ============================
 *
 * One provider, one hook. Wrap the app in <WalletProvider> and call
 * `useWallet()` anywhere below it.
 *
 *   const w = useWallet()
 *
 * STATE
 *   w.ready               false until the seed is derived and the name looked up
 *   w.owner               the ACTIVE wallet's EVM address, and its name's owner
 *   w.wallets / w.wallet  every wallet; `wallet` is the active one
 *   w.ensName             active wallet's WalletNameDTO, or null if unnamed
 *   w.isNamed             convenience for `ensName !== null`
 *   w.walletTitle         what goes under the balance: the name, else the label
 *   w.unnamedCount        wallets still waiting for a name, for the prompts
 *   w.enabledNetworkIds   the ACTIVE wallet's network ids, in the user's order
 *   w.tokens              TokenRow[] for the home list, derived from the above
 *   w.total               SIMULATED portfolio total, always 0
 *   w.contacts            address book, stored as ENS names
 *   w.screen / w.sheet    current route (see Screen / Sheet unions below)
 *   w.toast               transient message, or null
 *
 * NAVIGATION
 *   w.go(screen)  w.back()  w.reset(screen)
 *   w.openSheet(sheet)  w.closeSheet()
 *   w.showToast(message)
 *
 * ADDRESSES
 *   w.addressForChain(chainKey)     the address this wallet receives at
 *   w.addressForNetwork(networkId)  same, resolved through the network's chain
 *
 * NAMES  (every one of these is a real write to the configured parent)
 *   await w.checkName(label)      -> { label, available, parentName } | throws ApiError
 *   await w.claimName(label, id?) -> { ok } | { ok: false, error }
 *   w.skipName()                  the user ticked 'Continue without a name'
 *   await w.saveNetworks(ids)     diffs against what is written and adds records,
 *                                 reporting which chains wrote and which failed
 *   await w.resolve(query, chain) -> ResolutionDTO
 *
 * ADDRESS BOOK
 *   w.addContact({ name, note })  w.removeContact(id)
 *
 * DANGER
 *   w.removeWallet(id)            deletes one wallet locally (never the last)
 *   w.resetWallet()               clears the seed and local state, reloads
 *
 * Everything except the name writes is simulated. See src/lib/assets.ts.
 * ==========================================================================
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import {
  CHAINS,
  CHAIN_BY_KEY,
  COINS,
  NETWORKS,
  NETWORK_BY_ID,
  chainsForNetworks,
  networksForCoin,
  type ChainKey,
  type CoinId,
  type NetworkSpec,
} from '@/lib/chains'
import { portfolioTotal, tokenRows, type TokenRow } from '@/lib/assets'
import { addressFor, evmAddress, getSeed, resetSeed, signOwnership } from '@/lib/keys'
import * as api from './api'
import { ApiError, DISPLAY_PARENT, type ResolutionDTO, type WalletNameDTO } from './api'
import { brand } from '@config'

/* ------------------------------- the wallet ------------------------------ */

/**
 * Tangem supports several wallets — one mobile, many hardware cards — and each
 * is a separate identity. `label` is the local string Tangem has always shown
 * ("Wallet"); `name` is the subname that replaces it once claimed.
 *
 * `name` is null for a wallet whose user ticked *Continue without a name*.
 * That wallet is fully usable and can be named later from Details → the wallet
 * row, which is why naming is not modelled as part of onboarding state.
 */
export interface Wallet {
  id: string
  label: string
  name: WalletNameDTO | null
  /** 'mobile' for the phone-only wallet, 'hardware' for a card. */
  kind: 'mobile' | 'hardware'
  /**
   * This wallet's key derivation index (src/lib/keys.ts). Account 0 is the
   * first wallet and keeps the original derivation, so an existing browser
   * keeps the name it already minted. Every later wallet gets its own index,
   * which is what makes it a separate owner — and therefore separately
   * nameable — rather than a second label on one identity.
   */
  account: number
  /**
   * The networks this wallet has turned on, in the user's order. Per wallet,
   * not global: adding a wallet must not inherit or reset another one's list.
   */
  enabledNetworkIds: string[]
}

export interface Contact {
  id: string
  /** An ENS name, not hex. The whole point of the address book here. */
  name: string
  note?: string
}

/* -------------------------------- routing -------------------------------- */

export type Screen =
  | { name: 'onboarding' }
  /** The claim. `purpose` decides where Continue lands and what Back means. */
  | { name: 'nameWallet'; purpose: 'onboarding' | 'addWallet' | 'rename'; walletId?: string }
  | { name: 'nameClaimed' }
  | { name: 'home' }
  | { name: 'tokenDetail'; networkId: string }
  | { name: 'send'; networkId: string }
  | { name: 'sendReview'; networkId: string; to: string; resolved: string; amount: string }
  | { name: 'sendDone'; networkId: string; to: string; amount: string }
  | { name: 'details' }
  | { name: 'walletDetail'; walletId: string }
  | { name: 'addressBook' }
  | { name: 'addContact' }

export type Sheet =
  | { kind: 'none' }
  | { kind: 'addManage' }
  | { kind: 'manageTokens' }
  | { kind: 'chooseAccount' }
  | { kind: 'chooseToken'; purpose: 'buy' | 'receive' | 'send' }
  | { kind: 'transfer'; networkId: string }
  | { kind: 'receive'; networkId: string }
  /** Add a chain from the Receive sheet, then land back on Receive for it. */
  | { kind: 'addNetwork' }
  | { kind: 'addWallet' }

/* --------------------------------- state --------------------------------- */

interface State {
  ready: boolean
  /** Once true the user is past first-run onboarding, whatever screen is up. */
  onboarded: boolean
  wallets: Wallet[]
  activeWalletId: string
  contacts: Contact[]
  screen: Screen
  history: Screen[]
  sheet: Sheet
  toast: string | null
  /** True while a name write is in flight, so buttons can show a spinner. */
  busy: boolean
}

type Action =
  /** `names` is keyed by wallet id — every wallet is looked up by its own owner. */
  | { type: 'ready'; wallets: Wallet[]; persisted: Persisted; names: Record<string, WalletNameDTO | null> }
  /** First-run onboarding is over — claim completed or the user skipped it. */
  | { type: 'onboard' }
  | { type: 'navigate'; screen: Screen }
  | { type: 'back' }
  | { type: 'resetTo'; screen: Screen }
  | { type: 'sheet'; sheet: Sheet }
  | { type: 'setName'; walletId: string; name: WalletNameDTO | null }
  | { type: 'setLabel'; walletId: string; label: string }
  | { type: 'addWallet'; wallet: Wallet }
  | { type: 'removeWallet'; walletId: string }
  | { type: 'activateWallet'; walletId: string }
  | { type: 'setNetworks'; walletId: string; ids: string[] }
  | { type: 'addContact'; contact: Contact }
  | { type: 'removeContact'; id: string }
  | { type: 'toast'; message: string | null }
  | { type: 'busy'; busy: boolean }

const STORAGE_KEY = `${brand.storagePrefix}.state.v1`

/**
 * What survives a reload. The name itself is re-read from the registry.
 *
 * `enabledNetworkIds` at the top level is the pre-multi-wallet shape: one list
 * for the whole app. It is still read so an existing install keeps its tokens,
 * but it is written per wallet from now on (see `migrate` below).
 */
interface Persisted {
  wallets: Array<Pick<Wallet, 'id' | 'label' | 'kind'> & Partial<Pick<Wallet, 'account' | 'enabledNetworkIds'>>>
  activeWalletId: string
  /** Legacy, read-only: the single shared list this build replaced. */
  enabledNetworkIds?: string[]
  contacts: Contact[]
  /** Once true, boot lands on home rather than the create-wallet screen. */
  onboarded: boolean
}

const DEFAULT_WALLET_ID = 'wallet-1'

// A fresh wallet holds no tokens — the same rule the name mint follows.
// Nothing appears until the user adds it (Manage tokens or the receive flow).
const emptyPersisted: Persisted = {
  wallets: [
    { id: DEFAULT_WALLET_ID, label: brand.copy.unnamedLabel, kind: 'mobile', account: 0, enabledNetworkIds: [] },
  ],
  activeWalletId: DEFAULT_WALLET_ID,
  contacts: [],
  onboarded: false,
}

/**
 * Turns whatever is in storage into wallets this build can use.
 *
 *  - Duplicate ids (a length-based id reused after a delete) keep the first.
 *  - A wallet with no `account` gets one from its id, so `wallet-1` stays
 *    account 0 and keeps the addresses — and the name — it already minted.
 *  - A legacy shared network list goes to the wallet that was active when it
 *    was built, and to that wallet only. Copying it to every wallet would
 *    invent balances the other wallets never had.
 */
function migrate(persisted: Persisted): Wallet[] {
  const seen = new Set<string>()
  const rows = persisted.wallets.filter((w) => (seen.has(w.id) ? false : (seen.add(w.id), true)))
  const source = rows.length > 0 ? rows : emptyPersisted.wallets

  const takenAccounts = new Set<number>()
  return source.map((w, index) => {
    const fromId = Number(w.id.replace('wallet-', '')) - 1
    let account =
      typeof w.account === 'number' && Number.isInteger(w.account) && w.account >= 0
        ? w.account
        : Number.isInteger(fromId) && fromId >= 0
          ? fromId
          : index
    // Two wallets on one account would be two labels on one identity — the
    // bug this replaces. Push a collision past everything already claimed.
    while (takenAccounts.has(account)) account += 1
    takenAccounts.add(account)

    return {
      id: w.id,
      label: w.label,
      kind: w.kind,
      name: null,
      account,
      enabledNetworkIds:
        w.enabledNetworkIds ??
        (w.id === persisted.activeWalletId ? (persisted.enabledNetworkIds ?? []) : []),
    }
  })
}

const initial: State = {
  ready: false,
  onboarded: false,
  wallets: migrate(emptyPersisted),
  activeWalletId: DEFAULT_WALLET_ID,
  contacts: [],
  screen: { name: 'onboarding' },
  history: [],
  sheet: { kind: 'none' },
  toast: null,
  busy: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ready': {
      const { persisted } = action
      // Every wallet is looked up by its OWN owner address, so each one shows
      // the name it actually holds rather than borrowing the first wallet's.
      const wallets = action.wallets.map((w) => ({ ...w, name: action.names[w.id] ?? null }))
      return {
        ...state,
        ready: true,
        wallets,
        activeWalletId: wallets.some((w) => w.id === persisted.activeWalletId)
          ? persisted.activeWalletId
          : wallets[0].id,
        contacts: persisted.contacts,
        onboarded: persisted.onboarded,
        screen: persisted.onboarded ? { name: 'home' } : { name: 'onboarding' },
        history: [],
      }
    }
    // One-way latch. Boot reads this flag, not the current screen, so a
    // refresh on any screen — the name claim included — lands a returning
    // user back on home with their wallet intact.
    case 'onboard':
      if (state.onboarded) return state
      return { ...state, onboarded: true }
    case 'navigate':
      return {
        ...state,
        screen: action.screen,
        history: [...state.history, state.screen],
        sheet: { kind: 'none' },
      }
    case 'back': {
      const history = [...state.history]
      const previous = history.pop() ?? ({ name: 'home' } as const)
      return { ...state, screen: previous, history, sheet: { kind: 'none' } }
    }
    case 'resetTo':
      return { ...state, screen: action.screen, history: [], sheet: { kind: 'none' } }
    case 'sheet':
      return { ...state, sheet: action.sheet }
    case 'setName':
      return {
        ...state,
        wallets: state.wallets.map((w) =>
          w.id === action.walletId ? { ...w, name: action.name } : w,
        ),
      }
    case 'setLabel':
      return {
        ...state,
        wallets: state.wallets.map((w) =>
          w.id === action.walletId ? { ...w, label: action.label } : w,
        ),
      }
    case 'addWallet':
      return { ...state, wallets: [...state.wallets, action.wallet], activeWalletId: action.wallet.id }
    case 'removeWallet': {
      // The last wallet is the wallet — refuse rather than render an empty
      // app. The UI hides the button at one wallet; this keeps the invariant
      // even if a caller bypasses it.
      if (state.wallets.length <= 1) return state
      const wallets = state.wallets.filter((w) => w.id !== action.walletId)
      return {
        ...state,
        wallets,
        activeWalletId:
          state.activeWalletId === action.walletId ? wallets[0].id : state.activeWalletId,
      }
    }
    case 'activateWallet':
      return { ...state, activeWalletId: action.walletId }
    // Networks belong to one wallet. Writing them globally is what made a new
    // wallet inherit another's tokens and then clear them for both.
    case 'setNetworks':
      return {
        ...state,
        wallets: state.wallets.map((w) =>
          w.id === action.walletId ? { ...w, enabledNetworkIds: action.ids } : w,
        ),
      }
    case 'addContact':
      return { ...state, contacts: [...state.contacts, action.contact] }
    case 'removeContact':
      return { ...state, contacts: state.contacts.filter((c) => c.id !== action.id) }
    case 'toast':
      return { ...state, toast: action.message }
    case 'busy':
      return { ...state, busy: action.busy }
    default:
      return state
  }
}

/* ------------------------------- the context ------------------------------ */

export type WriteResult = { ok: true } | { ok: false; error: string }

/**
 * Per-chain outcome of a Manage tokens save. Chains are written one by one and
 * each result is kept: a failed chain does not discard the records that did
 * write, and the caller can show exactly which rows landed and which did not.
 */
export type NetworkWriteResult = {
  /** True when every needed chain wrote. */
  ok: boolean
  /** Chains whose address record is now on the name. */
  written: ChainKey[]
  /** Chains that errored — their record may or may not exist. */
  failed: ChainKey[]
  /** The first failure's message, for the error line under the Save button. */
  error?: string
}

interface Ctx extends State {
  /** The parent every name is issued under, from DISPLAY_PARENT / app.config. */
  parent: string
  wallet: Wallet
  /** The active wallet's EVM address — the owner its name is issued to. */
  owner: string
  ensName: WalletNameDTO | null
  isNamed: boolean
  /** The string that goes under the balance — the name, or the local label. */
  walletTitle: string
  /** The active wallet's network ids, in the user's order. */
  enabledNetworkIds: string[]
  /** How many wallets are still unnamed — what the Details prompt counts. */
  unnamedCount: number

  addressForChain: (chain: ChainKey) => string
  addressForNetwork: (networkId: string) => string

  tokens: TokenRow[]
  total: number
  /** Every network id currently on, as a Set, for the Manage tokens toggles. */
  enabled: Set<string>

  go: (screen: Screen) => void
  back: () => void
  reset: (screen: Screen) => void
  openSheet: (sheet: Sheet) => void
  closeSheet: () => void
  showToast: (message: string) => void

  checkName: (label: string) => Promise<api.AvailabilityDTO>
  /** Claims for `walletId`, defaulting to the active wallet. */
  claimName: (label: string, walletId?: string) => Promise<WriteResult>
  skipName: () => void
  saveNetworks: (ids: string[]) => Promise<NetworkWriteResult>
  resolve: (query: string, chain: ChainKey) => Promise<ResolutionDTO>

  addContact: (input: { name: string; note?: string }) => void
  removeContact: (id: string) => void

  /** Creates a wallet with its own account index and activates it. */
  addWallet: (kind: Wallet['kind']) => string
  activateWallet: (id: string) => void
  /** Deletes one wallet locally. The last wallet cannot be deleted. */
  removeWallet: (id: string) => void
  resetWallet: () => void
}

const WalletContext = createContext<Ctx | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)
  const seedRef = useRef<Uint8Array | null>(null)

  // Boot: derive the wallet from the stored seed, restore local preferences,
  // then ask the server whether this wallet already owns a name. There is no
  // reverse resolution for offchain subnames, so that lookup is a filter on
  // the parent by owner rather than an ENS query.
  useEffect(() => {
    const seed = getSeed()
    seedRef.current = seed

    let persisted = emptyPersisted
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) persisted = { ...emptyPersisted, ...(JSON.parse(raw) as Persisted) }
    } catch {
      // Corrupt or blocked storage — start clean rather than crash on boot.
    }
    const wallets = migrate(persisted)

    let cancelled = false
    // One lookup per wallet, each against its own owner address. A failure on
    // any one of them must not block the wallet or lose the others, so each
    // settles to null on its own and the app shows that wallet's local label
    // until the next reload succeeds.
    Promise.all(
      wallets.map((wallet) =>
        api
          .getNameByOwner(evmAddress(seed, wallet.account))
          .catch(() => null)
          .then((name) => [wallet.id, name] as const),
      ),
    ).then((entries) => {
      if (cancelled) return
      dispatch({ type: 'ready', wallets, persisted, names: Object.fromEntries(entries) })
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!state.ready) return
    const persisted: Persisted = {
      wallets: state.wallets.map(({ id, label, kind, account, enabledNetworkIds }) => ({
        id,
        label,
        kind,
        account,
        enabledNetworkIds,
      })),
      activeWalletId: state.activeWalletId,
      contacts: state.contacts,
      onboarded: state.onboarded,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      // Storage unavailable; the session still works in memory.
    }
  }, [
    state.ready,
    state.onboarded,
    state.wallets,
    state.activeWalletId,
    state.contacts,
  ])

  useEffect(() => {
    if (!state.toast) return
    const timer = window.setTimeout(() => dispatch({ type: 'toast', message: null }), 2200)
    return () => window.clearTimeout(timer)
  }, [state.toast])

  const value = useMemo<Ctx>(() => {
    const wallet =
      state.wallets.find((w) => w.id === state.activeWalletId) ?? state.wallets[0]
    const ensName = wallet?.name ?? null
    const enabledNetworkIds = wallet?.enabledNetworkIds ?? []
    const seedNow = seedRef.current
    // The active wallet's own address. Every wallet derives from its own
    // account index, so this is a different owner per wallet — which is what
    // lets each of them hold a name of its own.
    const owner = seedNow ? evmAddress(seedNow, wallet?.account ?? 0) : ''

    const addressForChain = (chain: ChainKey) => {
      const seed = seedRef.current
      if (!seed) return ''
      return addressFor(seed, chain, wallet?.account ?? 0)
    }

    const addressForNetwork = (networkId: string) => {
      const chain = NETWORK_BY_ID[networkId]?.chain
      // An unwritable network still has a real address in a real wallet — it is
      // only the *record* that cannot be stored. Fall back to the EVM address
      // so the Receive sheet is not blank, and let the UI say why the name
      // does not cover it.
      return chain ? addressForChain(chain) : addressForChain('eth')
    }

    const tokens = tokenRows(enabledNetworkIds, addressForNetwork)

    /** Chains this name already holds a record for, from the last read. */
    const writtenChains = new Set<ChainKey>(
      Object.keys(ensName?.addresses ?? {}) as ChainKey[],
    )

    async function writeChain(fullName: string, chain: ChainKey): Promise<WalletNameDTO> {
      const seed = seedRef.current
      if (!seed) throw new Error('Wallet is still starting up')
      const account = wallet?.account ?? 0
      const address = addressFor(seed, chain, account)
      const signature = await signOwnership(
        seed,
        api.addAddressMessage(fullName, chain, address),
        account,
      )
      return api.addAddress({ fullName, chain, address, owner, signature })
    }

    return {
      ...state,
      parent: DISPLAY_PARENT,
      wallet,
      owner,
      ensName,
      isNamed: ensName !== null,
      walletTitle: ensName?.fullName ?? wallet?.label ?? brand.copy.unnamedLabel,
      enabledNetworkIds,
      unnamedCount: state.wallets.filter((w) => w.name === null).length,

      addressForChain,
      addressForNetwork,

      tokens,
      total: portfolioTotal(tokens),
      enabled: new Set(enabledNetworkIds),

      go: (screen) => dispatch({ type: 'navigate', screen }),
      back: () => dispatch({ type: 'back' }),
      reset: (screen) => dispatch({ type: 'resetTo', screen }),
      openSheet: (sheet) => dispatch({ type: 'sheet', sheet }),
      closeSheet: () => dispatch({ type: 'sheet', sheet: { kind: 'none' } }),
      showToast: (message) => dispatch({ type: 'toast', message }),

      checkName: (label) => api.checkAvailability(label),

      /**
       * Claims the name and nothing more. The mint carries no address records —
       * not even Ethereum — because a name should resolve only onto chains the
       * user deliberately adds, which happens later through Manage tokens or
       * the receive flow (`saveNetworks` / `writeChain`).
       *
       * If the mint fails nothing is stored locally either, so a retry starts
       * from the same place.
       */
      async claimName(label: string, walletId?: string): Promise<WriteResult> {
        const seed = seedRef.current
        if (!seed) return { ok: false, error: 'Wallet is still starting up' }
        // Claiming names a specific wallet. It defaults to the active one, but
        // a caller that knows which row it is naming says so, so a claim can
        // never land on a wallet the user has since switched away from.
        const target = walletId
          ? (state.wallets.find((w) => w.id === walletId) ?? wallet)
          : wallet
        if (!target) return { ok: false, error: 'No wallet selected' }
        const targetOwner = evmAddress(seed, target.account)

        dispatch({ type: 'busy', busy: true })
        try {
          const signature = await signOwnership(
            seed,
            api.claimMessage(label, targetOwner),
            target.account,
          )
          const name = await api.mintName({
            label,
            owner: targetOwner,
            signature,
            displayName: label,
          })

          dispatch({ type: 'setName', walletId: target.id, name })
          // The claim is what ends first-run onboarding, even if the user
          // never reaches the confirmation screen.
          dispatch({ type: 'onboard' })
          return { ok: true }
        } catch (error) {
          const message =
            error instanceof ApiError || error instanceof Error
              ? error.message
              : 'Something went wrong'
          return { ok: false, error: message }
        } finally {
          dispatch({ type: 'busy', busy: false })
        }
      },

      /** The deliberate opt-out. Nothing is written; the local label stands. */
      skipName() {
        dispatch({ type: 'onboard' })
        dispatch({ type: 'resetTo', screen: { name: 'home' } })
      },

      /**
       * Saves the Manage tokens selection.
       *
       * Toggling a network ON writes its chain's address to the name.
       * Toggling one OFF removes it from the local list but does NOT delete
       * the record — someone may already have the name saved as a payee, and
       * silently breaking their next payment is worse than an extra record.
       * The README says so out loud.
       */
      async saveNetworks(ids: string[]): Promise<NetworkWriteResult> {
        if (!wallet) return { ok: true, written: [], failed: [] }
        dispatch({ type: 'setNetworks', walletId: wallet.id, ids })
        if (!ensName) return { ok: true, written: [], failed: [] }

        const needed = chainsForNetworks(ids).filter((c) => !writtenChains.has(c))
        if (needed.length === 0) return { ok: true, written: [], failed: [] }

        dispatch({ type: 'busy', busy: true })
        const written: ChainKey[] = []
        const failed: ChainKey[] = []
        let firstError: string | undefined
        try {
          for (const chain of needed) {
            try {
              const name = await writeChain(ensName.fullName, chain)
              // Dispatched per chain so a later failure cannot discard the
              // records that did write — each one lands in state as it lands
              // on the registry.
              dispatch({ type: 'setName', walletId: wallet.id, name })
              written.push(chain)
            } catch (error) {
              if (!firstError) {
                firstError =
                  error instanceof Error ? error.message : 'Could not update the name'
              }
              failed.push(chain)
            }
          }
          return {
            ok: failed.length === 0,
            written,
            failed,
            ...(firstError ? { error: firstError } : {}),
          }
        } finally {
          dispatch({ type: 'busy', busy: false })
        }
      },

      resolve: (query, chain) => api.resolveForChain(query, chain),

      addContact: ({ name, note }) =>
        dispatch({
          type: 'addContact',
          contact: { id: `contact-${Date.now()}`, name: name.trim().toLowerCase(), note },
        }),
      removeContact: (id) => dispatch({ type: 'removeContact', id }),

      addWallet: (kind) => {
        // Numbering by list length reuses an id after a delete ("wallet-2"
        // twice, and React keys collide). Number past the highest id live.
        const next =
          state.wallets.reduce(
            (max, x) => Math.max(max, Number(x.id.replace('wallet-', '')) || 0),
            0,
          ) + 1
        const id = `wallet-${next}`
        // Same rule for the account index: past the highest in use, never the
        // list length, or a delete would hand a new wallet the identity — and
        // the name — of one that came before it.
        const account = state.wallets.reduce((max, x) => Math.max(max, x.account), -1) + 1
        dispatch({
          type: 'addWallet',
          wallet: {
            id,
            label: `${brand.copy.unnamedLabel} ${next}`,
            name: null,
            kind,
            account,
            // A new wallet starts empty. It neither inherits another wallet's
            // networks nor clears them.
            enabledNetworkIds: [],
          },
        })
        return id
      },
      activateWallet: (id) => dispatch({ type: 'activateWallet', walletId: id }),

      // Deleting a wallet is local: the identity, its enabled networks and its
      // name record here. The name itself is a real subname on the registry and
      // stays there — deletion does not (and cannot) unwind it. The account
      // index is never reused, so a deleted wallet's name does not resurface on
      // a later one; it simply has no wallet in this app any more.
      removeWallet: (id) => dispatch({ type: 'removeWallet', walletId: id }),

      resetWallet: () => {
        resetSeed()
        try {
          window.localStorage.removeItem(STORAGE_KEY)
        } catch {
          // Nothing to clear.
        }
        window.location.reload()
      },
    }
  }, [state])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): Ctx {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}

// Re-exported so a screen can import its whole vocabulary from one place.
export {
  CHAINS,
  CHAIN_BY_KEY,
  COINS,
  NETWORKS,
  NETWORK_BY_ID,
  networksForCoin,
  DISPLAY_PARENT,
}
export type { ChainKey, CoinId, NetworkSpec, TokenRow, WalletNameDTO, ResolutionDTO }
