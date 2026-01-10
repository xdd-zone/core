import type { Elysia } from 'elysia'
import type { Logger } from '@/infrastructure/logger'
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@/infrastructure/database/prisma/generated/runtime/client'
import { createModuleLogger } from '@/infrastructure/logger'

const errorLogger: Logger = createModuleLogger('error')

/**
 * 统一错误响应结构（与 responsePlugin 对齐）
 *
 * 约定：
 * - 成功：code = 0
 * - 失败：code = HTTP status（如 400/404/500）
 * - data 固定为 null
 * - errorCode 用于业务/可枚举错误码（可选）
 * - details 用于给前端提供结构化上下文（可选，生产环境应谨慎）
 */
interface ApiErrorResponse {
  code: number
  message: string
  data: null
  errorCode?: string
  details?: unknown
}

/**
 * 校验错误详情（来自 Elysia + Zod）
 */
interface ValidationErrorDetail {
  field: string
  message: string
  code?: string
  expected?: string
  received?: string
}

/**
 * 错误日志级别
 */
type ErrorLogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 错误处理结果
 *
 * 包含 HTTP 状态码、响应体和日志信息，用于统一错误处理流程
 */
interface ErrorHandlingResult {
  status: number
  response: ApiErrorResponse
  logLevel: ErrorLogLevel
  logContext?: Record<string, unknown>
}

const isDev = process.env.NODE_ENV === 'development'

/**
 * 根据日志级别记录日志
 *
 * @param logger - Logger 实例
 * @param level - 日志级别
 * @param payload - 日志数据
 * @param msg - 日志消息
 */
function logWithLevel(logger: Logger, level: ErrorLogLevel, payload: unknown, msg: string) {
  if (level === 'debug') return logger.debug(payload, msg)
  if (level === 'info') return logger.info(payload, msg)
  if (level === 'warn') return logger.warn(payload, msg)
  return logger.error(payload, msg)
}

/**
 * 将未知值安全地转换为 Record 对象
 *
 * @param value - 任意值
 * @returns 如果值是非 null 对象则返回 Record，否则返回 null
 */
function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

/**
 * 从错误对象中提取错误名称
 *
 * @param error - 错误对象（可能是 Error 实例或普通对象）
 * @returns 错误名称，默认为 'UnknownError'
 */
function pickErrorName(error: unknown): string {
  if (error instanceof Error) return error.name
  const record = asRecord(error)
  const name = record?.name
  return typeof name === 'string' ? name : 'UnknownError'
}

/**
 * 从错误对象中提取错误消息
 *
 * @param error - 错误对象（可能是 Error 实例、字符串或其他类型）
 * @returns 错误消息字符串
 */
function pickErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return typeof error === 'string' ? error : String(error)
}

/**
 * 从错误对象中提取堆栈信息
 *
 * @param error - 错误对象
 * @returns 堆栈信息（仅 Error 实例有），否则返回 undefined
 */
function pickErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined
}

/**
 * 从 store 中提取请求上下文信息
 *
 * @param store - Elysia 的 store 对象
 * @returns 请求上下文对象（如果存在）
 */
function extractRequestContext(store: unknown): Record<string, unknown> {
  const record = asRecord(store)
  const ctx = record?.requestContext
  return (asRecord(ctx) ?? {}) as Record<string, unknown>
}

/**
 * 构建标准化的错误响应体
 *
 * @param status - HTTP 状态码
 * @param message - 错误消息
 * @param options - 可选的错误码和详细信息
 * @returns 符合 ApiErrorResponse 结构的响应体
 */
function buildErrorResponse(
  status: number,
  message: string,
  options?: { errorCode?: string; details?: unknown },
): ApiErrorResponse {
  return {
    code: status,
    message,
    data: null,
    ...(options?.errorCode ? { errorCode: options.errorCode } : {}),
    ...(options?.details !== undefined ? { details: options.details } : {}),
  }
}

