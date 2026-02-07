/**
 * RBAC 模块访问器
 *
 * 基于 Eden Treaty 风格的树形语法 API，提供角色权限管理功能
 */

import type {
  PermissionListQuery,
  PermissionListResponse,
  PermissionResponse,
  CreatePermissionBody,
  RoleListQuery,
  RoleListResponse,
  RoleDetailResponse,
  RoleResponse,
  CreateRoleBody,
  UpdateRoleBody,
  AssignPermissionsToRoleBody,
  ReplaceRolePermissionsBody,
  RolePermissionsResponse,
  SetRoleParentBody,
  AssignRoleToUserBody,
  UserRolesResponse,
  UserPermissionsResponse,
} from './types'

/**
 * 请求选项
 */
interface RequestOptions {
  params?: Record<string, unknown>
  body?: BodyInit | null | undefined
  headers?: Record<string, string>
  timeout?: number
  [key: string]: unknown
}

/**
 * API 统一响应格式
 */
interface ApiResult<T> {
  data: T
  code: number
  message: string
}

/**
 * 响应包装类型
 */
interface ResponseWrapper<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

/**
 * 基础请求函数
 */
async function request<T>(
  baseURL: string,
  method: string,
  path: string,
  options: RequestOptions | undefined,
  cookieStore: Map<string, string>,
): Promise<ResponseWrapper<T>> {
  const base = baseURL.replace(/\/$/, '')
  const fullPath = path.startsWith('/') ? path.slice(1) : path
  const url = new URL(`${base}/${fullPath}`)

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const cookieHeader = Array.from(cookieStore.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')

  let originHeader = ''
  try {
    originHeader = new URL(base).origin
  } catch {
    // 忽略 URL 解析错误
  }

  const controller = new AbortController()
  const timeout = options?.timeout ?? 30000
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(originHeader ? { Origin: originHeader } : {}),
        Cookie: cookieHeader,
        ...(options?.headers as Record<string, string>),
      },
      body: options?.body
        ? typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body)
        : undefined,
      signal: controller.signal,
      ...options,
    })

    clearTimeout(timeoutId)

    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      const cookieParts = setCookieHeader.split(';')
      const cookieNameValue = cookieParts[0].trim()
      const equalsIndex = cookieNameValue.indexOf('=')
      if (equalsIndex > 0) {
        const name = cookieNameValue.substring(0, equalsIndex)
        const value = cookieNameValue.substring(equalsIndex + 1)
        cookieStore.set(name, value)
      }
    }

    let data: T
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = (await response.json()) as T
    } else {
      data = (await response.text()) as T
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`请求超时: ${method} ${path}`)
    }
    throw error
  }
}

/**
 * API 响应包装类型
 */
type XDDResponse<T> = Promise<{
  data: T
  status: number
  headers: Headers
}>

/**
 * Roles 子模块
 */
interface RoleIdAccessor {
  get(): XDDResponse<ApiResult<RoleDetailResponse>>
  patch(body: UpdateRoleBody): XDDResponse<ApiResult<RoleResponse>>
  delete(): XDDResponse<ApiResult<null>>
  permissions: {
    get(): XDDResponse<ApiResult<RolePermissionsResponse>>
    post(body: AssignPermissionsToRoleBody): XDDResponse<ApiResult<RolePermissionsResponse>>
    put(body: ReplaceRolePermissionsBody): XDDResponse<ApiResult<RolePermissionsResponse>>
    delete(): XDDResponse<ApiResult<RolePermissionsResponse>>
  }
  parent: {
    get(): XDDResponse<ApiResult<RoleResponse>>
    patch(body: SetRoleParentBody): XDDResponse<ApiResult<RoleResponse>>
  }
}

interface RolesAccessors {
  list: {
    get(query?: RoleListQuery): XDDResponse<ApiResult<RoleListResponse>>
    post(body?: unknown): XDDResponse<ApiResult<unknown>>
  }
  create(body: CreateRoleBody): XDDResponse<ApiResult<RoleResponse>>
  (id: string): RoleIdAccessor
  get(id: string): XDDResponse<ApiResult<RoleDetailResponse>>
  update(id: string, body: UpdateRoleBody): XDDResponse<ApiResult<RoleResponse>>
  delete(id: string): XDDResponse<ApiResult<null>>
}

// Permissions 子模块
interface PermissionIdAccessor {
  get(): XDDResponse<ApiResult<PermissionResponse>>
  delete(): XDDResponse<ApiResult<null>>
}

