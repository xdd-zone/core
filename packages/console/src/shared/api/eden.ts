import type { EdenApp } from '@xdd-zone/nexus/eden'
import { treaty } from '@elysiajs/eden'

interface ConsoleApiErrorPayload {
  code?: number
  data?: null
  details?: unknown
  errorCode?: string
  message?: string
}

interface EdenErrorResult<TError> {
  status: number
  value: TError
}

interface EdenResponseResult<TData, TError> {
  data: TData | null
  error: EdenErrorResult<TError> | null
  headers?: HeadersInit
  response: Response
  status: number
}

const API_PREFIX = '/api'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function resolveBrowserOrigin() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }

  return 'http://localhost:2333'
}

function stripApiPrefix(pathname: string) {
  if (!pathname || pathname === '/') {
    return ''
  }

  const normalizedPathname = trimTrailingSlash(pathname)
  return normalizedPathname === API_PREFIX ? '' : normalizedPathname
}

/**
 * 规范化 Eden Treaty 使用的服务端根地址。
 *
 * 约定：
 * - 推荐直接传源站，例如 http://localhost:7788
 * - 兼容旧的 /api 或 http://host/api 写法，避免生成 /api/api
 */
export function normalizeEdenBaseUrl(rawValue?: string) {
  const value = rawValue?.trim()

  if (!value) {
    return resolveBrowserOrigin()
  }

  if (value.startsWith('/')) {
    return resolveBrowserOrigin()
  }

  try {
    const url = new URL(value)
    const pathname = stripApiPrefix(url.pathname)
    return `${url.origin}${pathname}`
  } catch {
    if (/^localhost(?::\d+)?$/i.test(value)) {
      return value
    }

    return trimTrailingSlash(value)
  }
}

/**
 * Console 统一 API 错误。
 */
export class ConsoleApiError<TValue = unknown> extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly value: TValue,
    public readonly response?: Response,
  ) {
    super(message)
    this.name = 'ConsoleApiError'
  }
}

function resolveConfiguredApiBaseUrl() {
  return normalizeEdenBaseUrl(
    import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_ROOT || import.meta.env.VITE_API_BASE_URL,
  )
}

function resolveErrorMessage(status: number, value: unknown) {
  if (value && typeof value === 'object' && 'message' in value) {
    const payloadMessage = (value as ConsoleApiErrorPayload).message
    if (typeof payloadMessage === 'string' && payloadMessage.trim()) {
      return payloadMessage
    }
  }

  return status >= 500 ? '服务暂时不可用' : '请求失败'
}

/**
 * Console 共享 Eden Treaty 客户端。
 */
const edenClient = treaty<EdenApp>(resolveConfiguredApiBaseUrl(), {
  fetch: {
    credentials: 'include',
  },
  parseDate: true,
  throwHttpError: false,
})

/**
 * Console 业务接口根节点。
 */
export const api: Record<string, unknown> & {
  auth?: unknown
} = edenClient.api

/**
 * 统一拆包 Eden 响应，并转成项目内错误模型。
 */
export function unwrapEdenResponse<TData, TError = ConsoleApiErrorPayload>(
  result: EdenResponseResult<TData, TError>,
): TData {
  if (result.error) {
    throw new ConsoleApiError(
      resolveErrorMessage(result.error.status, result.error.value),
      result.error.status,
      result.error.value,
      result.response,
    )
  }

  return result.data as TData
}