/**
 * 将 Elysia 的校验错误（基于 Zod）转换为结构化错误列表
 *
 * 说明：
 * - Elysia 的 VALIDATION 错误通常包含 errors 数组
 * - 不同版本/中间件可能会把 errors 塞到 message（JSON）里，因此做兼容处理
 */
function formatValidationErrors(error: unknown): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = []
  const record = asRecord(error)

  const rawErrors = record?.errors
  if (Array.isArray(rawErrors)) {
    for (const raw of rawErrors) {
      const errRecord = asRecord(raw)
      const path = errRecord?.path
      const field = Array.isArray(path) ? path.join('.') : typeof path === 'string' ? path : 'unknown'

      const code = typeof errRecord?.code === 'string' ? (errRecord.code as string) : undefined

      let message = typeof errRecord?.message === 'string' ? (errRecord.message as string) : 'Validation failed'

      // 如果已经有中文消息（来自 Schema 定义），优先使用
      // 否则根据错误代码翻译
      if (!message || message === 'Validation failed') {
        switch (code) {
          case 'too_small':
            message = `字段长度不能小于 ${(errRecord?.minimum as number) ?? ''} 个字符`.trim()
            break
          case 'too_big':
            message = `字段长度不能超过 ${(errRecord?.maximum as number) ?? ''} 个字符`.trim()
            break
          case 'invalid_type':
            message = `字段类型错误，期望 ${String(errRecord?.expected ?? '')}`.trim()
            break
          case 'invalid_string':
            message = '字符串格式不正确'
            if (errRecord?.validation === 'email') {
              message = '请输入有效的邮箱地址'
            } else if (errRecord?.validation === 'url') {
              message = '请输入有效的 URL 地址'
            } else if (errRecord?.validation === 'uuid') {
              message = '请输入有效的 UUID'
            }
            break
          case 'required':
            message = '此字段为必填项'
            break
          default:
            message = '验证失败'
            break
        }
      }

      errors.push({
        field,
        message,
        code,
        expected:
          errRecord?.minimum !== undefined
            ? `最小长度: ${String(errRecord.minimum)}`
            : errRecord?.maximum !== undefined
              ? `最大长度: ${String(errRecord.maximum)}`
              : errRecord?.expected !== undefined
                ? String(errRecord.expected)
                : undefined,
        received: errRecord?.received !== undefined ? String(errRecord.received) : undefined,
      })
    }
    return errors
  }

  const message = record?.message
  if (typeof message === 'string') {
    try {
      const parsed = JSON.parse(message) as unknown
      const parsedRecord = asRecord(parsed)
      const parsedErrors = parsedRecord?.errors
      if (Array.isArray(parsedErrors)) {
        return formatValidationErrors({ errors: parsedErrors })
      }
    } catch {
      return errors
    }
  }

  return errors
}

/**
 * 规范化 Prisma 唯一约束冲突的 target 字段
 *
 * Prisma 的 P2002 错误中，meta.target 可能是字符串或字符串数组
 * 该函数统一转换为字符串数组格式
 *
 * @param target - Prisma 错误的 meta.target 字段
 * @returns 字段名数组
 */
function normalizePrismaUniqueTarget(target: unknown): string[] {
  if (typeof target === 'string') return [target]
  if (Array.isArray(target)) return target.map(String)
  return []
}

/**
 * 根据 Prisma 唯一约束冲突字段生成用户友好的错误消息
 *
 * @param targetFields - 冲突的字段名数组
 * @returns 中文错误消息
 */
function formatPrismaUniqueMessage(targetFields: string[]): string {
  if (targetFields.includes('email')) return '邮箱已存在'
  if (targetFields.includes('username')) return '用户名已存在'
  if (targetFields.includes('phone')) return '手机号已存在'
  return '数据已存在'
}

