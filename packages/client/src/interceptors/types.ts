/**
 * 拦截器类型定义
 *
 * 定义请求拦截器和响应拦截器的类型
 */

/**
 * 请求上下文
 */
export interface RequestContext {
  /** 请求方法 */
  method: string
  /** 请求路径 */
  path: string
  /** 请求选项 */
  options: RequestOptions
}

/**
 * 请求拦截器
 *
 * 在发送请求前执行，可以：
 * - 修改请求配置（ headers、params 等）
 * - 添加认证信息
 * - 日志记录
 * - 取消请求（抛出异常）
 */
export interface RequestInterceptor {
  /**
   * 拦截请求
   * @param context 请求上下文
   * @returns 修改后的请求上下文或 void
   */
  onRequest(context: RequestContext): Promise<RequestContext | void> | RequestContext | void
}

/**
 * 响应上下文
 */
export interface ResponseContext<T = unknown> {
  /** 请求上下文（原始请求信息） */
  request: RequestContext
  /** 响应数据 */
  data: T
  /** HTTP 状态码 */
  status: number
  /** 状态文本 */
  statusText: string
  /** 响应头 */
  headers: Headers
}

/**
 * 响应拦截器
 *
 * 在收到响应后执行，可以：
 * - 处理响应数据
 * - 错误处理
 * - 日志记录
 * - 重试逻辑
 */
export interface ResponseInterceptor<T = unknown> {
  /**
   * 拦截响应
   * @param context 响应上下文
   * @returns 处理后的响应数据或 void
   */
  onResponse(context: ResponseContext<T>): Promise<T | void> | T | void
}

/**
 * 请求拦截器回调类型
 */
export type RequestInterceptorFn = (
  method: string,
  path: string,
  options: RequestOptions,
) => Promise<RequestOptions | void> | RequestOptions | void

/**
 * 响应拦截器回调类型
 */
export type ResponseInterceptorFn<T = unknown> = (
  data: T,
  status: number,
  statusText: string,
  headers: Headers,
  method: string,
  path: string,
) => Promise<T | void> | T | void

/**
 * 请求选项
 */
export interface RequestOptions {
  /** 查询参数 */
  params?: Record<string, unknown>
  /** 请求体数据 */
  body?: BodyInit | null | undefined
  /** 其他 Fetch API 选项 */
  headers?: HeadersInit
  [key: string]: unknown
}
