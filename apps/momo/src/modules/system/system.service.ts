import type {
  HealthResponse,
  PingResponse,
  RootResponse,
  SystemReadinessCheck,
  SystemReadinessComponent,
  SystemReadinessResponse,
} from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import type { DbClient } from '#momo/infra/db/client'
import type { MomoEnv } from '#momo/shared/env'
import { sql } from 'drizzle-orm'
import { getDb } from '#momo/infra/db/client'

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
  ])

  return {
    checkedAt: new Date().toISOString(),
    checks,
    status: checks.some((check) => check.status === 'error') ? 'degraded' : 'ready',
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
