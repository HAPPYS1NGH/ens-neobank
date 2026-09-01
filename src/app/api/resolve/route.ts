import { NextRequest } from 'next/server'
import { handle, ok, httpError } from '@/server/http'
import { resolveForChain } from '@/server/resolve'
import { isChainKey } from '@/lib/chains'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/resolve?name=<what the user typed>&chain=<chain key>
 *
 * One endpoint, two lookups: names under our parent come from the registry,
 * everything else goes through public ENS. The response says which answered so
 * the Send screen can show the user where the address came from.
 */
export async function GET(request: NextRequest) {
  return handle(async () => {
    const name = request.nextUrl.searchParams.get('name')
    const chain = request.nextUrl.searchParams.get('chain')
    if (!name) throw httpError('No name given', 400, 'NAME_MISSING')
    if (!chain || !isChainKey(chain)) throw httpError('Unknown chain', 400, 'CHAIN_UNKNOWN')
    return ok(await resolveForChain(name, chain))
  })
}
