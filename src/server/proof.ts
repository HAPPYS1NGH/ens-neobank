import 'server-only'
import { verifyMessage } from 'viem'
import { brand } from '@config'
import { httpError } from './http'
import { isEvmAddress } from './validation'

/**
 * The wallet proves it controls the account before the server writes a name.
 *
 * This replaces the SIWE + nonce + session-cookie ceremony the profile demos
 * use. There is no session to establish here: every write is a single action
 * the wallet takes with a key it already holds, so a single signature over a
 * message naming that exact action is the honest primitive.
 *
 * The message binds the action, the label and the address together, so a
 * signature captured for one claim cannot be replayed to write another.
 */
export function claimMessage(label: string, address: string): string {
  return `${brand.copy.proofPrefix}\nClaim name: ${label}\nAccount: ${address.toLowerCase()}`
}

export function addAddressMessage(fullName: string, chain: string, address: string): string {
  return `${brand.copy.proofPrefix}\nAdd address to: ${fullName}\nChain: ${chain}\nAddress: ${address}`
}

export async function requireSigner(
  message: string,
  signature: string,
  claimedAddress: string,
): Promise<string> {
  if (!isEvmAddress(claimedAddress)) {
    throw httpError('Invalid account address', 400, 'OWNER_INVALID')
  }
  if (typeof signature !== 'string' || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    throw httpError('Missing or malformed signature', 400, 'SIGNATURE_INVALID')
  }
  const valid = await verifyMessage({
    address: claimedAddress as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  })
  if (!valid) throw httpError('Signature does not match this account', 401, 'SIGNATURE_MISMATCH')
  return claimedAddress.toLowerCase()
}
