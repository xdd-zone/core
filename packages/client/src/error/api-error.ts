/**
 * API 错误类与错误处理
 *
 * 提供 ApiError 类和 ApiResponse 错误解析功能
 */

import type { ApiResponse } from '../types/api'
import {
  HttpStatusCode,
  ErrorCodes,
  ErrorMessages,
  isSuccessCode,
  isAuthError,
  isClientError,
  isServerError,
} from './error-codes'

/**
 * API 错误类
 *
 * 继承自 Error，包含 HTTP 状态码、错误码和详细信息
 */
export class ApiError extends Error {
  /**
   * HTTP 状态码
   */
  public readonly status: number

  /**
   * 业务错误码
   */
  public readonly code: string | number

  /**
   * 错误详细信息
   */
  public readonly details?: unknown

  /**
   * 创建 API 错误
   *
   * @param status - HTTP 状态码
   * @param message - 错误消息
   * @param code - 业务错误码
   * @param details - 详细信息（可选）
   */
  constructor(status: number, message: string, code: string | number = status, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details

    // 保留完整堆栈跟踪（V8 引擎支持）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  /**
   * 检查是否为认证错误（401/403）
   */
  get isAuthError(): boolean {
    return isAuthError(this.status)
  }

  /**
   * 检查是否为客户端错误（4xx）
   */
  get isClientError(): boolean {
    return isClientError(this.status)
  }

  /**
   * 检查是否为服务端错误（5xx）
   */
  get isServerError(): boolean {
    return isServerError(this.status)
  }

  /**
   * 转换为普通对象
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      stack: this.stack,
    }
  }
}

/**
 * 未授权错误（401）
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = ErrorMessages[ErrorCodes.UNAUTHORIZED] || '未授权访问', details?: unknown) {
    super(HttpStatusCode.UNAUTHORIZED, message, ErrorCodes.UNAUTHORIZED, details)
    this.name = 'UnauthorizedError'
  }
}

/**
 * 无权访问错误（403）
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = ErrorMessages[ErrorCodes.FORBIDDEN] || '无权访问此资源', details?: unknown) {
    super(HttpStatusCode.FORBIDDEN, message, ErrorCodes.FORBIDDEN, details)
    this.name = 'ForbiddenError'
  }
}

/**
 * 资源不存在错误（404）
 */
export class NotFoundError extends ApiError {
  constructor(message: string = ErrorMessages.NOT_FOUND || '请求的资源不存在', details?: unknown) {
    super(HttpStatusCode.NOT_FOUND, message, ErrorCodes.NOT_FOUND, details)
    this.name = 'NotFoundError'
  }
}

/**
 * 请求参数错误（400）
 */
export class BadRequestError extends ApiError {
  constructor(message: string = '请求参数错误', details?: unknown) {
    super(HttpStatusCode.BAD_REQUEST, message, HttpStatusCode.BAD_REQUEST, details)
    this.name = 'BadRequestError'
  }
}

/**
 * 参数验证失败（422）
 */
export class ValidationError extends ApiError {
  constructor(message: string = ErrorMessages.VALIDATION || '参数验证失败', details?: unknown) {
    super(HttpStatusCode.UNPROCESSABLE_ENTITY, message, ErrorCodes.VALIDATION, details)
    this.name = 'ValidationError'
  }
}

/**
 * 服务器内部错误（500）
 */
export class InternalServerError extends ApiError {
  constructor(message: string = ErrorMessages.INTERNAL_ERROR || '服务器内部错误', details?: unknown) {
    super(HttpStatusCode.INTERNAL_SERVER_ERROR, message, ErrorCodes.INTERNAL_ERROR, details)
    this.name = 'InternalServerError'
  }
}

/**
 * 解析 ApiResponse 错误
 *
 * @param response - API 响应对象
 * @throws ApiError 当响应表示错误时
 * @returns 成功时返回 undefined
 */
export function parseApiError<T>(response: ApiResponse<T>): T | never {
  if (isSuccessCode(response.code)) {
    return response.data
  }

  const status = response.code || HttpStatusCode.INTERNAL_SERVER_ERROR
  const message = response.message || ErrorMessages[status.toString()] || '未知错误'
  const code = response.code || status

  throw new ApiError(status, message, code)
}

/**
 * 创建 ApiError（工厂函数）
 *
 * @param status - HTTP 状态码
 * @param message - 错误消息
 * @param code - 业务错误码
 * @param details - 详细信息
 * @returns ApiError 实例
 */
export function createApiError(status: number, message: string, code?: string | number, details?: unknown): ApiError {
  return new ApiError(status, message, code ?? status, details)
}

/**
 * 检查是否为认证错误并抛出
 *
 * @param error - ApiError 实例
 * @throws UnauthorizedError | ForbiddenError
 */
export function throwAuthError(error: ApiError): never {
  if (error.status === HttpStatusCode.UNAUTHORIZED) {
    throw new UnauthorizedError(error.message, error.details)
  }
  if (error.status === HttpStatusCode.FORBIDDEN) {
    throw new ForbiddenError(error.message, error.details)
  }
  throw error
}

/**
 * 错误类型谓词 - 检查是否为 ApiError
 *
 * @param error - 任意错误对象
 * @returns 是否为 ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * 尝试从任意错误中提取 ApiError
 *
 * @param error - 任意错误对象
 * @returns 如果是 ApiError 则返回，否则包装为 InternalServerError
 */
export function toApiError(error: unknown, fallbackMessage?: string): ApiError {
  if (isApiError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new ApiError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      error.message || fallbackMessage || ErrorMessages.INTERNAL_ERROR,
      ErrorCodes.INTERNAL_ERROR,
    )
  }

  return new ApiError(
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    String(error) || fallbackMessage || ErrorMessages.INTERNAL_ERROR,
    ErrorCodes.INTERNAL_ERROR,
  )
}
