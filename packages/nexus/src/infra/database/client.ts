import type { ResolvedConfig } from '@nexus/core/config'
import type { Logger } from '@nexus/infra/logger'
import { CONFIG } from '@nexus/core/config'
import { PrismaClient } from '@nexus/infra/database/prisma/generated/client'
import { createModuleLogger, logger as defaultLogger } from '@nexus/infra/logger'
/**
 * Prisma 客户端实例
 * - 使用 PostgreSQL 适配器
 * - 配置日志输出
 */
import { PrismaPg } from '@prisma/adapter-pg'

interface DatabaseConfig extends Pick<ResolvedConfig, 'database'> {}

type PrismaLogLevel = 'query' | 'error' | 'info' | 'warn'

interface PrismaLogDefinition {
  emit: 'event'
  level: PrismaLogLevel
}

interface PrismaQueryEvent {
  query: string
  params: string
  duration: number
  target: string
}

interface PrismaMessageEvent {
  message: string
  target: string
}

function createPrismaLogConfig(config: DatabaseConfig): PrismaLogDefinition[] {
  return [
    config.database.log.query
      ? {
          emit: 'event',
          level: 'query',
        }
      : null,
    config.database.log.error
      ? {
          emit: 'event',
          level: 'error',
        }
      : null,
    config.database.log.info
      ? {
          emit: 'event',
          level: 'info',
        }
      : null,
    config.database.log.warn
      ? {
          emit: 'event',
          level: 'warn',
        }
      : null,
  ].filter((item): item is PrismaLogDefinition => !!item)
}

function setupPrismaLogListeners(prisma: PrismaClient, config: DatabaseConfig, logger: Logger) {
  const typedPrisma = prisma as PrismaClient & {
    $on: (eventType: PrismaLogLevel, callback: (event: PrismaQueryEvent | PrismaMessageEvent) => void) => void
  }

  if (config.database.log.query) {
    typedPrisma.$on('query', (event) => {
      const queryEvent = event as PrismaQueryEvent
      logger.debug(
        {
          query: queryEvent.query,
          params: queryEvent.params,
          duration: queryEvent.duration,
          target: queryEvent.target,
        },
        'query',
      )
    })
  }

  if (config.database.log.warn) {
    typedPrisma.$on('warn', (event) => {
      const messageEvent = event as PrismaMessageEvent
      logger.warn({ message: messageEvent.message, target: messageEvent.target }, 'warn')
    })
  }

  if (config.database.log.info) {
    typedPrisma.$on('info', (event) => {
      const messageEvent = event as PrismaMessageEvent
      logger.info({ message: messageEvent.message, target: messageEvent.target }, 'info')
    })
  }

  if (config.database.log.error) {
    typedPrisma.$on('error', (event) => {
      const messageEvent = event as PrismaMessageEvent
      logger.error({ message: messageEvent.message, target: messageEvent.target }, 'error')
    })
  }
}

export function createPrismaClient(config: DatabaseConfig = CONFIG, baseLogger: Logger = defaultLogger) {
  const prismaLogger = createModuleLogger('prisma', undefined, baseLogger)
  const adapter = new PrismaPg({
    connectionString: config.database.url,
  })

  const prisma = new PrismaClient({
    adapter,
    log: createPrismaLogConfig(config),
  })

  setupPrismaLogListeners(prisma, config, prismaLogger)

  return prisma
}

export const prisma = createPrismaClient()

export type Prisma = typeof prisma
