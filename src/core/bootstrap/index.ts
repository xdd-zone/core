/**
 * Bootstrap 启动器聚合入口
 * 按顺序执行各个启动器，确保应用正确初始化
 */
import type { Elysia } from 'elysia'
import { setupLifecycle } from './lifecycle'
import { setupOpenAPI } from './openapi'
import { setupGlobalHooks } from './plugins'
import { setupRoutes } from './routes'
import { startServer } from './server'

/**
 * 启动应用
 * @param app Elysia 实例
 * @returns 配置完成的 Elysia 实例
 */
export async function bootstrap(app: Elysia) {
  // 1. 设置 OpenAPI 文档
  setupOpenAPI(app)

  // 2. 注册全局钩子（logger、error、response 等）
  setupGlobalHooks(app)

  // 3. 注册路由模块
  setupRoutes(app)

  // 4. 设置生命周期钩子
  setupLifecycle(app)

  // 5. 启动服务器
  await startServer(app)

  return app
}

export * from './lifecycle'
export * from './openapi'
export * from './plugins'
export * from './routes'
export * from './server'
