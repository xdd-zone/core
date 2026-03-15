import type { XDDResponse, RequestOptions } from './types'
import type { RequestInterceptorChain, ResponseInterceptorChain } from '../interceptors'
import { parseResponse } from '@xdd-zone/schema/adapters/client'
import { ApiError, UnauthorizedError, ForbiddenError, NotFoundError } from '../error/api-error'
import { getLogger } from '../logger'

/**
 * 统一请求函数类型
 * 各模块通过此类型接收绑定了上下文的请求函数
 */
export type RequestFn = <T>(method: string, path: string, options?: RequestOptions) => Promise<T>
export type RequestRawFn = <T>(method: string, path: string, options?: RequestOptions) => Promise<XDDResponse<T>>

type DefaultRequestOptions = {
  headers?: Record<string, string>
  timeout?: number
}

function serializeRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined
  }

  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof ReadableStream
  ) {
    return body
  }

  if (ArrayBuffer.isView(body)) {
    return body as unknown as BodyInit
  }

  if (typeof body === 'object') {
    return JSON.stringify(body)
  }

  return String(body)
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {}
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, String(value)]),
  )
}

function mergeRequestOptions(defaults: DefaultRequestOptions, options?: RequestOptions): RequestOptions | undefined {
  if (!options && !defaults.timeout && (!defaults.headers || Object.keys(defaults.headers).length === 0)) {
    return options
  }

  return {
    ...options,
    timeout: options?.timeout ?? defaults.timeout,
    headers: {
      ...defaults.headers,
      ...normalizeHeaders(options?.headers),
    },
  }
}

/**
 * 创建绑定上下文的请求函数
 *
 * @param baseURL - API 基础地址
 * @param cookieStore - Cookie 存储
 * @param requestInterceptors - 请求拦截器链
 * @param responseInterceptors - 响应拦截器链
 * @returns 绑定了上下文的请求函数
 */
export function createRequestFn(
  baseURL: string,
  cookieStore: Map<string, string>,
  requestInterceptors: RequestInterceptorChain,
  responseInterceptors: ResponseInterceptorChain,
  defaults: DefaultRequestOptions = {},
): RequestFn {
  return <T>(method: string, path: string, options?: RequestOptions) =>
    request<T>(
      baseURL,
      method,
      path,
      mergeRequestOptions(defaults, options),
      cookieStore,
      requestInterceptors,
      responseInterceptors,
    )
}

export function createRequestRawFn(
  baseURL: string,
  cookieStore: Map<string, string>,
  requestInterceptors: RequestInterceptorChain,
  responseInterceptors: ResponseInterceptorChain,
  defaults: DefaultRequestOptions = {},
): RequestRawFn {
  return <T>(method: string, path: string, options?: RequestOptions) =>
    requestRaw<T>(
      baseURL,
      method,
      path,
      mergeRequestOptions(defaults, options),
      cookieStore,
      requestInterceptors,
      responseInterceptors,
    )
}

/**
 * 基础请求函数（内部使用）
 * 支持 Cookie 自动管理和拦截器
 */
export async function request<T>(
  baseURL: string,
  method: string,
  path: string,
  options: RequestOptions | undefined,
  cookieStore: Map<string, string>,
  requestInterceptors?: RequestInterceptorChain,
  responseInterceptors?: ResponseInterceptorChain,
): Promise<T> {
  const response = await requestRaw<T>(
    baseURL,
    method,
    path,
    options,
    cookieStore,
    requestInterceptors,
    responseInterceptors,
  )

  return response.data
}

/**
 * 基础请求函数（内部使用）
 * 支持 Cookie 自动管理和拦截器，并保留原始响应元信息
 */
