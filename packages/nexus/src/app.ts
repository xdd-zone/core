import { setupAppPlugin } from '@nexus/core/http'
import { Elysia } from 'elysia'
import { routes } from './routes'

/**
 * 创建应用实例。
 */
export function createApp() {
  return setupAppPlugin(new Elysia()).use(routes)
}

export const app = createApp()
