import { useCallback } from 'react'
import useSWR from 'swr'
import { encode, mapToObj } from './CBOR'
import { bytesToHex, type NameElement } from './common'
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
  __best?: boolean
}

export function nameStateFromRaw(vals: NameElement[]): NameState {
  if (!Array.isArray(vals)) {
    return mapToObj(vals) as NameState
  }
  const state: NameState = {
    name: vals[0] as string,
    sequence: vals[1] as number,
    block_height: vals[2] as number,
    block_time: vals[3] as number,
    stale_time: vals[4] as number,
    expire_time: vals[5] as number,
    threshold: vals[6] as number,
    key_kind: vals[7] as number,
    public_keys: vals[8] as Uint8Array[],
  }
  if (vals.length == 10) {
    state.next_public_keys = vals[9] as Uint8Array[]
  }
  return state
}

export interface ServiceState {
  name: string
  code: number
  sequence: number
  data: Map<number, NameElement>
}

export function serviceStateFromRaw(vals: NameElement[]): ServiceState {
  if (!Array.isArray(vals)) {
    return mapToObj(vals) as ServiceState
  }
  const state: ServiceState = {
    name: vals[0] as string,
    code: vals[1] as number,
    sequence: vals[2] as number,
    data: vals[3] as any as Map<number, NameElement>,
  }
  return state
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
    for (const [key, val] of s.data) {
      services += `  - subcode: ${key}\n`
      services += `    value: 0x${bytesToHex(encode(val))}\n`
    }
  }
  return services
}

const path = '/v1/name'

export function useNameStateAPI() {
  const request = useFetcher()

  const getNameState = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>(path, params, signal)
        .then((v) => nameStateFromRaw(v.result))
    },
    [request]
  )

  const getBestNameState = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>('/best/name', params, signal)
        .catch(() =>
          request.get<{ result: NameElement[] }>(path, params, signal)
        )
        .then((v) => nameStateFromRaw(v.result))
    },
    [request]
  )

  const listNamesByQuery = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request
        .get<{ result: string[] }>(path + '/list_by_query', params, signal)
        .then((v) => v.result)
    },
    [request]
  )

  const listNamesByPubkey = useCallback(
    (params: { pubkey: string }, signal?: AbortSignal) => {
      return request
        .get<{ result: string[] }>(path + '/list_by_pubkey', params, signal)
        .then((v) => v.result)
    },
    [request]
  )

  return {
    getNameState,
    getBestNameState,
    listNamesByQuery,
    listNamesByPubkey,
  } as const
}

const servicePath = '/v1/service'

export function useServiceStateAPI() {
  const request = useFetcher()

  const getServiceState = useCallback(
    (params: { name: string; code: number | string }, signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>(servicePath, params, signal)
        .then((v) => serviceStateFromRaw(v.result))
    },
    [request]
  )

  const getBestServiceState = useCallback(
    (params: { name: string; code: number | string }, signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>('/best/service', params, signal)
        .catch(() =>
          request.get<{ result: NameElement[] }>(servicePath, params, signal)
        )
        .then((v) => serviceStateFromRaw(v.result))
    },
    [request]
  )

  const listServicesStateByName = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[][] }>(
          servicePath + '/list_by_name',
          params,
          signal
        )
        .then((v) => v.result.map((r) => serviceStateFromRaw(r)))
    },
    [request]
  )

  return {
    getServiceState,
    getBestServiceState,
    listServicesStateByName,
  } as const
}

export function useNameState(name: string, best = false) {
  const { getNameState, getBestNameState } = useNameStateAPI()

  const getKey = useCallback(() => {
    if (!name) return null
    return ['useNameState', name] as const
  }, [name])

  const { data, error, isValidating, isLoading } = useSWR(
    getKey,
    ([_keyPrefix, name]) =>
      best ? getBestNameState({ name }) : getNameState({ name }),
    { revalidateOnFocus: true, focusThrottleInterval: 60 * 1000 }
  )

  return {
    item: data && ({ ...data, __best: best } as NameState),
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
    items: data || [],
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
  const items = data || []
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
    items: data || [],
    error,
    isLoading,
    isValidating,
  } as const
}
