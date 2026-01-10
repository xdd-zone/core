/**
 * 路由启动器
 * 注册所有功能模块路由
 */
import Elysia from 'elysia'
import { APP_CONFIG } from '@/core/config'
import { authModule } from '@/modules/auth'
import { rbacModule } from '@/modules/rbac'
import { userModule } from '@/modules/user'

export function setupRoutes(app: Elysia) {
  // 创建 API 路由组
  const api = new Elysia({ prefix: `/${APP_CONFIG.prefix}` })

  // 注册认证模块路由 (路径: /api/auth/*)
  // 包含 BetterAuth handler 和自定义业务端点
  api.use(authModule)

  // 注册用户模块路由 (路径: /api/user/*)
  api.use(userModule)

  // 注册RBAC模块路由 (路径: /api/rbac/*)
  api.use(rbacModule)

  // 注册到主应用
  app.use(api)

  return app
}
