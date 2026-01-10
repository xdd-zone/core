/**
 * Prisma 客户端实例
 * - 使用 PostgreSQL 适配器
 * - 配置日志输出
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { DATABASE_CONFIG } from '@/core'
import { PrismaClient } from '@/infrastructure/database/prisma/generated/client'
import { createModuleLogger } from '@/infrastructure/logger'

const logger = createModuleLogger('prisma')

const adapter = new PrismaPg({
  connectionString: DATABASE_CONFIG.connectionString,
})

export const prisma = new PrismaClient({
  adapter,
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
})

export type Prisma = typeof prisma

// 设置 Prisma 日志监听器
prisma.$on('query', (e: any) => {
  logger.debug(
    {
      query: e.query,
      params: e.params,
      duration: e.duration,
      target: e.target,
    },
    'query',
  )
})

prisma.$on('warn', (e: any) => {
  logger.warn({ message: e.message, target: e.target }, 'warn')
})

prisma.$on('info', (e: any) => {
  logger.info({ message: e.message, target: e.target }, 'info')
})

prisma.$on('error', (e: any) => {
  logger.error({ message: e.message, target: e.target }, 'error')
})
