import { encode } from 'cborg'
import * as iana from './iana'

export type CoseKeyMapkey = number | string

export type CoseKeyMapValue =
  | number
  | string
  | Uint8Array
  | boolean
  | CoseKeyMapValue[]

export class CoseKey {
  private raw: Map<CoseKeyMapkey, CoseKeyMapValue> = new Map()

  constructor() {}

  get kty(): number | undefined {
    return this.raw.get(iana.KeyParameterKty) as number
  }

  set kty(value: number) {
    this.raw.set(iana.KeyParameterKty, value)
  }

  get kid(): Uint8Array | undefined {
    return this.raw.get(iana.KeyParameterKid) as Uint8Array
  }

  set kid(value: Uint8Array) {
    this.raw.set(iana.KeyParameterKid, value)
  }

  get alg(): number | undefined {
    return this.raw.get(iana.KeyParameterAlg) as number
  }

  set alg(value: number) {
    this.raw.set(iana.KeyParameterAlg, value)
  }

  get ops(): number[] | undefined {
    return this.raw.get(iana.KeyParameterKeyOps) as number[]
  }

  set ops(value: number[]) {
    this.raw.set(iana.KeyParameterKeyOps, value)
  }

  get baseIV(): Uint8Array | undefined {
    return this.raw.get(iana.KeyParameterBaseIV) as Uint8Array
  }

  set baseIV(value: Uint8Array) {
    this.raw.set(iana.KeyParameterBaseIV, value)
  }

  getParam(key: CoseKeyMapkey): CoseKeyMapValue | undefined {
    return this.raw.get(key)
  }

  setParam(key: CoseKeyMapkey, value: CoseKeyMapValue) {
    this.raw.set(key, value)
  }

  toBytes(): Uint8Array {
    return encode(this.raw)
  }
}
