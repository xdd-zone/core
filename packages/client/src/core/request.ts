import type { XDDResponse, RequestOptions } from './types'
import type { RequestInterceptorChain, ResponseInterceptorChain } from '../interceptors'

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
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(originHeader ? { Origin: originHeader } : {}),
        Cookie: cookieHeader,
        ...(processedOptions?.headers as Record<string, string>),
      },
      body: processedOptions?.body
        ? typeof processedOptions.body === 'string'
          ? processedOptions.body
          : JSON.stringify(processedOptions.body)
        : undefined,
      signal: controller.signal,
      ...processedOptions,
    })

    clearTimeout(timeoutId)

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
    let data: T
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = (await response.json()) as T
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
