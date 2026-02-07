/**
 * User 模块访问器
 *
 * 用户相关 API 操作的访问器实现
 */

import type { XDDResponse, ApiResult } from '../../core/types'
import type {
  UserListResponse,
  UserListQuery,
  CreateUserBody,
  UpdateUserBody,
  CreateUserResponse,
  GetUserResponse,
  DeleteUserResponse,
} from './types'

/**
 * 基础请求方法
 */
async function request<T>(
  baseURL: string,
  method: string,
  path: string,
  options: { params?: Record<string, unknown>; body?: string } | undefined,
  cookieStore: Map<string, string>,
): Promise<XDDResponse<T>> {
  // 构建完整 URL
  const base = baseURL.replace(/\/$/, '')
  const fullPath = path.startsWith('/') ? path.slice(1) : path
  const url = new URL(`${base}/${fullPath}`)

  // 处理查询参数
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  // 获取 Cookie
  const cookieHeader = Array.from(cookieStore.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: options?.body,
    })

    // 解析响应头中的 Set-Cookie 并保存
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      setCookieHeader.split(',').forEach((cookie) => {
        cookie.split(';').forEach((part) => {
          const [name, value] = part.trim().split('=')
          if (name && value) {
            cookieStore.set(name, value)
          }
        })
      })
    }

    // 解析响应
    const data = (await response.json()) as T

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }
  } catch {
    throw new Error('Request failed')
  }
}

/**
 * User ID 访问器接口
 * 用于访问特定用户的操作
 */
export interface UserIdAccessor {
  /** 获取用户详情 */
  get(): Promise<XDDResponse<ApiResult<GetUserResponse>>>
  /** 更新用户信息 */
  patch(body: UpdateUserBody): Promise<XDDResponse<ApiResult<GetUserResponse>>>
  /** 删除用户 */
  delete(): Promise<XDDResponse<ApiResult<DeleteUserResponse>>>
}

/**
 * User 模块访问器接口
 * 提供用户相关的所有 API 操作
 */
export interface UserAccessors {
  /** 用户列表操作 */
  list: {
    /** 获取用户列表 */
    get(query?: UserListQuery): Promise<XDDResponse<ApiResult<UserListResponse>>>
    /** 创建用户（POST 方式） */
    post(body?: unknown): Promise<XDDResponse<ApiResult<unknown>>>
  }
  /** 创建用户 */
  create(body: CreateUserBody): Promise<XDDResponse<ApiResult<CreateUserResponse>>>
  /** 根据 ID 访问用户操作 */
  (id: string): UserIdAccessor
  /** 获取单个用户 */
  get(id: string): Promise<XDDResponse<ApiResult<GetUserResponse>>>
  /** 更新用户 */
  update(id: string, body: UpdateUserBody): Promise<XDDResponse<ApiResult<GetUserResponse>>>
  /** 删除用户 */
  delete(id: string): Promise<XDDResponse<ApiResult<DeleteUserResponse>>>
}

/**
 * 创建 User 模块访问器
 *
 * @param baseURL - API 基础地址
 * @param cookieStore - Cookie 存储
 * @returns User 访问器对象
 */
export function createUserAccessor(baseURL: string, cookieStore: Map<string, string>): UserAccessors {
  const listGet = (query?: UserListQuery) =>
    request<ApiResult<UserListResponse>>(
      baseURL,
      'GET',
      '/user',
      { params: query as Record<string, unknown> },
      cookieStore,
    )

  const listPost = (body?: unknown) =>
    request<ApiResult<unknown>>(baseURL, 'POST', '/user', { body: JSON.stringify(body) }, cookieStore)

  const create = (body: CreateUserBody) =>
    request<ApiResult<CreateUserResponse>>(baseURL, 'POST', '/user', { body: JSON.stringify(body) }, cookieStore)

  const get = (id: string) => request<ApiResult<GetUserResponse>>(baseURL, 'GET', `/user/${id}`, undefined, cookieStore)

  const update = (id: string, body: UpdateUserBody) =>
    request<ApiResult<GetUserResponse>>(baseURL, 'PATCH', `/user/${id}`, { body: JSON.stringify(body) }, cookieStore)

  const del = (id: string) =>
    request<ApiResult<DeleteUserResponse>>(baseURL, 'DELETE', `/user/${id}`, undefined, cookieStore)

  const accessor = Object.assign(
    (id: string) => ({
      get: () => get(id),
      patch: (body: UpdateUserBody) => update(id, body),
      delete: () => del(id),
    }),
    { list: { get: listGet, post: listPost }, create, get, update, delete: del },
  )

  return accessor
}
