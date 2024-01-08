import { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { encode, mapToObj } from './CBOR'
import { BytesToHex, type NameElement } from './common'
import { useFetcher } from './useFetcher'

const last_accepted = { height: 0 }

export interface QueryInscription {
  name: string
  sequence?: number
}

export interface Inscription {
  name: string
  sequence: number
  height: number
  name_height: number
  previous_hash: Uint8Array
  name_hash: Uint8Array
  service_hash: Uint8Array
  protocol_hash?: Uint8Array
  block_height: number
  block_hash: Uint8Array
  txid: Uint8Array
  vin: number
  data: NameElement[]
  __best?: boolean
}

export function inscriptionFromRaw(vals: NameElement[]): Inscription {
  if (!Array.isArray(vals)) {
    return mapToObj(vals) as Inscription
  }

  const ins_state = vals[3] as NameElement[]
  const tx_state = vals[4] as NameElement[]
  const ins: Inscription = {
    name: vals[0] as string,
    sequence: vals[1] as number,
    height: vals[2] as number,
    name_height: ins_state[0] as number,
    previous_hash: ins_state[1] as Uint8Array,
    name_hash: ins_state[2] as Uint8Array,
    service_hash: ins_state[3] as Uint8Array,
    block_height: tx_state[0] as number,
    block_hash: tx_state[1] as Uint8Array,
    txid: tx_state[2] as Uint8Array,
    vin: tx_state[3] as number,
    data: vals[5] as NameElement[],
  }
  if (ins_state.length === 5) {
    ins.protocol_hash = ins_state[4] as Uint8Array
  }
  return ins
}

export interface InvalidInscription {
  name: string
  block_height: number
  hash: Uint8Array
  reason: string
  data: NameElement[]
}

export function diagName(val: Array<NameElement>): string {
  const srvArr = val[2] as Array<NameElement>
  const sigArr = val[3] as Array<Uint8Array>
  let name = `name: ${val[0]}\n`
  name += `sequence: ${val[1]}\n`
  name += `service:\n`
  name += `  code: ${srvArr[0]}\n`
  name += `  operations:\n`
  for (const op of srvArr[1] as Array<Array<NameElement>>) {
    name += `  - subcode: ${op[0]}\n`
    name += `    params: 0x${BytesToHex(encode(op[1]))}\n`
  }
  if (srvArr[2]) {
    name += `  approver: ${srvArr[2]}\n`
  }
  name += `signatures:\n`
  for (const sig of sigArr) {
    name += `- 0x${BytesToHex(sig)}\n`
  }
  return name
}

const path = '/v1/inscription'

export function useInscriptionAPI() {
  const request = useFetcher()

  const getInscription = useCallback(
    (
      params: Record<keyof QueryInscription, string | undefined>,
      signal?: AbortSignal
    ) => {
      return request
        .get<{ result: NameElement[] }>(path, params, signal)
        .then((v) => inscriptionFromRaw(v.result))
    },
    [request]
  )

  const getBestInscription = useCallback(
    (
      params: Record<keyof QueryInscription, string | undefined>,
      signal?: AbortSignal
    ) => {
      return request
        .get<{ result: NameElement[] }>('/best/inscription', params, signal)
        .catch(() =>
          request.get<{ result: NameElement[] }>(path, params, signal)
        )
        .then((v) => inscriptionFromRaw(v.result))
    },
    [request]
  )

  const getLastAcceptedInscription = useCallback(
    (signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>(
          path + '/get_last_accepted',
          undefined,
          signal
        )
        .then((v) => {
          const res = inscriptionFromRaw(v.result)
          last_accepted.height = res.height
          return res
        })
    },
    [request]
  )

  const getInscriptionByHeight = useCallback(
    (params: { height: string | number }, signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>(path + '/get_by_height', params, signal)
        .then((v) => inscriptionFromRaw(v.result))
    },
    [request]
  )

  const getBestInscriptionByHeight = useCallback(
    (params: { height: string | number }, signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>(
          '/best/inscription/get_by_height',
          params,
          signal
        )
        .catch(() =>
          request.get<{ result: NameElement[] }>(
            path + '/get_by_height',
            params,
            signal
          )
        )
        .then((v) => inscriptionFromRaw(v.result))
    },
    [request]
  )

  const listBestInscriptions = useCallback(
    (signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>(
          '/best/inscription/list',
          undefined,
          signal
        )
        .then((v) =>
          v.result.map((r) => inscriptionFromRaw(r as NameElement[]))
        )
    },
    [request]
  )

  const listInscriptionsByName = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>(path + '/list_by_name', params, signal)
        .then((v) =>
          v.result.map((r) => inscriptionFromRaw(r as NameElement[]))
        )
    },
    [request]
  )

  const listInscriptionsByBlockHeight = useCallback(
    (params: { height: number }, signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>(
          path + '/list_by_block_height',
          params,
          signal
        )
        .then((v) =>
          v.result.map((r) => inscriptionFromRaw(r as NameElement[]))
        )
    },
    [request]
  )

  const listInvalidInscriptionsByName = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request
        .get<{ result: NameElement[] }>(
          '/v1/invalid_inscription/list_by_name',
          params,
          signal
        )
        .then((v) => v.result.map((r) => mapToObj(r) as InvalidInscription))
    },
    [request]
  )

  return {
    getInscription,
    getBestInscription,
    getLastAcceptedInscription,
    getInscriptionByHeight,
    getBestInscriptionByHeight,
    listBestInscriptions,
    listInscriptionsByName,
    listInscriptionsByBlockHeight,
    listInvalidInscriptionsByName,
  } as const
}

