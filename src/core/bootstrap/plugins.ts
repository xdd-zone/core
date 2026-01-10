/**
 * 全局钩子注册器
 * 统一管理所有全局生命周期钩子（logger、error 等）
 *
 * 设计原则：
 * 1. 直接在 app 实例上注册全局钩子，避免插件系统的兼容性问题
 * 2. 按执行顺序注册：onRequest -> onAfterHandle -> onError
 * 3. 集中管理，便于调试和维护
 */
import type { Elysia } from 'elysia'
import { randomUUID } from 'node:crypto'
import { auth } from '@/core/auth'
import { errorPlugin, responsePlugin } from '@/core/plugins'
import { createModuleLogger } from '@/infrastructure/logger'

const httpLogger = createModuleLogger('http')

/**
 * 递归转换对象中的 Date 字段为 ISO 字符串
 */
function transformDates(obj: any): any {
  if (obj === null || obj === undefined) return obj

  // 处理 Date 对象
  if (obj instanceof Date) {
    return obj.toISOString()
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(transformDates)
  }

  // 处理普通对象
  if (typeof obj === 'object') {
    const transformed: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        transformed[key] = transformDates(obj[key])
      }
    }
    return transformed
  }

  return obj
}

/**
 * 判断是否为标准 API 响应格式
 */
function isStandardResponse(response: any): response is Record<string, any> {
  return (
    response !== null &&
    typeof response === 'object' &&
    'code' in response &&
    'message' in response &&
    'data' in response
  )
}

/**
 * 注册所有全局钩子
 * @param app Elysia 实例
 * @returns 配置完成的 Elysia 实例
 */
export function setupGlobalHooks(app: Elysia) {
  app
    // ==================== 全局插件 ====================
    .use(responsePlugin) // 响应格式统一包装
    .use(errorPlugin) // 错误处理和 Zod 验证优化

    // ==================== 全局会话注入 ====================
    // 在所有路由中注入 session, user, isAuthenticated 字段
    .derive(async ({ request }) => {
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        return {
          session: session?.session ?? null,
          user: session?.user ?? null,
          isAuthenticated: !!session?.session,
        }
      } catch {
        // 会话获取失败,返回未认证状态
        return {
          session: null,
          user: null,
          isAuthenticated: false,
        }
      }
    })

    // ==================== State ====================
    .state('requestId', '')
    .state('clientIp', '')
    .state('userAgent', '')
    .state('startTime', 0)
    .state('requestContext', {} as any)
    .state('logger', httpLogger)

    // ==================== Request Handler ====================
    .onRequest((ctx) => {
      const url = new URL(ctx.request.url)
      const requestId = randomUUID()
      const startTime = Date.now()

      // 初始化请求上下文
      ctx.store.requestId = requestId
      ctx.store.userAgent = ctx.request.headers.get('user-agent') ?? ''
      const forwarded = ctx.request.headers.get('x-forwarded-for')
      ctx.store.clientIp = forwarded ? forwarded.split(',')[0].trim() : ''
      ctx.store.startTime = startTime
      ctx.store.logger = httpLogger.child({ requestId })

      // 构建结构化请求上下文
      ctx.store.requestContext = {
        requestId,
        method: ctx.request.method,
        path: url.pathname,
        query: url.search || undefined,
        ip: ctx.store.clientIp,
        userAgent: ctx.store.userAgent,
        startTime,
      }

      // 记录请求开始
      ctx.store.logger.info(
        {
          ...ctx.store.requestContext,
        },
        'request start',
      )
    })

    // ==================== Response Handler ====================
    .onAfterHandle((ctx) => {
      const endTime = Date.now()
      const status = typeof ctx.set.status === 'number' ? ctx.set.status : 200

      // 更新请求上下文
      ctx.store.requestContext = {
        ...ctx.store.requestContext,
        duration: endTime - ctx.store.startTime,
        status,
      }

      // 记录请求完成
      ctx.store.logger.info(
        {
          ...ctx.store.requestContext,
        },
        'request completed',
      )
    })

    // ==================== 响应格式统一包装 ====================
    // 在日志记录之后执行，自动包装非标准响应并转换 Date 字段
    .onAfterHandle(({ responseValue }) => {
      // 如果是 Response 对象（例如 BetterAuth handler 返回的），直接返回
      if (responseValue instanceof Response) {
        return responseValue
      }

      // 如果已经是标准响应格式，直接返回（但需要转换 Date）
      if (isStandardResponse(responseValue)) {
        return transformDates(responseValue)
      }

      // 自动包装非标准响应并转换 Date
      const wrapped = {
        code: 0,
        message: 'success',
        data: responseValue,
      }

      return transformDates(wrapped)
    })

  return app
}
