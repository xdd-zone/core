import type { PermissionDefinition, PermissionString } from '@nexus/core/security/permissions'

export const PostPermissions = {
  READ_ALL: 'post:read:all' as PermissionString,
  WRITE_ALL: 'post:write:all' as PermissionString,
  PUBLISH_ALL: 'post:publish:all' as PermissionString,
} as const

export const POST_PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  {
    key: PostPermissions.READ_ALL,
    displayName: '查看文章',
    description: '允许查看后台文章列表和文章详情。',
  },
  {
    key: PostPermissions.WRITE_ALL,
    displayName: '编辑文章',
    description: '允许创建、更新和删除文章。',
  },
  {
    key: PostPermissions.PUBLISH_ALL,
    displayName: '发布文章',
    description: '允许发布和取消发布文章。',
  },
] as const