/**
 * 处理 Prisma 相关的错误
 *
 * 支持的 Prisma 错误类型：
 * - PrismaClientKnownRequestError: 已知的请求错误（如 P2002 唯一约束冲突、P2025 记录不存在等）
 * - PrismaClientValidationError: 参数校验失败
 * - PrismaClientInitializationError: 初始化失败（如连接失败）
 * - PrismaClientRustPanicError: Rust 层 panic
 * - PrismaClientUnknownRequestError: 未知请求错误
 *
 * @param error - 错误对象
 * @returns 错误处理结果，如果不是 Prisma 错误则返回 null
 */
function handlePrismaError(error: unknown): ErrorHandlingResult | null {
  if (error instanceof PrismaClientKnownRequestError) {
    const prismaCode = error.code
    const details = isDev
      ? {
          prisma: {
            code: prismaCode,
            clientVersion: error.clientVersion,
            meta: error.meta,
          },
        }
      : {
          prisma: {
            code: prismaCode,
          },
        }

    if (prismaCode === 'P2002') {
      const targetFields = normalizePrismaUniqueTarget((error.meta as any)?.target)
      return {
        status: 409,
        response: buildErrorResponse(409, formatPrismaUniqueMessage(targetFields), {
          errorCode: `PRISMA_${prismaCode}`,
          details,
        }),
        logLevel: 'warn',
        logContext: { prismaCode },
      }
    }

    if (prismaCode === 'P2025') {
      return {
        status: 404,
        response: buildErrorResponse(404, '记录不存在', {
          errorCode: `PRISMA_${prismaCode}`,
          details,
        }),
        logLevel: 'warn',
        logContext: { prismaCode },
      }
    }

    if (prismaCode === 'P2003') {
      return {
        status: 409,
        response: buildErrorResponse(409, '关联数据不存在或约束冲突', {
          errorCode: `PRISMA_${prismaCode}`,
          details,
        }),
        logLevel: 'warn',
        logContext: { prismaCode },
      }
    }

    return {
      status: 500,
      response: buildErrorResponse(500, '数据库操作失败', {
        errorCode: `PRISMA_${prismaCode}`,
        details,
      }),
      logLevel: 'error',
      logContext: { prismaCode },
    }
  }

  if (error instanceof PrismaClientValidationError) {
    const details = isDev ? { prisma: { name: error.name, message: error.message } } : undefined
    return {
      status: 400,
      response: buildErrorResponse(400, '数据库参数校验失败', {
        errorCode: 'PRISMA_VALIDATION',
        details,
      }),
      logLevel: 'error',
    }
  }

  if (error instanceof PrismaClientInitializationError) {
    const details = isDev ? { prisma: { name: error.name, message: error.message } } : undefined
    return {
      status: 503,
      response: buildErrorResponse(503, '数据库连接失败', {
        errorCode: 'PRISMA_INIT_FAILED',
        details,
      }),
      logLevel: 'error',
    }
  }

  if (error instanceof PrismaClientRustPanicError) {
    const details = isDev ? { prisma: { name: error.name, message: error.message } } : undefined
    return {
      status: 500,
      response: buildErrorResponse(500, '数据库内部错误', {
        errorCode: 'PRISMA_RUST_PANIC',
        details,
      }),
      logLevel: 'error',
    }
  }

  if (error instanceof PrismaClientUnknownRequestError) {
    const details = isDev ? { prisma: { name: error.name, message: error.message } } : undefined
    return {
      status: 500,
      response: buildErrorResponse(500, '数据库请求失败', {
        errorCode: 'PRISMA_UNKNOWN',
        details,
      }),
      logLevel: 'error',
    }
  }

  return null
}

/**
 * HTTP 错误类
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

/**
 * 常用 HTTP 错误快捷方法
 */
