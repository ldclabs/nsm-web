import { useCallback, useMemo, useRef } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import useSWRSubscription from 'swr/subscription'
import { encode } from './CBOR'
import { BytesToHex, type NameElement } from './common'
import { useFetcher } from './useFetcher'

export interface QueryInscription {
  name: string
  sequence?: number
}

export interface Inscription {
  name: string
  sequence: number
  height: number
  name_height: number
  block_height: number
  previous_hash: Uint8Array
  name_hash: Uint8Array
  service_hash: Uint8Array
  protocol_hash?: Uint8Array
  block_hash: Uint8Array
  txid: Uint8Array
  vin: number
  data: NameElement[]
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
      return request.get<{ result: Inscription }>(path, params, signal)
    },
    [request]
  )

  const getLastAcceptedInscription = useCallback(
    (signal?: AbortSignal) => {
      return request.get<{ result: Inscription }>(
        path + '/get_last_accepted',
        undefined,
        signal
      )
    },
    [request]
  )

  const getInscriptionByHeight = useCallback(
    (params: { height: string | number }, signal?: AbortSignal) => {
      return request.get<{ result: Inscription }>(
        path + '/get_by_height',
        params,
        signal
      )
    },
    [request]
  )

  const listBestInscriptions = useCallback(
    (signal?: AbortSignal) => {
      return request.get<{ result: Inscription[] }>(
        '/best/inscription/list',
        undefined,
        signal
      )
    },
    [request]
  )

  const listInscriptionsByName = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request.get<{ result: Inscription[] }>(
        path + '/list_by_name',
        params,
        signal
      )
    },
    [request]
  )

  const listInscriptionsByBlockHeight = useCallback(
    (params: { height: number }, signal?: AbortSignal) => {
      return request.get<{ result: Inscription[] }>(
        path + '/list_by_block_height',
        params,
        signal
      )
    },
    [request]
  )

  const listInvalidInscriptionsByName = useCallback(
    (params: { name: string }, signal?: AbortSignal) => {
      return request.get<{ result: InvalidInscription[] }>(
        '/v1/invalid_inscription/list_by_name',
        params,
        signal
      )
    },
    [request]
  )

  return {
    getInscription,
    getLastAcceptedInscription,
    getInscriptionByHeight,
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
}: {
  height?: number | string
  name?: string
  sequence?: number | string
}) {
  const { getInscription, getInscriptionByHeight } = useInscriptionAPI()

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
        ? getInscriptionByHeight({ height: params })
        : getInscription(params),
    {}
  )

  return {
    item: data?.result,
    error,
    isLoading,
    isValidating,
  } as const
}

export function useLastAcceptedInscription() {
  const { getLastAcceptedInscription } = useInscriptionAPI()

  const controllerRef = useRef<AbortController | undefined>(undefined)

  const { data, error } = useSWRSubscription(
    'useLastAcceptedInscription',
    ([_], { next }) => {
      const controller = new AbortController()
      controllerRef.current?.abort()
      controllerRef.current = controller
      ;(async () => {
        while (!controller.signal.aborted) {
          const result = await getLastAcceptedInscription(controller.signal)
          if (result) {
            next(undefined, result)
          }
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      })().catch((err) => next(err))
      return () => controller.abort()
    }
  )

  return {
    error,
    item: data?.result,
  } as const
}

export function useBestInscriptions() {
  const { listBestInscriptions } = useInscriptionAPI()

  const controllerRef = useRef<AbortController | undefined>(undefined)

  const { data, error } = useSWRSubscription(
    'useBestInscriptions',
    ([_], { next }) => {
      const controller = new AbortController()
      controllerRef.current?.abort()
      controllerRef.current = controller
      ;(async () => {
        while (!controller.signal.aborted) {
          const result = await listBestInscriptions(controller.signal)
          if (result) {
            next(undefined, result)
          }
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      })().catch((err) => next(err))
      return () => controller.abort()
    }
  )

  return {
    error,
    items: (data || []) as Inscription[],
  } as const
}

export function useInscriptions(last_accepted_height: number) {
  const { getInscriptionByHeight } = useInscriptionAPI()

  const getKey = useCallback(
    (_: unknown, prevPage: { result: Inscription } | null) => {
      const height = prevPage?.result?.height
        ? prevPage.result.height - 1
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
    return data.flatMap((page) => page.result)
  }, [data])

  const hasMore = useMemo(() => {
    if (!data || error) return false
    const height = data[data.length - 1]?.result?.height
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
    items: data?.result,
    error,
    isLoading,
    isValidating,
  } as const
}
