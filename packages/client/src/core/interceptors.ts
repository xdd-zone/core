import type { RequestContext, RequestInterceptor, RequestInterceptorFn, RequestOptions } from '../interceptors/types'
import type { ResponseContext, ResponseInterceptor, ResponseInterceptorFn } from '../interceptors/types'

/**
 * 请求拦截器管理器
 */
export class RequestInterceptorChain {
  private interceptors: RequestInterceptor[] = []
  private interceptorFns: RequestInterceptorFn[] = []

  use(interceptor: RequestInterceptor | RequestInterceptorFn): this {
    if (typeof interceptor === 'function') {
      this.interceptorFns.push(interceptor)
    } else {
      this.interceptors.push(interceptor)
    }
    return this
  }

  async execute(method: string, path: string, options: RequestOptions): Promise<RequestOptions> {
    const context: RequestContext = { method, path, options }

    for (const interceptor of this.interceptors) {
      const result = await interceptor.onRequest(context)
      if (result) {
        context.options = result.options
      }
    }

    let currentOptions = context.options
    for (const fn of this.interceptorFns) {
      const result = await fn(method, path, currentOptions)
      if (result) {
        currentOptions = result
      }
    }

    return currentOptions
  }

  clear(): void {
    this.interceptors = []
    this.interceptorFns = []
  }

  get size(): number {
    return this.interceptors.length + this.interceptorFns.length
  }
}

/**
 * 响应拦截器管理器
 */
export class ResponseInterceptorChain<T = unknown> {
  private interceptors: ResponseInterceptor<T>[] = []
  private interceptorFns: ResponseInterceptorFn<T>[] = []

  use(interceptor: ResponseInterceptor<T> | ResponseInterceptorFn<T>): this {
    if (typeof interceptor === 'function') {
      this.interceptorFns.push(interceptor)
    } else {
      this.interceptors.push(interceptor)
    }
    return this
  }

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

    for (const interceptor of this.interceptors) {
      const result = await interceptor.onResponse(context)
      if (result !== undefined) {
        context.data = result as T
      }
    }

    let currentData: T = context.data
    for (const fn of this.interceptorFns) {
      const result = await fn(currentData, status, statusText, headers, method, path)
      if (result !== undefined) {
        currentData = result as T
      }
    }

    return currentData
  }

  clear(): void {
    this.interceptors = []
    this.interceptorFns = []
  }

  get size(): number {
    return this.interceptors.length + this.interceptorFns.length
  }
}
