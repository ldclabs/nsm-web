import { secp256k1 } from '@noble/curves/secp256k1'

export function newSecp256k1(): Uint8Array {
  return secp256k1.utils.randomPrivateKey()
}

export function getPublicKey(privateKey: Uint8Array): Uint8Array {
  return secp256k1.getPublicKey(privateKey)
}

export function signDataHash(privateKey: Uint8Array, hash: Uint8Array): string {
  return secp256k1.sign(hash, privateKey).toCompactHex()
}

export function verifyDataHash(
  publicKey: Uint8Array,
  hash: Uint8Array,
  signature: string
): boolean {
  return secp256k1.verify(signature, hash, publicKey)
}
