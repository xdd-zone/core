/**
 * 服务器启动器
 * 启动 HTTP 服务器并输出启动信息
 */
import type { Elysia } from 'elysia'
import { APP_CONFIG, OPENAPI_CONFIG } from '@/core/config'
import { logger } from '@/infrastructure/logger'

export async function startServer(app: Elysia) {
  // 启动服务器
  app.listen(APP_CONFIG.port)

  // 输出启动信息
  const host = app.server?.hostname
  const port = app.server?.port
  const base = `http://${host}:${port}`
  const docsPath = OPENAPI_CONFIG.path

  logger.info(`🦊 Elysia is running at ${host}:${port}`)
  logger.info(`📚 OpenAPI documentation is available at ${base}${docsPath}`)

  return app
}
