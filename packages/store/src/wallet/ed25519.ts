import { hmac } from '@noble/hashes/hmac'
import { sha512 } from '@noble/hashes/sha512'
import { HARDENED_OFFSET } from './derivePath'

const ED25519_CURVE = 'ed25519 seed'

// SLIP-0010 https://github.com/satoshilabs/slips/blob/master/slip-0010.md
export function deriveEd25519(
  seed: Uint8Array,
  derivationPath: number[]
): Uint8Array {
  const keys = derivationPath.reduce(
    (parent, idx) => CKDPriv(parent, idx | HARDENED_OFFSET),
    getMasterKeyFromSeed(seed)
  )
  return keys.key
}

type Keys = {
  key: Uint8Array
  chainCode: Uint8Array
}

function hmacSha512(key: string | Uint8Array) {
  return hmac.create(sha512, key)
}

function getMasterKeyFromSeed(seed: Uint8Array): Keys {
  const I = hmacSha512(ED25519_CURVE).update(seed).digest()
  const IL = I.slice(0, 32)
  const IR = I.slice(32)
  return {
    key: IL,
    chainCode: IR,
  }
}

function CKDPriv({ key, chainCode }: Keys, index: number): Keys {
  const iBuf = new Uint8Array(4)
  iBuf[3] = index
  index = index >>> 8
  iBuf[2] = index
  index = index >>> 8
  iBuf[1] = index
  index = index >>> 8
  iBuf[0] = index

  const I = hmacSha512(chainCode)
    .update(new Uint8Array(1))
    .update(key)
    .update(iBuf)
    .digest()
  const IL = I.slice(0, 32)
  const IR = I.slice(32)
  return {
    key: IL,
    chainCode: IR,
  }
}
