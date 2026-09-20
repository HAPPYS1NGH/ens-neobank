import 'server-only'
import { createOffchainClient, type OffchainClient } from '@thenamespace/offchain-manager'
import { normalize } from 'viem/ens'
import { registry } from '@config'

/**
 * The parents this server is willing to write to. The list lives in
 * app.config.ts (`registry.allowedParents`). The server refuses to start if
 * NAMESPACE_PARENT_NAME is not in it — that guard is what stops a live API key
 * writing into the wrong registry. `null` accepts any valid ENS name.
 */

export interface ServerConfig {
  apiKey: string
  parentName: string
  network: 'mainnet' | 'sepolia'
}

let cached: ServerConfig | null = null

export class ConfigError extends Error {
  readonly status = 503
  readonly code = 'SERVICE_UNAVAILABLE'
}

/**
 * ENSIP-15 normalization, applied to the parent before any comparison.
 * The parent here is Unicode (`àlias.eth`), so a plain lowercase would leave
 * the combining-accent and precomposed forms as different strings and the
 * allowlist check would fail for reasons nobody could see.
 */
function normalizeParentName(raw: string): string | null {
  try {
    const normalized = normalize(raw.trim())
    return normalized.includes('.') ? normalized : null
  } catch {
    return null
  }
}

export function getServerConfig(): ServerConfig {
  if (cached) return cached

  const apiKey = process.env.NAMESPACE_API_KEY?.trim()
  if (!apiKey) throw new ConfigError('NAMESPACE_API_KEY is not set')

  const rawParent = process.env.NAMESPACE_PARENT_NAME?.trim()
  if (!rawParent) throw new ConfigError('NAMESPACE_PARENT_NAME is not set')

  const parentName = normalizeParentName(rawParent)
  if (!parentName) throw new ConfigError('NAMESPACE_PARENT_NAME is not a valid ENS name')

  if (registry.allowedParents) {
    const allowed = registry.allowedParents.map(normalizeParentName)
    if (!allowed.includes(parentName)) {
      throw new ConfigError(`Parent ${parentName} is not in the allowlist for this deployment`)
    }
  }

  const rawNetwork = (process.env.NAMESPACE_NETWORK ?? 'mainnet').trim()
  if (rawNetwork !== 'mainnet' && rawNetwork !== 'sepolia') {
    throw new ConfigError('NAMESPACE_NETWORK must be "mainnet" or "sepolia"')
  }

  cached = { apiKey, parentName, network: rawNetwork }
  return cached
}

export function createNamespaceClient(): OffchainClient {
  const cfg = getServerConfig()
  const client = createOffchainClient({ mode: cfg.network })
  client.setApiKey(cfg.parentName, cfg.apiKey)
  return client
}

/** Test/dev helper — config is memoized at module level. */
export function clearConfigCache(): void {
  cached = null
}
