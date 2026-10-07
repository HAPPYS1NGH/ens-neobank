import { neobank } from './brands'
import type { BrandConfig, RegistryConfig } from './types'

/*
 * The neobank this checkout is branded for.
 *
 * `npm run neobank:setup` overwrites this file from the bank's website (name,
 * logo, colours) and the ENS parent you pass it. Until then it is the unbranded
 * `neobank` base under ninza.eth. Hand edits after setup are expected: retune
 * colours from the screenshots in brand-scan/, rewrite copy in the bank's voice.
 */

export const clientRegistry: RegistryConfig = {
  allowedParents: ['ninza.eth'],
  productionParent: 'ninza.eth',
}

export const clientBrand: BrandConfig = neobank
