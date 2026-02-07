/**
 * 请求拦截器
 *
 * 提供 onRequest 钩子机制，支持拦截器链
 */

import type { RequestContext, RequestInterceptor, RequestInterceptorFn, RequestOptions } from './types'

/**
 * 请求拦截器管理器
 *
 * 管理请求拦截器的注册和执行
 */
export class RequestInterceptorChain {
  /** 拦截器列表 */
  private interceptors: RequestInterceptor[] = []

  /** 拦截器函数列表 */
  private interceptorFns: RequestInterceptorFn[] = []

  /**
   * 注册请求拦截器
   * @param interceptor 请求拦截器
   */
  use(interceptor: RequestInterceptor | RequestInterceptorFn): this {
    if (typeof interceptor === 'function') {
      this.interceptorFns.push(interceptor)
    } else {
      this.interceptors.push(interceptor)
    }
    return this
  }

  /**
   * 执行所有请求拦截器
   * @param method 请求方法
   * @param path 请求路径
   * @param options 请求选项
   * @returns 修改后的请求选项
   */
  async execute(method: string, path: string, options: RequestOptions): Promise<RequestOptions> {
    const context: RequestContext = { method, path, options }

    // 执行对象拦截器
    for (const interceptor of this.interceptors) {
      const result = await interceptor.onRequest(context)
      if (result) {
        context.options = result.options
      }
    }

    // 执行函数拦截器
    let currentOptions = context.options
    for (const fn of this.interceptorFns) {
      const result = await fn(method, path, currentOptions)
      if (result) {
        currentOptions = result
      }
    }

    return currentOptions
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
 * 创建请求拦截器链
 */
export function createRequestInterceptorChain(): RequestInterceptorChain {
  return new RequestInterceptorChain()
}

/**
 * onRequest 钩子工厂函数
 *
 * @example
 * ```typescript
 * const client = createClient({
 *   baseURL: 'http://localhost:7788',
 * })
 *
 * // 注册请求拦截器
 * client.onRequest(async (method, path, options) => {
 *   // 添加认证头
 *   return {
 *     ...options,
 *     headers: {
 *       ...options.headers,
 *       Authorization: `Bearer ${token}`,
 *     },
 *   }
 * })
 * ```
 */
export function createOnRequestHook(chain: RequestInterceptorChain): RequestInterceptorFn {
  return (method: string, path: string, options: RequestOptions) => {
    return chain.execute(method, path, options)
  }
}
