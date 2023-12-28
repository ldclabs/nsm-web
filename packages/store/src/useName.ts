import { useCallback } from 'react'
import useSWR from 'swr'
import { encode } from './CBOR'
import { BytesToHex, type NameElement } from './common'
import { useFetcher } from './useFetcher'

export interface NameState {
  name: string
  sequence: number
  block_height: number
  block_time: number
  stale_time: number
  expire_time: number
  threshold: number
  key_kind: number
  public_keys: Uint8Array[]
  next_public_keys?: Uint8Array[]
}

export interface ServiceState {
  name: string
  sequence: number
  code: number
  data: [number, NameElement][]
}

export enum NameValidating {
  Empty,
  Invalid,
  Available,
  Inscribed,
}

export function diagServices(ss: ServiceState[]): string {
  let services = `services:\n`
  for (const s of ss) {
    services += `- code: ${s.code}\n`
    services += `  values:\n`
    for (const d of s.data) {
      services += `  - subcode: ${d[0]}\n`
      services += `    value: 0x${BytesToHex(encode(d[1]))}\n`
    }
  }
  return services
}

const path = '/v1/name'

export function useNameStateAPI() {
  const request = useFetcher()

  const getNameState = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request.get<{ result: NameState }>(path, params, signal)
    },
    [request]
  )

  const listNamesByQuery = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request.get<{ result: string[] }>(
        path + '/list_by_query',
        params,
        signal
      )
    },
    [request]
  )

  const listNamesByPubkey = useCallback(
    (params: { pubkey: string }, signal?: AbortSignal) => {
      return request.get<{ result: string[] }>(
        path + '/list_by_pubkey',
        params,
        signal
      )
    },
    [request]
  )

  return {
    getNameState,
    listNamesByQuery,
    listNamesByPubkey,
  } as const
}

const servicePath = '/v1/service'

export function useServiceStateAPI() {
  const request = useFetcher()

  const getServiceState = useCallback(
    (params: { name: string; code: number | string }, signal?: AbortSignal) => {
      return request.get<{ result: ServiceState }>(servicePath, params, signal)
    },
    [request]
  )

  const listServicesStateByName = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request.get<{ result: ServiceState[] }>(
        servicePath + '/list_by_name',
        params,
        signal
      )
    },
    [request]
  )

  return {
    getServiceState,
    listServicesStateByName,
  } as const
}

export function useNameState(name: string) {
  const { getNameState } = useNameStateAPI()

  const getKey = useCallback(() => {
    if (!name) return null
    return ['useNameState', name] as const
  }, [name])

  const { data, error, isValidating, isLoading } = useSWR(
    getKey,
    ([_keyPrefix, name]) => getNameState({ name }),
    { revalidateOnFocus: true, focusThrottleInterval: 60 * 1000 }
  )

  return {
    item: data?.result,
    error,
    isLoading,
    isValidating,
  } as const
}

export function useNameServicesState(name: string) {
  const { listServicesStateByName } = useServiceStateAPI()

  const getKey = useCallback(() => {
    if (!name) return null
    return ['useNameServicesState', name] as const
  }, [name])

  const { data, error, isValidating, isLoading } = useSWR(
    getKey,
    ([_keyPrefix, name]) => listServicesStateByName({ name }),
    { revalidateOnFocus: true, focusThrottleInterval: 60 * 1000 }
  )

  return {
    items: data?.result || [],
    error,
    isLoading,
    isValidating,
  } as const
}

export function useNamesByQuery(name: string) {
  const { listNamesByQuery } = useNameStateAPI()

  const getKey = useCallback(() => {
    if (!name) return null
    return ['useNamesByQuery', name] as const
  }, [name])

  const { data, error, isValidating, isLoading } = useSWR(
    getKey,
    ([_keyPrefix, name]) => listNamesByQuery({ name }),
    { focusThrottleInterval: 5 * 60 * 1000 }
  )
  const items = data?.result || []
  const validating =
    name == ''
      ? NameValidating.Empty
      : error
      ? NameValidating.Invalid
      : items.length > 0
      ? NameValidating.Inscribed
      : NameValidating.Available

  return {
    items,
    validating,
    error,
    isLoading,
    isValidating,
  } as const
}

export function useNamesByPubkey(pubkey: string) {
  const { listNamesByPubkey } = useNameStateAPI()

  const getKey = useCallback(() => {
    if (!pubkey) return null
    return ['useNamesByPubkey', pubkey] as const
  }, [pubkey])

  const { data, error, isValidating, isLoading } = useSWR(
    getKey,
    ([_keyPrefix, pubkey]) => listNamesByPubkey({ pubkey }),
    { focusThrottleInterval: 5 * 60 * 1000 }
  )

  return {
    items: data?.result || [],
    error,
    isLoading,
    isValidating,
  } as const
}
