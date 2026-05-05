import type { PermissionDefinition, PermissionString } from '@nexus/core/permissions'

export const CategoryPermissions = {
  READ_ALL: 'category:read:all' as PermissionString,
  WRITE_ALL: 'category:write:all' as PermissionString,
} as const

export const CATEGORY_MANAGE_PERMISSIONS = [CategoryPermissions.READ_ALL, CategoryPermissions.WRITE_ALL] as const

export const CATEGORY_PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  {
    key: CategoryPermissions.READ_ALL,
    displayName: '查看分类',
    description: '允许查看后台分类列表和分类详情。',
  },
  {
    key: CategoryPermissions.WRITE_ALL,
    displayName: '编辑分类',
    description: '允许创建、更新和删除分类。',
  },
] as const
