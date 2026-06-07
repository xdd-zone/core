import { fileURLToPath } from 'node:url'

import { serve } from '@hono/node-server'

import app from './app'

const isEntry = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntry) {
  const port = Number(process.env.PORT ?? 7788)

  serve({
    fetch: app.fetch,
    port,
  })

  console.warn(`Nexus Hono 服务已启动: http://localhost:${port}`)
}
