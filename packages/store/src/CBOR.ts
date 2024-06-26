import { isBlobURL } from '@nsm-web/util'
// missing types
import { decode as _decode, encode as _encode } from 'cborg' // eslint-disable-line import/order

// re-export with the right types
export function decode(data: Uint8Array) {
  return _decode(data, {
    useMaps: true,
    rejectDuplicateMapKeys: true,
  })
}

export function encode(data: unknown) {
  return _encode(data, {})
}

export function createBlobURL(object: unknown) {
  return btoa(
    URL.createObjectURL(
      new Blob([encode(object)], { type: 'application/cbor' })
    )
  )
}

export async function parseBlobURL<T>(url: string) {
  try {
    url = atob(url)
    if (!isBlobURL(url)) return null
    const resp = await fetch(url)
    const blob = await resp.blob()
    if (blob.type !== 'application/cbor') return null
    const buffer = await blob.arrayBuffer()
    return decode(new Uint8Array(buffer)) as T
  } catch {
    return null
  }
}

export function revokeBlobURL(url: string) {
  try {
    url = atob(url)
    isBlobURL(url) && URL.revokeObjectURL(url)
  } catch {
    // ...
  }
}

export function mapToObj(m: any) {
  if (!(m instanceof Map)) {
    return m
  }

  const obj: any = {}
  for (const [key, val] of m) {
    obj[typeof key === 'string' ? key : String(key)] = val
  }
  return obj
}
