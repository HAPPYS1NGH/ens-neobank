import { NextRequest } from 'next/server'
import { handle, ok, httpError } from '@/server/http'
import { isAvailable } from '@/server/namespace'
import { normalizeLabel } from '@/server/validation'
import { getServerConfig } from '@/server/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handle(async () => {
    const raw = request.nextUrl.searchParams.get('label')
    if (!raw) throw httpError('No name given', 400, 'LABEL_MISSING')
    const label = normalizeLabel(raw)
    const cfg = getServerConfig()
    // `isAvailable` validates the label and throws a coded 400 the UI renders
    // verbatim, so the field can explain exactly why a name was rejected.
    const available = await isAvailable(label)
    return ok({ label, available, parentName: cfg.parentName })
  })
}
