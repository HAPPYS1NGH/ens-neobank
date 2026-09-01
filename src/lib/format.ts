/**
 * Display formatting, in Tangem's conventions rather than D'CENT's.
 *
 * Two of them are worth stating outright because they are easy to "fix" back:
 *
 * - Tangem shows addresses IN FULL. The Receive sheet in IMG_4299 prints
 *   `0x98EEc6E5bE5FcF8D4027Aa7058bc24c4e2007597` across the width of the card,
 *   with a plain `0x`. There is no `0×3658…0744` truncation here — that was
 *   D'CENT's house style. Truncation exists only for a contact row, where the
 *   name is the subject and the address is the footnote.
 *
 * - The balance is two-tone. `$0.00` renders as a large `$0` and a smaller
 *   `.00` (IMG_4299, IMG_4306), so several screens need the two halves
 *   separately rather than one string.
 *
 * - Percentages carry a space before the sign: `0.38 %`.
 */

/* --------------------------------- money -------------------------------- */

/** `$0.00` — the plain full form, used wherever the split is not needed. */
export function usd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export interface SplitBalance {
  /** `$0` — rendered large. */
  whole: string
  /** `.00` — rendered smaller and greyer. */
  fraction: string
}

/**
 * Tangem's two-tone balance. The dollars and the cents are separate elements
 * at different sizes, so hand the screen both halves and let it style them.
 */
export function splitUsd(value: number): SplitBalance {
  const full = usd(value)
  const dot = full.lastIndexOf('.')
  if (dot === -1) return { whole: full, fraction: '' }
  return { whole: full.slice(0, dot), fraction: full.slice(dot) }
}

/**
 * A market price. Unlike a balance this keeps its natural precision, so
 * sub-cent coins still read as prices rather than as `$0.00`.
 */
export function price(value: number): string {
  const digits = value >= 1 ? 2 : 4
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/* -------------------------------- amounts ------------------------------- */

/**
 * Tangem puts the ticker FIRST on a token row: `BTC 0.00`, `ETH 0.00`.
 * (IMG_4306, right-hand column.)
 */
export function tokenAmount(value: number, ticker: string): string {
  return `${ticker} ${coinAmount(value)}`
}

/** Just the number, at a sensible precision for a coin balance. */
export function coinAmount(value: number): string {
  if (value === 0) return '0.00'
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
}

export type ChangeDirection = 'up' | 'down' | 'flat'

export interface PercentChange {
  direction: ChangeDirection
  /** `0.38 %` — the magnitude, with Tangem's space before the sign. */
  text: string
}

/**
 * The red/green pair under a price. The arrow glyph is the screen's business;
 * this only says which way it points and what number sits beside it.
 */
export function percentChange(value: number): PercentChange {
  const direction: ChangeDirection = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  const magnitude = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return { direction, text: `${magnitude} %` }
}

/* ------------------------------- addresses ------------------------------ */

/**
 * The Receive sheet's form: the whole address, unmodified. A separate function
 * from "just use the string" so the intent is greppable and nobody quietly
 * swaps a truncation back in.
 */
export function fullAddress(address: string): string {
  return address
}

/**
 * Truncation for a contact row, where the address is secondary to the name.
 * Plain `0x`, an ellipsis character, no substitutions.
 */
export function shortAddress(address: string, lead = 6, tail = 4): string {
  if (!address) return ''
  if (address.length <= lead + tail + 1) return address
  return `${address.slice(0, lead)}…${address.slice(-tail)}`
}

/* --------------------------------- names -------------------------------- */

/**
 * Mirrors `normalizeLabel` in src/server/validation.ts so the name field can
 * show what will actually be claimed while the user is still typing. The
 * server normalizes again and is the authority; this is only a preview, and it
 * exists because silently mangling someone's name at submit time is worse than
 * showing them the change as they make it.
 */
export function normalizeLabelPreview(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** `harpreet` + `tange.eth` → `harpreet.tange.eth`. */
export function fullNameFor(label: string, parent: string): string {
  return `${label}.${parent}`
}

/** `harpreet.tange.eth` → `harpreet`. */
export function labelOf(fullName: string): string {
  return fullName.split('.')[0] ?? fullName
}
