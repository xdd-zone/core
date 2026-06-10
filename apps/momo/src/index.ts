import { fileURLToPath } from 'node:url'

import { createMomoApp, createRuntime } from '#momo/bootstrap'
import { serve } from '@hono/node-server'

const isEntry = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntry) {
  const runtime = createRuntime()
  const app = createMomoApp(runtime)

  serve({
    fetch: app.fetch,
    port: runtime.env.PORT,
  })

  console.warn(`Momo Hono 服务已启动: http://localhost:${runtime.env.PORT}`)
}
