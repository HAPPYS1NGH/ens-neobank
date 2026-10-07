import { clientBrand, clientRegistry } from '@/config/client'
import type { AppConfig } from '@/config/types'

/*
 * Neobank branch. The bank's brand and parent live in src/config/client.ts,
 * which `npm run neobank:setup` generates. Edit that file, not this one.
 *
 * Secrets and per-deploy values live in the environment (setup writes them):
 *
 *   NAMESPACE_API_KEY             server-only, never reaches the browser
 *   NAMESPACE_PARENT_NAME         the parent you own, validated against `allowedParents`
 *   NAMESPACE_NETWORK             'mainnet' | 'sepolia'
 *   NEXT_PUBLIC_DISPLAY_PARENT    what the UI prints after the label; match the parent
 *
 * To see a colour swap, set `brand: brandPresets.example` (import from
 * '@/config/brands'), look at Home, then switch back.
 *
 * Read plot.md before changing a screen. Read AGENTS.md before adding a string.
 */
export const appConfig: AppConfig = {
  registry: clientRegistry,
  brand: clientBrand,
}

export const { brand, registry } = appConfig
