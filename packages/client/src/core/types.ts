import type { RequestInterceptor, ResponseInterceptor } from '../interceptors/types'
import { RequestInterceptorChain, ResponseInterceptorChain } from '../interceptors'

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
export interface RequestOptions extends RequestInit {
  /** 查询参数 */
  params?: Record<string, unknown>
  /** 请求体数据 */
  body?: BodyInit | null | undefined
  /** 索引签名 */
  [key: string]: unknown
}

/**
 * 统一响应包装
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
 * API 统一响应格式
 */
export interface ApiResult<T> {
  /** 业务数据 */
  data: T
  /** 0 表示成功 */
  code: number
  /** 消息描述 */
  message: string
}

/**
 * HTTP 方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * 端点访问器接口
 */
export interface EndpointAccessor<T = unknown> {
  get(): Promise<XDDResponse<T>>
  post(body?: unknown): Promise<XDDResponse<T>>
  put(body?: unknown): Promise<XDDResponse<T>>
  patch(body?: unknown): Promise<XDDResponse<T>>
  delete(): Promise<XDDResponse<T>>
}

/**
 * 带参数的端点访问器
 */
export interface ParamEndpointAccessor<T = unknown> {
  get(query?: unknown): Promise<XDDResponse<T>>
  post(body?: unknown): Promise<XDDResponse<T>>
  put(body?: unknown): Promise<XDDResponse<T>>
  patch(body?: unknown): Promise<XDDResponse<T>>
  delete(): Promise<XDDResponse<T>>
}

/**
 * 路径段访问器（递归代理）
 */
export interface PathAccessor {
  [key: string]: PathAccessor | EndpointAccessor | ParamEndpointAccessor
}
