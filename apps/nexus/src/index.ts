import { fileURLToPath } from 'node:url'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()
  .get('/', (c) => c.json({ name: '@xdd-zone/nexus', status: 'ok' }))
  .get('/health', (c) => c.json({ status: 'ok' }))
  .get('/api/example', (c) => c.json({ message: 'Hono 示例接口' }))

export type AppType = typeof app

export { app }

export default app

const isEntry = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntry) {
  const port = Number(process.env.PORT ?? 7788)

  serve({
    fetch: app.fetch,
    port,
  })

  console.warn(`Nexus Hono 服务已启动: http://localhost:${port}`)
}
