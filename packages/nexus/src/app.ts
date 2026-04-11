import type { AppBootstrapContext } from './bootstrap'
import { setupAppPlugin } from '@nexus/core/http'
import { Elysia } from 'elysia'
import { DEFAULT_APP_CONTEXT } from './bootstrap'
import { createModules } from './modules'

/**
 * 创建应用实例。
 */
export function createApp(context: AppBootstrapContext = DEFAULT_APP_CONTEXT) {
  return setupAppPlugin(new Elysia(), context.config, context.logger).use(createModules(context))
}

export const app = createApp()