interface PermissionsAccessors {
  list: {
    get(query?: PermissionListQuery): XDDResponse<ApiResult<PermissionListResponse>>
    post(body?: unknown): XDDResponse<ApiResult<unknown>>
  }
  create(body: CreatePermissionBody): XDDResponse<ApiResult<PermissionResponse>>
  (id: string): PermissionIdAccessor
  get(id: string): XDDResponse<ApiResult<PermissionResponse>>
  delete(id: string): XDDResponse<ApiResult<null>>
}

// Users 子模块 (rbac/users/:userId/roles)
interface UserRolesIdAccessor {
  get(): XDDResponse<ApiResult<UserRolesResponse>>
  post(body: AssignRoleToUserBody): XDDResponse<ApiResult<UserRolesResponse>>
  delete(roleId: string): XDDResponse<ApiResult<null>>
}

// 当前用户权限访问器
interface UserMeAccessor {
  permissions: {
    get(): XDDResponse<ApiResult<UserPermissionsResponse>>
  }
  roles: {
    get(): XDDResponse<ApiResult<UserRolesResponse>>
  }
}

interface RbacUsersAccessors {
  (userId: string): UserRolesIdAccessor
  get(userId: string): XDDResponse<ApiResult<UserRolesResponse>>
  assign(userId: string, body: AssignRoleToUserBody): XDDResponse<ApiResult<UserRolesResponse>>
  remove(userId: string, roleId: string): XDDResponse<ApiResult<null>>
  me: UserMeAccessor
}

// RBAC 完整访问器
export interface RbacAccessors {
  roles: RolesAccessors
  permissions: PermissionsAccessors
  users: RbacUsersAccessors
  getUserPermissions(userId: string): XDDResponse<ApiResult<UserPermissionsResponse>>
}

/**
 * RBAC 访问器配置
 */
interface RbacAccessorOptions {
  baseURL: string
  cookieStore: Map<string, string>
}

/**
 * 创建 RBAC 模块访问器
 *
 * @param baseURL - API 基础地址
 * @param cookieStore - Cookie 存储
 * @returns RBAC 访问器实例
 */
