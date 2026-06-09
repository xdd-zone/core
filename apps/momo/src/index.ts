import { fileURLToPath } from 'node:url'

import app from '#momo/app'
import { getMomoEnv } from '#momo/shared/env'
import { serve } from '@hono/node-server'

const isEntry = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntry) {
  const env = getMomoEnv()

  serve({
    fetch: app.fetch,
    port: env.PORT,
  })

  console.warn(`Momo Hono 服务已启动: http://localhost:${env.PORT}`)
}