export class BadRequestError extends HttpError {
  constructor(message: string = '请求参数错误', code?: string) {
    super(400, message, code)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = '未授权访问') {
    super(401, message, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = '无权访问此资源') {
    super(403, message, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = '请求的资源不存在') {
    super(404, message, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = '资源冲突') {
    super(409, message, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = '服务器内部错误') {
    super(500, message, 'INTERNAL_ERROR')
    this.name = 'InternalServerError'
  }
}

/**
 * 全局错误处理插件
 *
 * 功能：
 * 1. 捕获并格式化所有错误
 * 2. 区分处理：校验错误 / Prisma 错误 / 系统错误
 * 3. 统一错误响应结构，便于前端稳定消费
 *
 * 分层策略：
 * - VALIDATION / PARSE：前端可修复的问题（4xx），返回结构化 details
 * - Prisma：常见数据库错误映射为稳定的 HTTP status + errorCode
 * - 其它：兜底为系统错误（5xx），生产环境避免泄露堆栈
 *
 * 使用方式：
 * ```ts
 * // 在路由中抛出自定义错误
 * throw new NotFoundError('用户不存在')
 *
 * // 或者使用标准 HTTP 错误
 * throw new Error('Something went wrong')
 * ```
 */
export function errorPlugin(app: Elysia) {
  return (
    app
      // 注册错误类型到 app 实例，方便导入使用
      .derive(() => ({
        HttpError,
        BadRequestError,
        UnauthorizedError,
        ForbiddenError,
        NotFoundError,
        ConflictError,
        InternalServerError,
      }))

      // 全局错误处理器
      .onError(({ code: errorCode, error, set, store }) => {
        const requestContext = extractRequestContext(store)
        const startTime = typeof requestContext.startTime === 'number' ? requestContext.startTime : undefined
        const duration = startTime ? Date.now() - startTime : undefined

        const errorName = pickErrorName(error)
        const errorMessage = pickErrorMessage(error)
        const errorStack = pickErrorStack(error)

        let result: ErrorHandlingResult

        // 1) 路由不存在：Elysia 内部抛出的 NOT_FOUND
        if (errorCode === 'NOT_FOUND') {
          result = {
            status: 404,
            response: buildErrorResponse(404, '请求的资源不存在', {
              errorCode: 'NOT_FOUND',
            }),
            logLevel: 'warn',
          }
        }
        // 2) 参数校验错误：Elysia VALIDATION
        else if (errorCode === 'VALIDATION') {
          const errors = formatValidationErrors(error)
          result = {
            status: 422,
            response: buildErrorResponse(422, '请求参数验证失败', {
              errorCode: 'VALIDATION',
              details: { errors },
            }),
            logLevel: 'warn',
          }
        }
        // 3) 请求体解析错误：比如 JSON 不合法等
        else if (errorCode === 'PARSE') {
          result = {
            status: 400,
            response: buildErrorResponse(400, '请求体解析失败', {
              errorCode: 'PARSE_ERROR',
              details: isDev ? { message: errorMessage } : undefined,
            }),
            logLevel: 'warn',
          }
        }
        // 4) 自定义 HttpError：业务可控的 HTTP 语义
        else if (error instanceof HttpError) {
          const status = error.statusCode
          result = {
            status,
            response: buildErrorResponse(status, error.message, {
              errorCode: error.code,
            }),
            logLevel: status >= 500 ? 'error' : 'warn',
          }
        }
        // 5) Prisma：数据库错误做映射（优先于系统兜底）
        else {
          const prismaResult = handlePrismaError(error)
          if (prismaResult) {
            result = prismaResult
          } else {
            const details = isDev ? { name: errorName, stack: errorStack } : undefined
            result = {
              status: 500,
              response: buildErrorResponse(500, '服务器内部错误', {
                errorCode: 'INTERNAL_ERROR',
                details,
              }),
              logLevel: 'error',
            }
          }
        }

        set.status = result.status

        const logPayload = {
          ...requestContext,
          duration,
          err: {
            name: errorName,
            message: errorMessage,
            stack: isDev ? errorStack : undefined,
            code: errorCode,
            ...(result.logContext ?? {}),
          },
        }

        logWithLevel(errorLogger, result.logLevel, logPayload, 'request error')
        return result.response
      })
  )
}
