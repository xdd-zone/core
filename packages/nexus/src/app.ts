import { Elysia } from 'elysia'
import { setupAppPlugin } from '@/core/http'
import { routes } from './routes'

/**
 * 创建应用实例。
 */
export function createApp() {
  return setupAppPlugin(new Elysia()).use(routes)
}

export const app = createApp()
