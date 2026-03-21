import { APP_CONFIG, OPENAPI_CONFIG } from '@/core/config'
import { prisma } from '@/infra/database'
import { logger } from '@/infra/logger'

interface StartableApp {
  listen(port: number): unknown
  server?:
    | {
        hostname?: string
        port?: number
      }
    | null
}

let lifecycleRegistered = false

function registerLifecycle() {
  if (lifecycleRegistered) {
    return
  }

  lifecycleRegistered = true

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`)

    try {
      await prisma.$disconnect()
      logger.info('Database connection closed')
      process.exit(0)
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown')
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'))
}

/**
 * 启动 HTTP 服务。
 */
export function startServer<const TApp extends StartableApp>(application: TApp) {
  registerLifecycle()

  application.listen(APP_CONFIG.port)

  const host = application.server?.hostname
  const port = application.server?.port
  const baseUrl = `http://${host}:${port}`

  logger.info(`Elysia is running at ${host}:${port}`)
  logger.info(`OpenAPI documentation is available at ${baseUrl}${OPENAPI_CONFIG.path}`)

  return application
}