export function createRbacAccessor(options: RbacAccessorOptions): RbacAccessors {
  const { baseURL, cookieStore } = options

  // Roles
  const rolesListGet = (query?: RoleListQuery) =>
    request<ApiResult<RoleListResponse>>(
      baseURL,
      'GET',
      '/rbac/roles',
      { params: query as Record<string, unknown> },
      cookieStore,
    )

  const rolesListPost = (body?: unknown) =>
    request<ApiResult<unknown>>(baseURL, 'POST', '/rbac/roles', { body: JSON.stringify(body) }, cookieStore)

  const rolesCreate = (body: CreateRoleBody) =>
    request<ApiResult<RoleResponse>>(baseURL, 'POST', '/rbac/roles', { body: JSON.stringify(body) }, cookieStore)

  const rolesGet = (id: string) =>
    request<ApiResult<RoleDetailResponse>>(baseURL, 'GET', `/rbac/roles/${id}`, undefined, cookieStore)

  const rolesUpdate = (id: string, body: UpdateRoleBody) =>
    request<ApiResult<RoleResponse>>(baseURL, 'PATCH', `/rbac/roles/${id}`, { body: JSON.stringify(body) }, cookieStore)

  const rolesDelete = (id: string) =>
    request<ApiResult<null>>(baseURL, 'DELETE', `/rbac/roles/${id}`, undefined, cookieStore)

  const rolesAccessor: RolesAccessors = Object.assign(
    (id: string) => ({
      get: () => rolesGet(id),
      patch: (body: UpdateRoleBody) => rolesUpdate(id, body),
      delete: () => rolesDelete(id),
      permissions: {
        get: () =>
          request<ApiResult<RolePermissionsResponse>>(
            baseURL,
            'GET',
            `/rbac/roles/${id}/permissions`,
            undefined,
            cookieStore,
          ),
        post: (body: AssignPermissionsToRoleBody) =>
          request<ApiResult<RolePermissionsResponse>>(
            baseURL,
            'POST',
            `/rbac/roles/${id}/permissions`,
            {
              body: JSON.stringify(body),
            },
            cookieStore,
          ),
        put: (body: ReplaceRolePermissionsBody) =>
          request<ApiResult<RolePermissionsResponse>>(
            baseURL,
            'PUT',
            `/rbac/roles/${id}/permissions`,
            {
              body: JSON.stringify(body),
            },
            cookieStore,
          ),
        delete: () =>
          request<ApiResult<RolePermissionsResponse>>(
            baseURL,
            'DELETE',
            `/rbac/roles/${id}/permissions`,
            undefined,
            cookieStore,
          ),
      },
      parent: {
        get: () => request<ApiResult<RoleResponse>>(baseURL, 'GET', `/rbac/roles/${id}/parent`, undefined, cookieStore),
        patch: (body: SetRoleParentBody) =>
          request<ApiResult<RoleResponse>>(
            baseURL,
            'PATCH',
            `/rbac/roles/${id}/parent`,
            {
              body: JSON.stringify(body),
            },
            cookieStore,
          ),
      },
    }),
    {
      list: { get: rolesListGet, post: rolesListPost },
      create: rolesCreate,
      get: rolesGet,
      update: rolesUpdate,
      delete: rolesDelete,
    },
  )

  // Permissions
  const permissionsListGet = (query?: PermissionListQuery) =>
    request<ApiResult<PermissionListResponse>>(
      baseURL,
      'GET',
      '/rbac/permissions',
      {
        params: query as Record<string, unknown>,
      },
      cookieStore,
    )

  const permissionsListPost = (body?: unknown) =>
    request<ApiResult<unknown>>(baseURL, 'POST', '/rbac/permissions', { body: JSON.stringify(body) }, cookieStore)

  const permissionsCreate = (body: CreatePermissionBody) =>
    request<ApiResult<PermissionResponse>>(
      baseURL,
      'POST',
      '/rbac/permissions',
      { body: JSON.stringify(body) },
      cookieStore,
    )

  const permissionsGet = (id: string) =>
    request<ApiResult<PermissionResponse>>(baseURL, 'GET', `/rbac/permissions/${id}`, undefined, cookieStore)

  const permissionsDelete = (id: string) =>
    request<ApiResult<null>>(baseURL, 'DELETE', `/rbac/permissions/${id}`, undefined, cookieStore)

  const permissionsAccessor: PermissionsAccessors = Object.assign(
    (id: string) => ({
      get: () => permissionsGet(id),
      delete: () => permissionsDelete(id),
    }),
    {
      list: { get: permissionsListGet, post: permissionsListPost },
      create: permissionsCreate,
      get: permissionsGet,
      delete: permissionsDelete,
    },
  )

  // Users (rbac/users/:userId/roles)
  const getUserRoles = (userId: string) =>
    request<ApiResult<UserRolesResponse>>(baseURL, 'GET', `/rbac/users/${userId}/roles`, undefined, cookieStore)

  const assignUserRole = (userId: string, body: AssignRoleToUserBody) =>
    request<ApiResult<UserRolesResponse>>(
      baseURL,
      'POST',
      `/rbac/users/${userId}/roles`,
      {
        body: JSON.stringify(body),
      },
      cookieStore,
    )

  const removeUserRole = (userId: string, roleId: string) =>
    request<ApiResult<null>>(baseURL, 'DELETE', `/rbac/users/${userId}/roles/${roleId}`, undefined, cookieStore)

  const getUserPermissions = (userId: string) =>
    request<ApiResult<UserPermissionsResponse>>(
      baseURL,
      'GET',
      `/rbac/users/${userId}/permissions`,
      undefined,
      cookieStore,
    )

  const usersAccessor: RbacUsersAccessors = Object.assign(
    (userId: string) => ({
      get: () => getUserRoles(userId),
      post: (body: AssignRoleToUserBody) => assignUserRole(userId, body),
      delete: (roleId: string) => removeUserRole(userId, roleId),
    }),
    {
      get: getUserRoles,
      assign: assignUserRole,
      remove: removeUserRole,
      me: {
        permissions: { get: () => getUserPermissions('me') },
        roles: { get: () => getUserRoles('me') },
      },
    },
  )

  return {
    roles: rolesAccessor,
    permissions: permissionsAccessor,
    users: usersAccessor,
    getUserPermissions,
  }
}

// 导出类型
export type {
  RoleIdAccessor,
  RolesAccessors,
  PermissionIdAccessor,
  PermissionsAccessors,
  UserRolesIdAccessor,
  UserMeAccessor,
  RbacUsersAccessors,
}
