export {
  base64ToBytes,
  bytesToBase64Url,
  bytesToHex,
  compareBytes,
  concatBytes,
  decodeCBOR,
  encodeCBOR,
  hexToBytes,
  randomBytes,
  toBytes,
  utf8ToBytes,
} from '@ldclabs/cose-ts/utils'
export interface QueryPagination {
  page_token?: string
  page_size?: number
  status?: number
  fields?: string
}

export interface Page<T> {
  next_page_token: Uint8Array | null
  result: readonly T[]
}

export interface UserInfo {
  cn: string
  name: string
  locale: string
  picture: string
}

export type NameElement = string | number | Uint8Array | Array<NameElement>

export function isInWechat() {
  return window.navigator.userAgent.toLowerCase().includes('micromessenger/')
}
