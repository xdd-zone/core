import type { ApiResponse, BizCodeValue } from '@xdd-zone/contracts'
import { BizCode } from '@xdd-zone/contracts'
import { getBoboServerEnv } from '@/lib/env.server'

export type HttpQuery = Record<string, string | number | boolean | undefined>

export interface HttpGetOptions {
  query?: HttpQuery
  init?: RequestInit
}

export interface HttpPostOptions {
  init?: RequestInit
}

interface RequestOptions {
  query?: HttpQuery
  init?: RequestInit
  payload?: unknown
}

export function buildSearchParams(query?: HttpQuery): string {
  if (!query) return ''

  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      searchParams.set(key, String(value))
    }
  }

  const search = searchParams.toString()
  return search ? `?${search}` : ''
}

export function createRequestInit(method: 'GET' | 'POST', payload: unknown, init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers)

  if (method === 'POST' && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  return {
    ...init,
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(payload) : undefined,
  }
}

async function request<TData>(
  method: 'GET' | 'POST',
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<TData>> {
  try {
    const baseUrl = getBoboServerEnv().MOMO_BASE_URL
    const url = new URL(`${path}${buildSearchParams(options.query)}`, baseUrl)
    const response = await fetch(url, createRequestInit(method, options.payload, options.init))
    const body: unknown = await response.json()

    if (isApiResponse<TData>(body)) {
      return body
    }

    return buildFailure('Momo 接口返回的数据格式不正确。')
  } catch {
    return buildFailure('Momo 接口暂时不可用。')
  }
}

function isApiResponse<TData>(value: unknown): value is ApiResponse<TData> {
  if (!value || typeof value !== 'object') {
    return false
  }

  const response = value as Record<string, unknown>

  if (!isApiMeta(response.meta)) {
    return false
  }

  if (response.ok === true) {
    return 'data' in response
  }

  return response.ok === false && isApiError(response.error)
}

function isApiMeta(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false
  }

  const meta = value as Record<string, unknown>
  return typeof meta.requestId === 'string' && typeof meta.timestamp === 'string'
}

function isApiError(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false
  }

  const error = value as Record<string, unknown>
  return typeof error.code === 'string' && isBizCode(error.code) && typeof error.message === 'string'
}

function isBizCode(value: string): value is BizCodeValue {
  return Object.values(BizCode).includes(value as BizCodeValue)
}

function buildFailure<TData>(message: string): ApiResponse<TData> {
  return {
    ok: false,
    error: {
      code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
      message,
    },
    meta: {
      requestId: 'unavailable',
      timestamp: new Date().toISOString(),
    },
  }
}

export const http = {
  get<TData>(path: string, options?: HttpGetOptions): Promise<ApiResponse<TData>> {
    return request<TData>('GET', path, options)
  },
  post<TReq, TData>(path: string, payload: TReq, options?: HttpPostOptions): Promise<ApiResponse<TData>> {
    return request<TData>('POST', path, {
      init: options?.init,
      payload,
    })
  },
}
