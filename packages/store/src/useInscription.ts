import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import useSWRSubscription from 'swr/subscription'
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
  data: Uint8Array
}

export interface InvalidInscription {
  name: string
  block_height: number
  hash: Uint8Array
  reason: string
  data: Uint8Array
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
    (params: { height: number }, signal?: AbortSignal) => {
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

export function useInscription(name: string, sequence: number) {
  const { getInscription } = useInscriptionAPI()

  const getKey = useCallback(() => {
    if (!name) return null
    const params = {
      name,
      sequence: String(sequence),
    }
    return ['useInscription', params] as const
  }, [name, sequence])

  const { data, error, isValidating, isLoading } = useSWR(
    getKey,
    ([_keyPrefix, params]) => getInscription(params),
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

  const [controller, setController] = useState<AbortController | undefined>()

  useEffect(() => {
    const controller = new AbortController()
    setController(controller)
    return () => controller.abort()
  }, [])

  const { data, error } = useSWRSubscription(
    'useLastAcceptedInscription',
    ([_], { next }) => {
      ;(async () => {
        const v = true
        while (v) {
          const result = await getLastAcceptedInscription(controller?.signal)
          if (result) {
            next(undefined, result)
          }
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      })().catch((err) => next(err))
      return () => controller?.abort()
    }
  )

  return {
    error,
    item: data?.result,
  } as const
}

export function useBestInscriptions() {
  const { listBestInscriptions } = useInscriptionAPI()

  const [controller, setController] = useState<AbortController | undefined>()

  useEffect(() => {
    const controller = new AbortController()
    setController(controller)
    return () => controller.abort()
  }, [])

  const { data, error } = useSWRSubscription(
    'useBestInscriptions',
    ([_], { next }) => {
      ;(async () => {
        const v = true
        while (v) {
          const result = await listBestInscriptions(controller?.signal)
          if (result) {
            next(undefined, result)
          }
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      })().catch((err) => next(err))
      return () => controller?.abort()
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

  const loadMore = useCallback(() => setSize((size) => size + 1), [setSize])

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
