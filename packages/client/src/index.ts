/**
 * XDD Zone Client SDK 入口文件
 *
 * 这是一个基础框架，后续会实现完整的 HTTP 客户端功能
 */

export function createClient(options: { baseURL: string }) {
  return {
    baseURL: options.baseURL,
    // TODO: 后续实现 HTTP 客户端方法
  }
}
