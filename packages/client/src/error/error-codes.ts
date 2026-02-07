/**
 * 错误码常量定义
 *
 * 与 nexus 后端保持一致，提供统一的错误码规范
 */

/**
 * HTTP 状态码常量
 */
export const HttpStatusCode = {
  /** 成功 */
  OK: 200,
  /** 已创建 */
  CREATED: 201,
  /** 无内容 */
  NO_CONTENT: 204,
  /** 请求参数错误 */
  BAD_REQUEST: 400,
  /** 未授权 */
  UNAUTHORIZED: 401,
  /** 无权访问 */
  FORBIDDEN: 403,
  /** 资源不存在 */
  NOT_FOUND: 404,
  /** 请求方法不允许 */
  METHOD_NOT_ALLOWED: 405,
  /** 请求实体过大 */
  PAYLOAD_TOO_LARGE: 413,
  /** 请求超时 */
  REQUEST_TIMEOUT: 408,
  /** 冲突 */
  CONFLICT: 409,
  /** 参数验证失败 */
  UNPROCESSABLE_ENTITY: 422,
  /** 太多请求 */
  TOO_MANY_REQUESTS: 429,
  /** 服务器内部错误 */
  INTERNAL_SERVER_ERROR: 500,
  /** 服务不可用 */
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * HTTP 状态码类型
 */
export type HttpStatusCode = (typeof HttpStatusCode)[keyof typeof HttpStatusCode]

/**
 * 业务错误码枚举
 *
 * 与 nexus 后端 error.plugin.ts 保持一致
 */
export const ErrorCodes = {
  /** 成功 */
  SUCCESS: 0,

  /** 通用错误码 */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION: 'VALIDATION',
  PARSE_ERROR: 'PARSE_ERROR',
  NOT_FOUND: 'NOT_FOUND',

  /** 认证相关 */
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  /** 数据库相关（Prisma） */
  PRISMA_VALIDATION: 'PRISMA_VALIDATION',
  PRISMA_INIT_FAILED: 'PRISMA_INIT_FAILED',
  PRISMA_RUST_PANIC: 'PRISMA_RUST_PANIC',
  PRISMA_UNKNOWN: 'PRISMA_UNKNOWN',
} as const

/**
 * 业务错误码类型
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * 错误码到默认消息的映射
 *
 * 当后端未返回 message 时使用此默认值
 */
export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.SUCCESS]: '操作成功',

  [ErrorCodes.INTERNAL_ERROR]: '服务器内部错误，请稍后重试',
  [ErrorCodes.VALIDATION]: '请求参数验证失败',
  [ErrorCodes.PARSE_ERROR]: '请求体解析失败',
  [ErrorCodes.NOT_FOUND]: '请求的资源不存在',

  [ErrorCodes.UNAUTHORIZED]: '未授权访问，请先登录',
  [ErrorCodes.FORBIDDEN]: '无权访问此资源',

  [ErrorCodes.PRISMA_VALIDATION]: '数据库参数校验失败',
  [ErrorCodes.PRISMA_INIT_FAILED]: '数据库连接失败',
  [ErrorCodes.PRISMA_RUST_PANIC]: '数据库内部错误',
  [ErrorCodes.PRISMA_UNKNOWN]: '数据库请求失败',

  // HTTP 状态码作为错误码的情况
  [HttpStatusCode.BAD_REQUEST.toString()]: '请求参数错误',
  [HttpStatusCode.UNAUTHORIZED.toString()]: '未授权访问',
  [HttpStatusCode.FORBIDDEN.toString()]: '无权访问',
  [HttpStatusCode.NOT_FOUND.toString()]: '资源不存在',
  [HttpStatusCode.CONFLICT.toString()]: '资源冲突',
  [HttpStatusCode.UNPROCESSABLE_ENTITY.toString()]: '参数验证失败',
  [HttpStatusCode.INTERNAL_SERVER_ERROR.toString()]: '服务器内部错误',
  [HttpStatusCode.SERVICE_UNAVAILABLE.toString()]: '服务不可用',
}

/**
 * 检查是否为成功响应
 *
 * @param code - 错误码
 * @returns 是否成功
 */
export function isSuccessCode(code: number): boolean {
  return code === ErrorCodes.SUCCESS || code === HttpStatusCode.OK
}

/**
 * 检查是否为客户端错误（4xx）
 *
 * @param code - HTTP 状态码或错误码
 * @returns 是否为客户端错误
 */
export function isClientError(code: number): boolean {
  return code >= 400 && code < 500
}

/**
 * 检查是否为认证错误（401/403）
 *
 * @param code - HTTP 状态码或错误码
 * @returns 是否为认证错误
 */
export function isAuthError(code: number): boolean {
  // HTTP 状态码判断
  return code === HttpStatusCode.UNAUTHORIZED || code === HttpStatusCode.FORBIDDEN
}

/**
 * 检查是否为服务端错误（5xx）
 *
 * @param code - HTTP 状态码或错误码
 * @returns 是否为服务端错误
 */
export function isServerError(code: number): boolean {
  return code >= 500
}
