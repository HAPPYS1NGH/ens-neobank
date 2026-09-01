import { httpError } from './http'

/**
 * Labels are ASCII-only, even though the parent is Unicode.
 *
 * This is a real constraint to design around rather than hide: a user typing
 * an accented or Korean account name would have it silently mangled. The UI
 * shows the normalized label live under the field so the change is visible
 * before they commit to it.
 */
export function normalizeLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

const RESERVED = new Set([
  'admin', 'api', 'app', 'tangem', 'root', 'www', 'support', 'help',
  'wallet', 'settings', 'account', 'test', 'null', 'undefined',
])

export const LABEL_MIN = 3
export const LABEL_MAX = 20

export function validateLabel(label: string): void {
  if (label.length < LABEL_MIN) {
    throw httpError(`Name must be at least ${LABEL_MIN} characters`, 400, 'LABEL_TOO_SHORT')
  }
  if (label.length > LABEL_MAX) {
    throw httpError(`Name must be ${LABEL_MAX} characters or fewer`, 400, 'LABEL_TOO_LONG')
  }
  if (!/^[a-z0-9-]+$/.test(label)) {
    throw httpError('Name can only use letters, numbers and hyphens', 400, 'LABEL_INVALID')
  }
  if (label.startsWith('-') || label.endsWith('-')) {
    throw httpError('Name cannot start or end with a hyphen', 400, 'LABEL_HYPHEN_EDGE')
  }
  if (RESERVED.has(label)) {
    throw httpError('That name is reserved', 400, 'LABEL_RESERVED')
  }
}

export function isEvmAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value)
}
