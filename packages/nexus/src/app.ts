import { setupAppPlugin } from '@nexus/core/http'
import { Elysia } from 'elysia'
import { modules } from './modules'

/**
 * 创建应用实例。
 */
export function createApp() {
  return setupAppPlugin(new Elysia()).use(modules)
}

export const app = createApp()
