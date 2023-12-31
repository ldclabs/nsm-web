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

export const BytesToBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCodePoint(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')

export const BytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((i) => i.toString(16).padStart(2, '0'))
    .join('')
