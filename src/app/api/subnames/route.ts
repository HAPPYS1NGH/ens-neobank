import { NextRequest } from 'next/server'
import { handle, ok, httpError } from '@/server/http'
import { mintName, addAddress, findNameByOwner } from '@/server/namespace'
import { claimMessage, addAddressMessage, requireSigner } from '@/server/proof'
import { isChainKey } from '@/lib/chains'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/subnames?owner=0x… — the wallet's name, if it has one. */
export async function GET(request: NextRequest) {
  return handle(async () => {
    const owner = request.nextUrl.searchParams.get('owner')
    if (!owner) throw httpError('No owner given', 400, 'OWNER_MISSING')
    const name = await findNameByOwner(owner)
    return ok({ name })
  })
}

/** POST /api/subnames — mint a name at the moment an account is named. */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const body = await request.json().catch(() => null)
    if (!body) throw httpError('Malformed request', 400, 'JSON_INVALID')

    const { label, chain, address, owner, signature, displayName } = body as Record<string, string>
    if (!label) throw httpError('No name given', 400, 'LABEL_MISSING')
    if (!chain || !isChainKey(chain)) throw httpError('Unknown chain', 400, 'CHAIN_UNKNOWN')
    if (!address) throw httpError('No account address given', 400, 'ADDRESS_MISSING')

    const verified = await requireSigner(claimMessage(label, owner), signature, owner)

    const name = await mintName({
      label,
      owner: verified,
      chain,
      address,
      displayName: displayName || label,
    })
    return ok({ name }, 201)
  })
}

/** PATCH /api/subnames — attach another account's address to the same name. */
export async function PATCH(request: NextRequest) {
  return handle(async () => {
    const body = await request.json().catch(() => null)
    if (!body) throw httpError('Malformed request', 400, 'JSON_INVALID')

    const { fullName, chain, address, owner, signature } = body as Record<string, string>
    if (!fullName) throw httpError('No name given', 400, 'NAME_MISSING')
    if (!chain || !isChainKey(chain)) throw httpError('Unknown chain', 400, 'CHAIN_UNKNOWN')
    if (!address) throw httpError('No account address given', 400, 'ADDRESS_MISSING')

    const verified = await requireSigner(
      addAddressMessage(fullName, chain, address),
      signature,
      owner,
    )

    const name = await addAddress({ fullName, owner: verified, chain, address })
    return ok({ name })
  })
}
