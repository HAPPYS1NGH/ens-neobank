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
 *   w.owner               the wallet's EVM address, and the name's owner
 *   w.wallets / w.wallet  every wallet; `wallet` is the active one
 *   w.ensName             active wallet's WalletNameDTO, or null if unnamed
 *   w.isNamed             convenience for `ensName !== null`
 *   w.walletTitle         what goes under the balance: the name, else the label
 *   w.enabledNetworkIds   network ids toggled on, in the user's order
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
 * NAMES  (every one of these is a real write to tange.eth)
 *   await w.checkName(label)      -> { label, available, parentName } | throws ApiError
 *   await w.claimName(label)      -> { ok } | { ok: false, error }
 *   w.skipName()                  the user ticked 'Continue without a name'
 *   await w.saveNetworks(ids)     diffs against what is written and adds records
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
  | { name: 'nameWallet'; purpose: 'onboarding' | 'rename'; walletId?: string }
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
  owner: string
  wallets: Wallet[]
  activeWalletId: string
  enabledNetworkIds: string[]
  contacts: Contact[]
  screen: Screen
  history: Screen[]
  sheet: Sheet
  toast: string | null
  /** True while a name write is in flight, so buttons can show a spinner. */
  busy: boolean
}

type Action =
  | { type: 'ready'; owner: string; persisted: Persisted; name: WalletNameDTO | null }
  | { type: 'navigate'; screen: Screen }
  | { type: 'back' }
  | { type: 'resetTo'; screen: Screen }
  | { type: 'sheet'; sheet: Sheet }
  | { type: 'setName'; walletId: string; name: WalletNameDTO | null }
  | { type: 'setLabel'; walletId: string; label: string }
  | { type: 'addWallet'; wallet: Wallet }
  | { type: 'removeWallet'; walletId: string }
  | { type: 'activateWallet'; walletId: string }
  | { type: 'setNetworks'; ids: string[] }
  | { type: 'addContact'; contact: Contact }
  | { type: 'removeContact'; id: string }
  | { type: 'toast'; message: string | null }
  | { type: 'busy'; busy: boolean }

const STORAGE_KEY = 'tangem.demo.state.v1'

/** What survives a reload. The name itself is re-read from the registry. */
interface Persisted {
  wallets: Array<Pick<Wallet, 'id' | 'label' | 'kind'>>
  activeWalletId: string
  enabledNetworkIds: string[]
  contacts: Contact[]
  /** Once true, boot lands on home rather than the create-wallet screen. */
  onboarded: boolean
}

const DEFAULT_WALLET_ID = 'wallet-1'

const emptyPersisted: Persisted = {
  wallets: [{ id: DEFAULT_WALLET_ID, label: 'Wallet', kind: 'mobile' }],
  activeWalletId: DEFAULT_WALLET_ID,
  // A fresh wallet holds no tokens — the same rule the name mint follows.
  // Nothing appears until the user adds it (Manage tokens or the receive flow).
  enabledNetworkIds: [],
  contacts: [],
  onboarded: false,
}

const initial: State = {
  ready: false,
  owner: '',
  wallets: emptyPersisted.wallets.map((w) => ({ ...w, name: null })),
  activeWalletId: DEFAULT_WALLET_ID,
  enabledNetworkIds: [],
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
      // Storage written before wallet ids were guaranteed unique can hold
      // duplicates (a length-based id reused after a delete). Keep the first
      // of each id so React keys stay unique; fall back to a fresh wallet if
      // nothing usable survived.
      const seen = new Set<string>()
      const deduped = persisted.wallets.filter((w) =>
        seen.has(w.id) ? false : (seen.add(w.id), true),
      )
      const wallets = (deduped.length > 0
        ? deduped
        : emptyPersisted.wallets.map((w) => ({ ...w }))
      ).map((w) => ({
        ...w,
        // Only the active wallet's name is looked up at boot — the demo has one
        // owner key, so a second wallet shares it and would collide.
        name: w.id === persisted.activeWalletId ? action.name : null,
      }))
      return {
        ...state,
        ready: true,
        owner: action.owner,
        wallets,
        activeWalletId: wallets.some((w) => w.id === persisted.activeWalletId)
          ? persisted.activeWalletId
          : wallets[0].id,
        enabledNetworkIds: persisted.enabledNetworkIds,
        contacts: persisted.contacts,
        screen: persisted.onboarded ? { name: 'home' } : { name: 'onboarding' },
        history: [],
      }
    }
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
    case 'setNetworks':
      return { ...state, enabledNetworkIds: action.ids }
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

interface Ctx extends State {
  /** The parent every name is issued under: `tange.eth`. Not `tangem.eth`. */
  parent: string
  wallet: Wallet
  ensName: WalletNameDTO | null
  isNamed: boolean
  /** The string that goes under the balance — the name, or the local label. */
  walletTitle: string

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
  claimName: (label: string) => Promise<WriteResult>
  skipName: () => void
  saveNetworks: (ids: string[]) => Promise<WriteResult>
  resolve: (query: string, chain: ChainKey) => Promise<ResolutionDTO>

