/**
 * 生命周期钩子
 * 处理应用启动和关闭事件
 */
import type { Elysia } from 'elysia'
import { prisma } from '@/infrastructure/database'
import { logger } from '@/infrastructure/logger'

/**
 * 设置生命周期钩子
 * - 优雅关闭：断开数据库连接
 */
export function setupLifecycle(app: Elysia) {
  // 监听进程退出信号
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`)

    try {
      // 断开数据库连接
      await prisma.$disconnect()
      logger.info('Database connection closed')

      process.exit(0)
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown')
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  return app
}
