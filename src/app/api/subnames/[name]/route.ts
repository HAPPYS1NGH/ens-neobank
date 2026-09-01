import { handle, ok, httpError } from '@/server/http'
import { readName } from '@/server/namespace'
import { getServerConfig } from '@/server/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/subnames/<label or full name> — what the Send screen calls.
 *
 * Accepts either a bare label or a fully-qualified name, and accepts the
 * display suffix the UI shows as well as the real parent, so a user can type
 * what they see on screen and still get a hit.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  return handle(async () => {
    const { name: raw } = await params
    const cfg = getServerConfig()
    const decoded = decodeURIComponent(raw).trim().toLowerCase()
    if (!decoded) throw httpError('No name given', 400, 'NAME_MISSING')

    const label = decoded.includes('.') ? decoded.split('.')[0] : decoded
    const name = await readName(`${label}.${cfg.parentName}`)
    if (!name) throw httpError('No wallet uses that name', 404, 'NAME_NOT_FOUND')
    return ok({ name })
  })
}