  addContact: (input: { name: string; note?: string }) => void
  removeContact: (id: string) => void

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
    const owner = evmAddress(seed)

    let persisted = emptyPersisted
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) persisted = { ...emptyPersisted, ...(JSON.parse(raw) as Persisted) }
    } catch {
      // Corrupt or blocked storage — start clean rather than crash on boot.
    }

    let cancelled = false
    api
      .getNameByOwner(owner)
      .then((name) => {
        if (!cancelled) dispatch({ type: 'ready', owner, persisted, name })
      })
      .catch(() => {
        // A name lookup failure must not block the wallet. The user sees the
        // local label until the next reload succeeds.
        if (!cancelled) dispatch({ type: 'ready', owner, persisted, name: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!state.ready) return
    const persisted: Persisted = {
      wallets: state.wallets.map(({ id, label, kind }) => ({ id, label, kind })),
      activeWalletId: state.activeWalletId,
      enabledNetworkIds: state.enabledNetworkIds,
      contacts: state.contacts,
      onboarded: state.screen.name !== 'onboarding' && state.screen.name !== 'nameWallet',
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      // Storage unavailable; the session still works in memory.
    }
  }, [
    state.ready,
    state.wallets,
    state.activeWalletId,
    state.enabledNetworkIds,
    state.contacts,
    state.screen,
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

    const addressForChain = (chain: ChainKey) => {
      const seed = seedRef.current
      if (!seed) return ''
      return addressFor(seed, chain, 0)
    }

    const addressForNetwork = (networkId: string) => {
      const chain = NETWORK_BY_ID[networkId]?.chain
      // An unwritable network still has a real address in a real wallet — it is
      // only the *record* that cannot be stored. Fall back to the EVM address
      // so the Receive sheet is not blank, and let the UI say why the name
      // does not cover it.
      return chain ? addressForChain(chain) : addressForChain('eth')
    }

    const tokens = tokenRows(state.enabledNetworkIds, addressForNetwork)

    /** Chains this name already holds a record for, from the last read. */
    const writtenChains = new Set<ChainKey>(
      Object.keys(ensName?.addresses ?? {}) as ChainKey[],
    )

    async function writeChain(fullName: string, chain: ChainKey): Promise<WalletNameDTO> {
      const seed = seedRef.current
      if (!seed) throw new Error('Wallet is still starting up')
      const address = addressFor(seed, chain, 0)
      const signature = await signOwnership(seed, api.addAddressMessage(fullName, chain, address))
      return api.addAddress({ fullName, chain, address, owner: state.owner, signature })
    }

    return {
      ...state,
      parent: DISPLAY_PARENT,
      wallet,
      ensName,
      isNamed: ensName !== null,
      walletTitle: ensName?.fullName ?? wallet?.label ?? 'Wallet',

      addressForChain,
      addressForNetwork,

      tokens,
      total: portfolioTotal(tokens),
      enabled: new Set(state.enabledNetworkIds),

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
      async claimName(label: string): Promise<WriteResult> {
        const seed = seedRef.current
        if (!seed) return { ok: false, error: 'Wallet is still starting up' }
        if (!wallet) return { ok: false, error: 'No wallet selected' }

        dispatch({ type: 'busy', busy: true })
        try {
          const signature = await signOwnership(seed, api.claimMessage(label, state.owner))
          const name = await api.mintName({
            label,
            owner: state.owner,
            signature,
            displayName: label,
          })

          dispatch({ type: 'setName', walletId: wallet.id, name })
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
      async saveNetworks(ids: string[]): Promise<WriteResult> {
        dispatch({ type: 'setNetworks', ids })
        if (!ensName) return { ok: true }

        const needed = chainsForNetworks(ids).filter((c) => !writtenChains.has(c))
        if (needed.length === 0) return { ok: true }

        dispatch({ type: 'busy', busy: true })
        try {
          let name = ensName
          for (const chain of needed) {
            name = await writeChain(ensName.fullName, chain)
          }
          dispatch({ type: 'setName', walletId: wallet.id, name })
          return { ok: true }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Could not update the name'
          return { ok: false, error: message }
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
        dispatch({
          type: 'addWallet',
          wallet: { id, label: `Wallet ${state.wallets.length + 1}`, name: null, kind },
        })
        return id
      },
      activateWallet: (id) => dispatch({ type: 'activateWallet', walletId: id }),

      // Deleting a wallet is local: the identity, its enabled networks and its
      // name record here. The name itself is a real subname on the registry and
      // stays there — deletion does not (and cannot) unwind it. This demo runs
      // one owner key for every wallet, so a name the deleted wallet held can
      // resurface on the next boot; the delete note on WalletDetail says so.
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
