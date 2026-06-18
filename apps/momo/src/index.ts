import { fileURLToPath } from 'node:url'

import { serve } from '@hono/node-server'
import { createMomoApp, createRuntime } from '#momo/bootstrap'
import { closeDb } from '#momo/infra/db/client'
import { getNumberProperty, getStringProperty } from '#momo/shared/object-utils'

const isEntry = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntry) {
  const runtime = createRuntime()
  const app = createMomoApp(runtime)

  const server = serve(
    {
      fetch: app.fetch,
      port: runtime.env.PORT,
    },
    () => {
      runtime.logger.info(
        {
          event: 'server.started',
          port: runtime.env.PORT,
          url: `http://localhost:${runtime.env.PORT}`,
        },
        'Momo Hono 服务已启动',
      )
    },
  )

  server.on('error', (error) => {
    const code = error instanceof Error ? getStringProperty(error, 'code') : undefined
    const isPortInUse = code === 'EADDRINUSE'

    runtime.logger.error(
      {
        address: getStringProperty(error, 'address'),
        code,
        event: 'server.start_failed',
        message: error instanceof Error ? error.message : String(error),
        port: getNumberProperty(error, 'port') ?? runtime.env.PORT,
      },
      isPortInUse ? `Momo Hono 服务启动失败: ${runtime.env.PORT} 端口已被占用` : 'Momo Hono 服务启动失败',
    )

    runtime.logger.flush()
    setTimeout(() => {
      process.exit(1)
    }, 50)
  })

  const shutdown = () => {
    runtime.logger.info({ event: 'server.shutting_down' }, 'Momo Hono 服务正在关闭...')
    server.close(async (err) => {
      if (err) {
        runtime.logger.error(
          {
            event: 'server.shutdown_failed',
            message: err instanceof Error ? err.message : String(err),
          },
          'Momo Hono 服务关闭异常',
        )
      } else {
        runtime.logger.info({ event: 'server.http_closed' }, 'HTTP 服务已关闭')
      }

      try {
        await runtime.cache.close()
        runtime.logger.info({ event: 'server.cache_closed' }, '缓存连接已清理')
      } catch (cacheErr) {
        runtime.logger.error({ event: 'server.cache_close_failed', message: String(cacheErr) }, '清理缓存连接异常')
      }

      try {
        await closeDb()
        runtime.logger.info({ event: 'server.db_closed' }, '数据库连接已清理')
      } catch (dbErr) {
        runtime.logger.error({ event: 'server.db_close_failed', message: String(dbErr) }, '清理数据库连接异常')
      }

      runtime.logger.info({ event: 'server.shutdown_complete' }, 'Momo Hono 服务已完全关闭')
      process.exit(err ? 1 : 0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
