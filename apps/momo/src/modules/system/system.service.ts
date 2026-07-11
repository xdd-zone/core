import type {
  HealthResponse,
  PingResponse,
  RootResponse,
  SystemLogListQuery,
  SystemLogListResponse,
  SystemReadinessCheck,
  SystemReadinessComponent,
  SystemReadinessResponse,
} from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import type { DbClient } from '#momo/infra/db/client'
import type { MomoEnv } from '#momo/shared/env'
import { BizCode } from '@xdd-zone/contracts'
import { sql } from 'drizzle-orm'
import { getDb } from '#momo/infra/db/client'
import {
  LogReaderDisabledError,
  LogReaderInvalidCursorError,
  LogReaderTimeoutError,
  LogReaderUnavailableError,
} from '#momo/infra/logs'
import { AppError } from '#momo/shared/app-error'

export function getRootInfo(): RootResponse {
  return {
    name: '@xdd-zone/momo',
    status: 'ok',
  }
}

export function getHealthStatus(env: MomoEnv): HealthResponse {
  return {
    env: env.APP_ENV,
    service: 'momo',
    status: 'ok',
  }
}

export function pingSystem(env: MomoEnv, name: string): PingResponse {
  return {
    env: env.APP_ENV,
    service: 'momo',
    message: `pong, ${name}`,
  }
}

export async function getReadinessStatus(
  runtime: MomoRuntime,
  db: DbClient = getDb(),
): Promise<SystemReadinessResponse> {
  const checks = await Promise.all([
    runReadinessCheck('database', 'postgres', '数据库连接失败', async () => {
      await db.execute(sql`select 1`)
      return 'ready'
    }),
    runReadinessCheck('cache', runtime.env.CACHE_PROVIDER, '缓存服务不可用', async () => {
      const key = `readiness:${crypto.randomUUID()}`

      try {
        await runtime.cache.set(key, 'ok', { ttlSeconds: 5 })
        const value = await runtime.cache.get<string>(key)

        if (value !== 'ok') {
          throw new Error('cache readiness value mismatch')
        }
      } finally {
        await runtime.cache.delete(key).catch(() => undefined)
      }

      return 'ready'
    }),
    runReadinessCheck('search', runtime.env.SEARCH_PROVIDER, '搜索服务不可用', async () => {
      const result = await runtime.search.health()
      return result.status === 'disabled' ? 'disabled' : 'ready'
    }),
    runReadinessCheck('storage', runtime.env.STORAGE_PROVIDER, '文件存储不可用', async () => {
      await runtime.storage.health()
      return 'ready'
    }),
    runReadinessCheck('logging', runtime.logs.provider, '日志服务不可用', async () => {
      const result = await runtime.logs.health()
      return result.status
    }),
  ])

  return {
    checkedAt: new Date().toISOString(),
    checks,
    status: checks.some((check) => check.status === 'error') ? 'degraded' : 'ready',
  }
}

export async function getSystemLogs(runtime: MomoRuntime, query: SystemLogListQuery): Promise<SystemLogListResponse> {
  const resolved = resolveLogQuery(query)

  try {
    const result = await runtime.logs.query(resolved)

    return {
      from: result.from,
      logs: result.logs,
      nextCursor: result.nextCursor,
      queriedAt: new Date().toISOString(),
      to: result.to,
    }
  } catch (error) {
    if (error instanceof LogReaderInvalidCursorError) {
      throw new AppError(BizCode.COMMON_INVALID_REQUEST, '日志 cursor 无效', 400)
    }

    if (error instanceof LogReaderDisabledError) {
      throw new AppError(BizCode.SYSTEM_LOGS_DISABLED, '日志查询未启用', 503)
    }

    if (error instanceof LogReaderTimeoutError) {
      throw new AppError(BizCode.SYSTEM_UPSTREAM_TIMEOUT, '日志服务查询超时', 504)
    }

    if (error instanceof LogReaderUnavailableError) {
      throw new AppError(BizCode.SYSTEM_LOGS_UNAVAILABLE, '日志服务暂时不可用', 503)
    }

    throw error
  }
}

function resolveLogQuery(query: SystemLogListQuery) {
  if ((query.from && !query.to) || (!query.from && query.to)) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'from 和 to 必须同时提供', 400)
  }

  if (query.statusFrom && query.statusTo && query.statusFrom > query.statusTo) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'statusFrom 不能大于 statusTo', 400)
  }

  if (query.from && query.to) {
    const fromTime = new Date(query.from).getTime()
    const toTime = new Date(query.to).getTime()

    if (fromTime > toTime) {
      throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'from 不能晚于 to', 400)
    }

    if (toTime - fromTime > 24 * 60 * 60 * 1000) {
      throw new AppError(BizCode.COMMON_INVALID_REQUEST, '日志查询最长支持 24 小时', 400)
    }

    return {
      ...query,
      from: query.from,
      to: query.to,
    }
  }

  const to = new Date()
  const from = new Date(to.getTime() - query.rangeMinutes * 60 * 1000)

  return {
    ...query,
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

async function runReadinessCheck(
  name: SystemReadinessComponent,
  provider: string,
  errorMessage: string,
  check: () => Promise<'disabled' | 'ready'>,
): Promise<SystemReadinessCheck> {
  const startedAt = performance.now()

  try {
    const status = await check()
    return {
      durationMs: resolveDuration(startedAt),
      name,
      provider,
      status,
    }
  } catch {
    return {
      durationMs: resolveDuration(startedAt),
      message: errorMessage,
      name,
      provider,
      status: 'error',
    }
  }
}

function resolveDuration(startedAt: number): number {
  return Math.round((performance.now() - startedAt) * 100) / 100
}
