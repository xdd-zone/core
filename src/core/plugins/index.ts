export { errorPlugin } from './error.plugin'
export {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  HttpError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from './error.plugin'
export { createModule } from './module.plugin'
/**
 * 核心插件统一导出
 *
 * 导出内容：
 * - responsePlugin: 全局统一响应插件
 * - errorPlugin: 全局错误处理插件（含 Zod 验证错误优化）
 * - createModule: 类型安全的模块创建工厂
 * - HttpError 及相关错误类：自定义 HTTP 错误
 */
export { responsePlugin } from './response.plugin'
