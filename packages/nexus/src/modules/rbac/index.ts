/**
 * RBAC 模块路由定义
 * 定义角色、权限、分配管理的所有 API 端点
 */

import { authGuard, Require } from '@/core'
import { createModule } from '@/core/plugins'
import * as Schemas from './rbac.model'
import { RbacService } from './rbac.service'

/**
 * RBAC模块 Elysia 实例
 * 说明：定义所有RBAC管理相关的 API 路由
 * 注意：使用 createModule 创建，自动注入 responsePlugin
 */
export const rbacModule = createModule({
  prefix: '/rbac',
  tags: ['RBAC'],
})
  .use(authGuard({ required: true }))

  // ===== 角色管理 =====

  /**
   * 获取角色列表
   * GET /rbac/roles
   * 支持分页、关键字搜索、系统角色过滤
   */
  .get(
    '/roles',
    async ({ query }) => {
      return await RbacService.listRoles(query)
    },
    {
      beforeHandle: [Require.RoleRead()],
      query: Schemas.RoleListQuerySchema,
      detail: {
        summary: '获取角色列表',
        description: '支持分页、关键字搜索、系统角色过滤',
      },
    },
  )

  /**
   * 创建角色
   * POST /rbac/roles
   */
  .post(
    '/roles',
    async ({ body }) => {
      return await RbacService.createRole(body)
    },
    {
      beforeHandle: [Require.RoleCreate()],
      body: Schemas.CreateRoleBodySchema,
      detail: {
        summary: '创建角色',
        description: '创建新角色',
      },
    },
  )

  /**
   * 获取角色详情
   * GET /rbac/roles/:id
   */
  .get(
    '/roles/:id',
    async ({ params }) => {
      return await RbacService.getRoleDetail(params.id)
    },
    {
      beforeHandle: [Require.RoleRead()],
      params: Schemas.RoleIdParamsSchema,
      detail: {
        summary: '获取角色详情',
        description: '根据ID获取角色的详细信息，包含权限列表',
      },
    },
  )

  /**
   * 更新角色
   * PATCH /rbac/roles/:id
   */
  .patch(
    '/roles/:id',
    async ({ params, body }) => {
      return await RbacService.updateRole(params.id, body)
    },
    {
      beforeHandle: [Require.RoleUpdateAll()],
      params: Schemas.RoleIdParamsSchema,
      body: Schemas.UpdateRoleBodySchema,
      detail: {
        summary: '更新角色',
        description: '更新角色信息',
      },
    },
  )

  /**
   * 删除角色
   * DELETE /rbac/roles/:id
   */
  .delete(
    '/roles/:id',
    async ({ params }) => {
      return await RbacService.deleteRole(params.id)
    },
    {
      beforeHandle: [Require.RoleDeleteAll()],
      params: Schemas.RoleIdParamsSchema,
      detail: {
        summary: '删除角色',
        description: '删除指定角色（系统角色不可删除）',
      },
    },
  )

  /**
   * 设置父角色
   * PATCH /rbac/roles/:id/parent
   */
  .patch(
    '/roles/:id/parent',
    async ({ params, body }) => {
      return await RbacService.setRoleParent(params.id, body.parentId)
    },
    {
      beforeHandle: [Require.RoleUpdateAll()],
      params: Schemas.RoleIdParamsSchema,
      body: Schemas.SetRoleParentBodySchema,
      detail: {
        summary: '设置父角色',
        description: '设置角色的父角色以实现继承',
      },
    },
  )

  /**
   * 获取子角色列表
   * GET /rbac/roles/:id/children
   */
  .get(
    '/roles/:id/children',
    async ({ params }) => {
      return await RbacService.getRoleChildren(params.id)
    },
    {
      beforeHandle: [Require.RoleRead()],
      params: Schemas.RoleIdParamsSchema,
      detail: {
        summary: '获取子角色列表',
        description: '获取指定角色的所有直接子角色',
      },
    },
  )

  // ===== 权限管理 =====

  /**
   * 获取权限列表
   * GET /rbac/permissions
   */
  .get(
    '/permissions',
    async ({ query }) => {
      return await RbacService.listPermissions(query)
    },
    {
      beforeHandle: [Require.PermissionRead()],
      query: Schemas.PermissionListQuerySchema,
      detail: {
        summary: '获取权限列表',
        description: '支持分页、按资源过滤',
      },
    },
  )

  /**
   * 获取权限详情
   * GET /rbac/permissions/:id
   */
  .get(
    '/permissions/:id',
    async ({ params }) => {
      return await RbacService.getPermissionDetail(params.id)
    },
    {
      beforeHandle: [Require.PermissionRead()],
      params: Schemas.PermissionIdParamsSchema,
      detail: {
        summary: '获取权限详情',
        description: '根据ID获取权限详细信息',
      },
    },
  )

  /**
   * 创建权限
   * POST /rbac/permissions
   */
  .post(
    '/permissions',
    async ({ body }) => {
      return await RbacService.createPermission(body)
    },
    {
      beforeHandle: [Require.PermissionCreate()],
      body: Schemas.CreatePermissionBodySchema,
      detail: {
        summary: '创建权限',
        description: '创建自定义权限',
      },
    },
  )

  // ===== 角色权限分配 =====

  /**
   * 获取角色权限列表
   * GET /rbac/roles/:id/permissions
   */
  .get(
    '/roles/:id/permissions',
    async ({ params }) => {
      return await RbacService.getRolePermissions(params.id)
    },
    {
      beforeHandle: [Require.RoleRead()],
      params: Schemas.RoleIdParamsSchema,
      detail: {
        summary: '获取角色权限列表',
        description: '获取指定角色的所有权限',
      },
    },
  )

  /**
   * 为角色分配权限
   * POST /rbac/roles/:id/permissions
   */
  .post(
    '/roles/:id/permissions',
    async ({ params, body }) => {
      return await RbacService.assignPermissionsToRole(params.id, body.permissionIds)
    },
    {
      beforeHandle: [Require.RolePermissionCreate()],
      params: Schemas.RoleIdParamsSchema,
      body: Schemas.AssignPermissionsToRoleBodySchema,
      detail: {
        summary: '为角色分配权限',
        description: '为角色添加一个或多个权限',
      },
    },
  )

  /**
   * 移除角色权限
   * DELETE /rbac/roles/:id/permissions/:permissionId
   */
  .delete(
    '/roles/:id/permissions/:permissionId',
    async ({ params }) => {
      return await RbacService.removePermissionFromRole(params.id, params.permissionId)
    },
    {
      beforeHandle: [Require.RolePermissionDelete()],
      params: Schemas.RolePermissionIdParamsSchema,
      detail: {
        summary: '移除角色权限',
        description: '从指定角色中移除某个权限',
      },
    },
  )

  /**
   * 批量替换角色权限
   * PATCH /rbac/roles/:id/permissions
   */
  .patch(
    '/roles/:id/permissions',
    async ({ params, body }) => {
      return await RbacService.replaceRolePermissions(params.id, body.permissionIds)
    },
    {
      beforeHandle: [Require.RolePermissionDelete()],
      params: Schemas.RoleIdParamsSchema,
      body: Schemas.ReplaceRolePermissionsBodySchema,
      detail: {
        summary: '批量替换角色权限',
        description: '完全替换角色的权限列表',
      },
    },
  )

  // ===== 用户角色管理 =====

  /**
   * 获取用户角色列表
   * GET /rbac/users/:userId/roles
   */
  .get(
    '/users/:userId/roles',
    async ({ params }) => {
      return await RbacService.getUserRoles(params.userId)
    },
    {
      beforeHandle: [Require.UserRoleReadOwn()],
      params: Schemas.UserIdParamsSchema,
      detail: {
        summary: '获取用户角色列表',
        description: '获取指定用户的所有角色（只能查看自己或需要 read_all 权限）',
      },
    },
  )

  /**
   * 为用户分配角色
   * POST /rbac/users/:userId/roles
   */
  .post(
    '/users/:userId/roles',
    async ({ params, body }) => {
      return await RbacService.assignRoleToUser(params.userId, body.roleId, {})
    },
    {
      beforeHandle: [Require.UserRoleCreateAll()],
      params: Schemas.UserIdParamsSchema,
      body: Schemas.AssignRoleToUserBodySchema,
      detail: {
        summary: '为用户分配角色',
        description: '为用户分配角色',
      },
    },
  )

  /**
   * 移除用户角色
   * DELETE /rbac/users/:userId/roles/:roleId
   */
  .delete(
    '/users/:userId/roles/:roleId',
    async ({ params }) => {
      return await RbacService.removeRoleFromUser(params.userId, params.roleId)
    },
    {
      beforeHandle: [Require.UserRoleDeleteAll()],
      params: Schemas.UserRoleIdParamsSchema,
      detail: {
        summary: '移除用户角色',
        description: '从指定用户中移除某个角色',
      },
    },
  )

  /**
   * 更新用户角色
   * PATCH /rbac/users/:userId/roles/:roleId
   */
  .patch(
    '/users/:userId/roles/:roleId',
    async ({ params }) => {
      return await RbacService.updateUserRole(params.userId, params.roleId, {})
    },
    {
      beforeHandle: [Require.UserRoleUpdateAll()],
      params: Schemas.UserRoleIdParamsSchema,
      detail: {
        summary: '更新用户角色',
        description: '刷新用户角色缓存',
      },
    },
  )

  // ===== 用户权限查询 =====

  /**
   * 获取用户所有权限
   * GET /rbac/users/:userId/permissions
   */
  .get(
    '/users/:userId/permissions',
    async ({ params }) => {
      return await RbacService.getUserPermissions(params.userId)
    },
    {
      beforeHandle: [Require.UserPermissionReadOwn()],
      params: Schemas.UserIdParamsSchema,
      detail: {
        summary: '获取用户所有权限',
        description: '获取指定用户的所有权限（含继承）（只能查看自己或需要 read_all 权限）',
      },
    },
  )

  // ===== 当前用户 =====

  /**
   * 获取当前用户权限
   * GET /rbac/users/me/permissions
   *
   * 用户可以查看自己的权限（需要 user:permission:read:own 权限）
   */
  .get(
    '/users/me/permissions',
    async (ctx: any) => {
      return await RbacService.getCurrentUserPermissions(ctx.user.id)
    },
    {
      beforeHandle: [Require.UserPermissionReadMe()],
      detail: {
        summary: '获取当前用户权限',
        description: '返回当前登录用户的所有权限（含继承）',
      },
    },
  )

  /**
   * 获取当前用户角色
   * GET /rbac/users/me/roles
   *
   * 用户可以查看自己的角色（需要 user:role:read:own 权限）
   */
  .get(
    '/users/me/roles',
    async (ctx: any) => {
      return await RbacService.getCurrentUserRoles(ctx.user.id)
    },
    {
      beforeHandle: [Require.UserRoleReadMe()],
      detail: {
        summary: '获取当前用户角色',
        description: '返回当前登录用户的角色列表',
      },
    },
  )

export * from './rbac.constants'
export * from './rbac.model'
// ===== 导出 =====
export * from './rbac.service'
export * from './rbac.types'
