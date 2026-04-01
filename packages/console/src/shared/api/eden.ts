import type { Treaty } from '@elysiajs/eden'
import type { App } from '@xdd-zone/nexus/eden'
import { treaty } from '@elysiajs/eden'

type EdenResponseSchema = Record<number, unknown>
type EdenSuccessStatus = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226

type EdenSuccessData<TSchema extends EdenResponseSchema> = TSchema[Extract<keyof TSchema, EdenSuccessStatus>]

type EdenErrorValue<TSchema extends EdenResponseSchema> = Extract<
  Treaty.TreatyResponse<TSchema>,
  { error: { value: unknown } }
>['error']['value']

const API_PREFIX = '/api'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function joinUrlPath(basePath: string, nextPath: string) {
  const normalizedBasePath = basePath === '/' ? '' : trimTrailingSlash(basePath)
  return `${normalizedBasePath}${nextPath}` || nextPath
}

function resolveBrowserOrigin() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }

  return 'http://localhost:2333'
}

function normalizeBrowserBaseUrl(value: string) {
  if (/^localhost(?::\d+)?$/i.test(value)) {
    return `http://${value}`
  }

  return value
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

/**
 * 生成浏览器可直接访问的 API 地址。
 */
export function resolveApiUrl(pathname: string) {
  const apiPath = pathname.startsWith(API_PREFIX)
    ? pathname
    : `${API_PREFIX}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
  const url = new URL(normalizeBrowserBaseUrl(resolveConfiguredApiBaseUrl()))
  url.pathname = joinUrlPath(url.pathname, apiPath)
  url.search = ''
  url.hash = ''
  return url.toString()
}

function resolvePayloadMessage(value: unknown) {
  if (!value || typeof value !== 'object' || !('message' in value)) {
    return null
  }

  const payloadMessage = value.message
  if (typeof payloadMessage !== 'string' || !payloadMessage.trim()) {
    return null
  }

  return payloadMessage
}

function resolveErrorMessage(status: number, value: unknown) {
  const payloadMessage = resolvePayloadMessage(value)
  if (payloadMessage) {
    return payloadMessage
  }

  return status >= 500 ? '服务暂时不可用' : '请求失败'
}

/**
 * Console 共享 Eden Treaty 客户端。
 */
const edenClient = treaty<App>(resolveConfiguredApiBaseUrl(), {
  fetch: {
    credentials: 'include',
  },
  parseDate: true,
  throwHttpError: false,
})

type EdenApi = Treaty.Create<App>['api']

/**
 * Console 业务接口根节点。
 */
export const api: EdenApi = edenClient.api

/**
 * 统一拆包 Eden 响应，并转成项目内错误模型。
 */
export function unwrapEdenResponse<TSchema extends EdenResponseSchema>(
  result: Treaty.TreatyResponse<TSchema>,
): EdenSuccessData<TSchema> {
  if (result.error) {
    throw new ConsoleApiError<EdenErrorValue<TSchema>>(
      resolveErrorMessage(result.status, result.error.value),
      result.status,
      result.error.value,
      result.response,
    )
  }

  return result.data
}
