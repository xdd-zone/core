import Elysia from 'elysia'
import { responsePlugin } from './response.plugin'

/**
 * 模块创建器插件
 *
 * 提供类型安全的模块创建工厂函数，
 * 自动为模块注入 responsePlugin，确保所有模块都具有统一的响应格式
 *
 * @example
 * ```ts
 * export const userModule = createModule({
 *   prefix: '/user',
 *   tags: ['User']
 * })
 * .get('/', ({ ok }) => ok(data))
 * ```
 */
export function createModule(options?: ConstructorParameters<typeof Elysia>[0]) {
  return new Elysia(options).use(responsePlugin)
}
