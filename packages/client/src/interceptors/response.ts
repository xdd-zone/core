/**
 * 响应拦截器
 *
 * 提供 onResponse 钩子机制，支持拦截器链
 */

import type { ResponseContext, ResponseInterceptor, ResponseInterceptorFn } from './types'

/**
 * 响应拦截器管理器
 *
 * 管理响应拦截器的注册和执行
 */
export class ResponseInterceptorChain<T = unknown> {
  /** 拦截器列表 */
  private interceptors: ResponseInterceptor<T>[] = []

  /** 拦截器函数列表 */
  private interceptorFns: ResponseInterceptorFn<T>[] = []

  /**
   * 注册响应拦截器
   * @param interceptor 响应拦截器
   */
  use(interceptor: ResponseInterceptor<T> | ResponseInterceptorFn<T>): this {
    if (typeof interceptor === 'function') {
      this.interceptorFns.push(interceptor)
    } else {
      this.interceptors.push(interceptor)
    }
    return this
  }

  /**
   * 执行所有响应拦截器
   * @param data 响应数据
   * @param status HTTP 状态码
   * @param statusText 状态文本
   * @param headers 响应头
   * @param method 请求方法
   * @param path 请求路径
   * @returns 处理后的响应数据
   */
  async execute(
    data: T,
    status: number,
    statusText: string,
    headers: Headers,
    method: string,
    path: string,
  ): Promise<T> {
    const context: ResponseContext<T> = {
      request: { method, path, options: {} },
      data,
      status,
      statusText,
      headers,
    }

    // 执行对象拦截器
    for (const interceptor of this.interceptors) {
      const result = await interceptor.onResponse(context)
      if (result !== undefined) {
        context.data = result as T
      }
    }

    // 执行函数拦截器
    let currentData: T = context.data
    for (const fn of this.interceptorFns) {
      const result = await fn(currentData, status, statusText, headers, method, path)
      if (result !== undefined) {
        currentData = result as T
      }
    }

    return currentData
  }

  /**
   * 清除所有拦截器
   */
  clear(): void {
    this.interceptors = []
    this.interceptorFns = []
  }

  /**
   * 获取拦截器数量
   */
  get size(): number {
    return this.interceptors.length + this.interceptorFns.length
  }
}

/**
 * 创建响应拦截器链
 */
export function createResponseInterceptorChain<T = unknown>(): ResponseInterceptorChain<T> {
  return new ResponseInterceptorChain<T>()
}

/**
 * onResponse 钩子工厂函数
 *
 * @example
 * ```typescript
 * const client = createClient({
 *   baseURL: 'http://localhost:7788',
 * })
 *
 * // 注册响应拦截器
 * client.onResponse(async (data, status, headers) => {
 *   if (status === 401) {
 *     // 处理未授权
 *     await handleUnauthorized()
 *   }
 *   return data
 * })
 * ```
 */
export function createOnResponseHook<T>(chain: ResponseInterceptorChain<T>): ResponseInterceptorFn<T> {
  return (data: T, status: number, statusText: string, headers: Headers, method: string, path: string) => {
    return chain.execute(data, status, statusText, headers, method, path)
  }
}
