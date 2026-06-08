import { fileURLToPath } from 'node:url'

import app from '#nexus/app'
import { getNexusEnv } from '#nexus/shared/env'
import { serve } from '@hono/node-server'

const isEntry = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntry) {
  const env = getNexusEnv()

  serve({
    fetch: app.fetch,
    port: env.PORT,
  })

  console.warn(`Nexus Hono 服务已启动: http://localhost:${env.PORT}`)
}
