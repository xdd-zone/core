import type { ZodTypeAny } from 'zod'

/**
 * 客户端配置选项
 */
export interface ClientOptions {
  /** API 基础地址 */
  baseURL: string
  /** 默认请求头 */
  headers?: Record<string, string>
  /** 超时时间（毫秒） */
  timeout?: number
}

/**
 * 请求选项
 */
export type RequestOptions = Omit<RequestInit, 'body'> & {
  /** 查询参数 */
  params?: Record<string, unknown>
  /** 请求体数据 */
  body?: unknown
  /** 响应校验 Schema */
  responseSchema?: ZodTypeAny
  /** 索引签名 */
  [key: string]: unknown
}

/**
 * 原始 HTTP 响应包装
 */
export interface XDDResponse<T = unknown> {
  /** 响应数据 */
  data: T
  /** 响应状态码 */
  status: number
  /** 响应状态文本 */
  statusText: string
  /** 响应头 */
  headers: Headers
}

/**
 * HTTP 方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * 端点访问器接口
 */
export interface EndpointAccessor<T = unknown> {
  get(): Promise<T>
  post(body?: unknown): Promise<T>
  put(body?: unknown): Promise<T>
  patch(body?: unknown): Promise<T>
  delete(): Promise<T>
}

/**
 * 带参数的端点访问器
 */
export interface ParamEndpointAccessor<T = unknown> {
  get(query?: unknown): Promise<T>
  post(body?: unknown): Promise<T>
  put(body?: unknown): Promise<T>
  patch(body?: unknown): Promise<T>
  delete(): Promise<T>
}

/**
 * 路径段访问器（递归代理）
 */
export interface PathAccessor {
  [key: string]: PathAccessor | EndpointAccessor | ParamEndpointAccessor
}
