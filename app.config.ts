import { brandPresets } from '@/config/brands'
import type { AppConfig } from '@/config/types'

/*
 * The one file you edit to make this app a new client's demo.
 *
 * Everything here is static and non-secret — it is imported by both server
 * and client code. Secrets and per-deploy values live in the environment:
 *
 *   NAMESPACE_API_KEY             server-only, never reaches the browser
 *   NAMESPACE_PARENT_NAME         the parent you own, validated against `allowedParents`
 *   NAMESPACE_NETWORK             'mainnet' | 'sepolia'
 *   NEXT_PUBLIC_DISPLAY_PARENT    what the UI prints after the label; match the parent
 *
 * Read plot.md before changing a screen. Read AGENTS.md before adding a string.
 */
export const appConfig: AppConfig = {
  registry: {
    // The server refuses to start unless NAMESPACE_PARENT_NAME is in this list.
    // Replace with the parent you own. Set to `null` to accept any valid ENS
    // name — fine in local dev, risky with a live API key.
    allowedParents: ['ninza.eth'],
    productionParent: 'ninza.eth',
  },

  // Swap to `brandPresets.example` to see colour change with one line.
  // For a real client: copy `neutral` in src/config/brands.ts, rename it, edit.
  brand: brandPresets.ninza,
}

export const { brand, registry } = appConfig
