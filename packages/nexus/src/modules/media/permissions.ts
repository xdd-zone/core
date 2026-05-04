import type { PermissionDefinition, PermissionString } from '@nexus/core/permissions'

export const MediaPermissions = {
  READ_ALL: 'media:read:all' as PermissionString,
  WRITE_ALL: 'media:write:all' as PermissionString,
} as const

export const MEDIA_PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  {
    key: MediaPermissions.READ_ALL,
    displayName: '查看媒体资源',
    description: '允许查看媒体列表和访问媒体文件。',
  },
  {
    key: MediaPermissions.WRITE_ALL,
    displayName: '管理媒体资源',
    description: '允许上传和删除媒体资源。',
  },
] as const
