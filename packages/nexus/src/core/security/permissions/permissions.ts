import type { PermissionString } from './permissions.types'

/**
 * 系统权限常量。
 */
export const Permissions = {
  USER: {
    READ_OWN: 'user:read:own' as PermissionString,
    READ_ALL: 'user:read:all' as PermissionString,
    UPDATE_OWN: 'user:update:own' as PermissionString,
    UPDATE_ALL: 'user:update:all' as PermissionString,
    DISABLE_ALL: 'user:disable:all' as PermissionString,
  },
  ROLE: {
    READ_ALL: 'role:read:all' as PermissionString,
  },
  USER_ROLE: {
    ASSIGN_ALL: 'user_role:assign:all' as PermissionString,
    REVOKE_ALL: 'user_role:revoke:all' as PermissionString,
  },
  USER_PERMISSION: {
    READ_OWN: 'user_permission:read:own' as PermissionString,
    READ_ALL: 'user_permission:read:all' as PermissionString,
  },
  POST: {
    READ_ALL: 'post:read:all' as PermissionString,
    WRITE_ALL: 'post:write:all' as PermissionString,
    PUBLISH_ALL: 'post:publish:all' as PermissionString,
  },
  SITE_CONFIG: {
    READ: 'site_config:read' as PermissionString,
    WRITE: 'site_config:write' as PermissionString,
  },
  MEDIA: {
    READ_ALL: 'media:read:all' as PermissionString,
    WRITE_ALL: 'media:write:all' as PermissionString,
  },
  COMMENT: {
    READ_ALL: 'comment:read:all' as PermissionString,
    MODERATE_ALL: 'comment:moderate:all' as PermissionString,
  },
  SYSTEM: {
    MANAGE: 'system:manage' as PermissionString,
  },
} as const

export const SYSTEM_PERMISSION_KEYS = [
  Permissions.USER.READ_OWN,
  Permissions.USER.UPDATE_OWN,
  Permissions.USER.READ_ALL,
  Permissions.USER.UPDATE_ALL,
  Permissions.USER.DISABLE_ALL,
  Permissions.ROLE.READ_ALL,
  Permissions.USER_ROLE.ASSIGN_ALL,
  Permissions.USER_ROLE.REVOKE_ALL,
  Permissions.USER_PERMISSION.READ_OWN,
  Permissions.USER_PERMISSION.READ_ALL,
  Permissions.POST.READ_ALL,
  Permissions.POST.WRITE_ALL,
  Permissions.POST.PUBLISH_ALL,
  Permissions.SITE_CONFIG.READ,
  Permissions.SITE_CONFIG.WRITE,
  Permissions.MEDIA.READ_ALL,
  Permissions.MEDIA.WRITE_ALL,
  Permissions.COMMENT.READ_ALL,
  Permissions.COMMENT.MODERATE_ALL,
  Permissions.SYSTEM.MANAGE,
] as const

export type SystemPermissionKey = (typeof SYSTEM_PERMISSION_KEYS)[number]

export const SYSTEM_PERMISSION_DEFINITIONS: ReadonlyArray<{
  key: SystemPermissionKey
  displayName: string
  description: string
}> = [
  {
    key: Permissions.USER.READ_OWN,
    displayName: '查看自己的资料',
    description: '允许查看当前登录用户的基础资料。',
  },
  {
    key: Permissions.USER.UPDATE_OWN,
    displayName: '更新自己的资料',
    description: '允许更新当前登录用户的基础资料。',
  },
  {
    key: Permissions.USER.READ_ALL,
    displayName: '查看全部用户',
    description: '允许后台管理员查看用户列表和用户详情。',
  },
  {
    key: Permissions.USER.UPDATE_ALL,
    displayName: '更新全部用户资料',
    description: '允许后台管理员更新用户基础资料。',
  },
  {
    key: Permissions.USER.DISABLE_ALL,
    displayName: '管理用户状态',
    description: '允许后台管理员启用、停用或封禁用户。',
  },
  {
    key: Permissions.ROLE.READ_ALL,
    displayName: '查看角色列表',
    description: '允许查看固定系统角色与用户角色分配结果。',
  },
  {
    key: Permissions.USER_ROLE.ASSIGN_ALL,
    displayName: '分配用户角色',
    description: '允许为用户分配固定系统角色。',
  },
  {
    key: Permissions.USER_ROLE.REVOKE_ALL,
    displayName: '移除用户角色',
    description: '允许移除用户已分配的固定系统角色。',
  },
  {
    key: Permissions.USER_PERMISSION.READ_OWN,
    displayName: '查看自己的权限',
    description: '允许查看当前登录用户的有效权限。',
  },
  {
    key: Permissions.USER_PERMISSION.READ_ALL,
    displayName: '查看用户权限',
    description: '允许查看指定用户的有效权限。',
  },
  {
    key: Permissions.POST.READ_ALL,
    displayName: '查看文章',
    description: '允许查看后台文章列表和文章详情。',
  },
  {
    key: Permissions.POST.WRITE_ALL,
    displayName: '编辑文章',
    description: '允许创建、更新和删除文章。',
  },
  {
    key: Permissions.POST.PUBLISH_ALL,
    displayName: '发布文章',
    description: '允许发布和取消发布文章。',
  },
  {
    key: Permissions.SITE_CONFIG.READ,
    displayName: '查看站点配置',
    description: '允许查看站点配置。',
  },
  {
    key: Permissions.SITE_CONFIG.WRITE,
    displayName: '编辑站点配置',
    description: '允许更新站点配置。',
  },
  {
    key: Permissions.MEDIA.READ_ALL,
    displayName: '查看媒体资源',
    description: '允许查看媒体列表和访问媒体文件。',
  },
  {
    key: Permissions.MEDIA.WRITE_ALL,
    displayName: '管理媒体资源',
    description: '允许上传和删除媒体资源。',
  },
  {
    key: Permissions.COMMENT.READ_ALL,
    displayName: '查看评论',
    description: '允许查看评论列表和评论详情。',
  },
  {
    key: Permissions.COMMENT.MODERATE_ALL,
    displayName: '审核评论',
    description: '允许审核、隐藏和删除评论。',
  },
  {
    key: Permissions.SYSTEM.MANAGE,
    displayName: '管理系统底座',
    description: '平台级全局管理能力，由超级管理员稳定持有。',
  },
] as const

export const UserPermissions = Permissions.USER
export const RolePermissions = Permissions.ROLE
export const UserRolePermissions = Permissions.USER_ROLE
export const UserPermissionQueryPermissions = Permissions.USER_PERMISSION
export const PostPermissions = Permissions.POST
export const SiteConfigPermissions = Permissions.SITE_CONFIG
export const MediaPermissions = Permissions.MEDIA
export const CommentPermissions = Permissions.COMMENT
export const SystemPermissions = Permissions.SYSTEM
