import type { PermissionDefinition, PermissionString } from '@nexus/core/security/permissions'

export const CommentPermissions = {
  READ_ALL: 'comment:read:all' as PermissionString,
  MODERATE_ALL: 'comment:moderate:all' as PermissionString,
} as const

export const COMMENT_PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  {
    key: CommentPermissions.READ_ALL,
    displayName: '查看评论',
    description: '允许查看评论列表和评论详情。',
  },
  {
    key: CommentPermissions.MODERATE_ALL,
    displayName: '审核评论',
    description: '允许审核、隐藏和删除评论。',
  },
] as const
