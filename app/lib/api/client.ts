import { getApiBaseUrl } from '@/app/lib/config/env'

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
  /** Skip JSON parsing (e.g. for empty responses) */
  raw?: boolean
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${base}${normalizedPath}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

async function parseResponse<T>(response: Response, raw?: boolean): Promise<T> {
  if (raw || response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) return undefined as T

  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiClientError('Respons server tidak valid (bukan JSON)', response.status, text)
  }
}

/**
 * Base HTTP client for all TrashIN API routes.
 * Uses native fetch — no extra dependencies.
 */
export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, headers, raw, ...rest } = options

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await parseResponse<T & { error?: string }>(response, raw)

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && data.error) ||
      `Permintaan gagal (${response.status})`
    throw new ApiClientError(String(message), response.status, data)
  }

  return data as T
}

export const api = {
  get: <T>(path: string, params?: RequestOptions['params'], init?: RequestOptions) =>
    apiClient<T>(path, { method: 'GET', params, ...init }),

  post: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    apiClient<T>(path, { method: 'POST', body, ...init }),

  put: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    apiClient<T>(path, { method: 'PUT', body, ...init }),

  delete: <T>(path: string, init?: RequestOptions) =>
    apiClient<T>(path, { method: 'DELETE', ...init }),
}