export async function requestRaw<T>(
  baseURL: string,
  method: string,
  path: string,
  options: RequestOptions | undefined,
  cookieStore: Map<string, string>,
  requestInterceptors?: RequestInterceptorChain,
  responseInterceptors?: ResponseInterceptorChain,
): Promise<XDDResponse<T>> {
  // 执行请求拦截器
  let processedOptions = options
  if (requestInterceptors && requestInterceptors.size > 0) {
    processedOptions = await requestInterceptors.execute(method, path, options ?? {})
  }

  // 构建完整 URL
  const base = baseURL.replace(/\/$/, '')
  const fullPath = path.startsWith('/') ? path.slice(1) : path
  const url = new URL(`${base}/${fullPath}`)

  // 处理查询参数
  if (processedOptions?.params) {
    Object.entries(processedOptions.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  // 构建请求头，携带 Cookie
  const cookieHeader = Array.from(cookieStore.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')

  // 从 baseURL 提取 Origin（解决 CORS 问题）
  let originHeader = ''
  try {
    originHeader = new URL(base).origin
  } catch {
    // 忽略 URL 解析错误
  }

  const controller = new AbortController()
  const timeout = typeof processedOptions?.timeout === 'number' ? processedOptions.timeout : 30000
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const { params: _params, responseSchema, body: requestBody, headers: requestHeaders, ...requestInit } = processedOptions ?? {}

    const mergedHeaders: Record<string, string> = {
      ...normalizeHeaders(requestHeaders as HeadersInit | undefined),
      ...(originHeader ? { Origin: originHeader } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    }

    if (!('Content-Type' in mergedHeaders) && !('content-type' in mergedHeaders)) {
      mergedHeaders['Content-Type'] = 'application/json'
    }

    const response = await fetch(url.toString(), {
      method,
      headers: mergedHeaders,
      body: serializeRequestBody(requestBody),
      signal: controller.signal,
      ...requestInit,
    })

    clearTimeout(timeoutId)

    const logger = getLogger()
    logger.debug(`${method} ${path}`, { status: response.status })

    // 解析响应头中的 Set-Cookie 并保存
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      const cookieParts = setCookieHeader.split(';')
      const cookieNameValue = cookieParts[0].trim()
      const equalsIndex = cookieNameValue.indexOf('=')
      if (equalsIndex > 0) {
        const name = cookieNameValue.substring(0, equalsIndex)
        const value = cookieNameValue.substring(equalsIndex + 1)
        cookieStore.set(name, value)
      }
    }

    // 解析响应数据
    const contentType = response.headers.get('content-type')

    // 处理 HTTP 错误状态码
    if (!response.ok) {
      let errorBody: Record<string, unknown> | null = null
      try {
        if (contentType?.includes('application/json')) {
          errorBody = (await response.json()) as Record<string, unknown>
        }
      } catch {
        // 忽略解析错误
      }

      const message = (errorBody?.message as string) || response.statusText
      const code = errorBody?.code as string | number | undefined

      logger.warn(`${method} ${path} -> ${response.status}`, { message })

      switch (response.status) {
        case 401:
          throw new UnauthorizedError(message, errorBody)
        case 403:
          throw new ForbiddenError(message, errorBody)
        case 404:
          throw new NotFoundError(message, errorBody)
        default:
          throw new ApiError(response.status, message, code ?? response.status, errorBody)
      }
    }

    let data: T
    if (response.status === 204) {
      data = undefined as T
    } else if (contentType?.includes('application/json')) {
      const rawData = await response.json()
      data = responseSchema ? ((await parseResponse(responseSchema, rawData)) as T) : (rawData as T)
    } else {
      data = (await response.text()) as T
    }

    // 执行响应拦截器
    let processedData: T = data
    if (responseInterceptors && responseInterceptors.size > 0) {
      processedData = await (responseInterceptors as ResponseInterceptorChain<T>).execute(
        data,
        response.status,
        response.statusText,
        response.headers,
        method,
        path,
      )
    }

    return {
      data: processedData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`请求超时: ${method} ${path}`)
    }
    throw error
  }
}