export function useInscription({
  height,
  name,
  sequence,
  best = false,
}: {
  height?: number | string
  name?: string
  sequence?: number | string
  best?: boolean
}) {
  const {
    getInscription,
    getBestInscription,
    getInscriptionByHeight,
    getBestInscriptionByHeight,
  } = useInscriptionAPI()

  const getKey = useCallback(() => {
    if (!name && !height) return null
    if (height) {
      return ['useInscriptions', height] as const
    }

    const params = {
      name,
      sequence: String(sequence),
    }
    return ['useInscription', params] as const
  }, [height, name, sequence])

  const { data, error, isValidating, isLoading } = useSWR(
    getKey,
    ([keyPrefix, params]) =>
      keyPrefix == 'useInscriptions'
        ? best
          ? getBestInscriptionByHeight({ height: params })
          : getInscriptionByHeight({ height: params })
        : best
        ? getBestInscription(params)
        : getInscription(params),
    {}
  )

  return {
    item: data && { ...data, __best: best },
    error,
    isLoading,
    isValidating,
  } as const
}

export function useLastAcceptedInscription() {
  const { getLastAcceptedInscription } = useInscriptionAPI()

  const { data, error } = useSWR(
    'useLastAcceptedInscription',
    ([_]) => getLastAcceptedInscription(),
    { revalidateOnFocus: true, refreshInterval: 8000 }
  )

  return {
    error,
    item: data,
  } as const
}

export function useBestInscriptions() {
  const { listBestInscriptions } = useInscriptionAPI()

  const { data, error } = useSWR(
    'useBestInscriptions',
    ([_]) => listBestInscriptions(),
    { revalidateOnFocus: true, refreshInterval: 8000 }
  )

  return {
    error,
    items: (data?.map((ins) => ({ ...ins, __best: true })) ||
      []) as Inscription[],
  } as const
}

export function useInscriptions(last_accepted_height: number) {
  const { getInscriptionByHeight } = useInscriptionAPI()

  const getKey = useCallback(
    (_: unknown, prevPage: Inscription | null) => {
      const height = prevPage?.height
        ? prevPage.height - 1
        : last_accepted_height - 1

      if (height < 1) return null

      return ['useInscriptions', height] as const
    },
    [last_accepted_height]
  )

  const { data, error, isValidating, isLoading, setSize } = useSWRInfinite(
    getKey,
    ([_, height]) => getInscriptionByHeight({ height }),
    { revalidateFirstPage: false }
  )

  const items = useMemo(() => {
    if (!data) return []
    return data.flatMap((page) => page)
  }, [data])

  const hasMore = useMemo(() => {
    if (!data || error) return false
    const height = data[data.length - 1]?.height
    return (height as number) > 1
  }, [data, error])

  const loadMore = useCallback(() => setSize((size) => size + 3), [setSize])

  return {
    isLoading,
    isValidating,
    error,
    items,
    hasMore,
    loadMore,
  }
}

export function useInvalidInscriptions(name: string) {
  const { listInvalidInscriptionsByName } = useInscriptionAPI()

  const getKey = useCallback(() => {
    if (!name) return null
    const params = {
      name,
    }
    return ['useInvalidInscriptions', params] as const
  }, [name])

  const { data, error, isValidating, isLoading } = useSWR(
    getKey,
    ([_keyPrefix, params]) => listInvalidInscriptionsByName(params),
    {}
  )

  return {
    items: data,
    error,
    isLoading,
    isValidating,
  } as const
}
