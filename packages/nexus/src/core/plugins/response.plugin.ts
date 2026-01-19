import Elysia from 'elysia'

/**
 * 响应类型
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 全局统一响应插件
 *
 * 统一响应结构：
 * { code: number; message: string; data: T | null }
 *
 * 功能：
 * - 暴露 ok(data, message?) 用于生成统一成功响应
 * - 自动响应包装在 setupGlobalHooks 的 onAfterHandle 中处理
 * - Date 字段自动转换在 setupGlobalHooks 中处理
 *
 * 使用方式：
 * 1) 全局注册：在 setupGlobalHooks 中注册，所有模块自动继承
 * 2) 模块注册：通过 createModule 创建模块，自动注入
 * 3) 在路由处理函数中：
 *    - 方式1：return ok(data, "自定义消息")  // 显式包装，可自定义消息
 *    - 方式2：return data                    // 自动包装为 {code: 0, message: "success", data}
 */
export const responsePlugin = new Elysia({ name: 'response' }).decorate(
  'ok',
  /**
   * 生成统一成功响应
   * @param data 业务数据
   * @param message 成功消息，默认 "success"
   */
  <T>(data: T, message: string = 'success'): ApiResponse<T> => ({
    code: 0,
    message,
    data,
  }),
)
