import { fileURLToPath } from 'node:url'

import { serve } from '@hono/node-server'

import app from './app'
import { getNexusEnv } from './shared/env'

const isEntry = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntry) {
  const env = getNexusEnv()

  serve({
    fetch: app.fetch,
    port: env.PORT,
  })

  console.warn(`Nexus Hono 服务已启动: http://localhost:${env.PORT}`)
}
