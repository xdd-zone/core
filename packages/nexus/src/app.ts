import { Elysia } from 'elysia'
import { setupAppPlugin } from './plugins'
import { routes } from './routes'

/**
 * 创建应用实例。
 */
export function createApp() {
  const app = new Elysia()

  setupAppPlugin(app)
  app.use(routes)

  return app
}

export const app = createApp()
