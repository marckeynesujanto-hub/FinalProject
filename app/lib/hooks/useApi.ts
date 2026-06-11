'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiClientError } from '@/app/lib/api/client'

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseApiOptions {
  /** Fetch immediately on mount (default: true) */
  immediate?: boolean
}

/**
 * Generic data-fetching hook wrapping any async API call.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: UseApiOptions = {}
): UseApiState<T> {
  const { immediate = true } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      if (mounted.current) setData(result)
    } catch (err) {
      if (mounted.current) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Terjadi kesalahan'
        setError(message)
      }
    } finally {
      if (mounted.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    mounted.current = true
    if (immediate) refetch()
    return () => {
      mounted.current = false
    }
  }, [immediate, refetch])

  return { data, loading, error, refetch }
}

/**
 * Mutation hook for POST/PUT actions with loading + error state.
 */
export function useMutation<TInput, TResult>(
  mutator: (input: TInput) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (input: TInput): Promise<TResult | null> => {
      setLoading(true)
      setError(null)
      try {
        return await mutator(input)
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Terjadi kesalahan'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [mutator]
  )

  return { mutate, loading, error, clearError: () => setError(null) }
}
