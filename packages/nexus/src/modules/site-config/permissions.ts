import type { PermissionDefinition, PermissionString } from '@nexus/core/security/permissions'

export const SiteConfigPermissions = {
  READ: 'site_config:read' as PermissionString,
  WRITE: 'site_config:write' as PermissionString,
} as const

export const SITE_CONFIG_PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  {
    key: SiteConfigPermissions.READ,
    displayName: '查看站点配置',
    description: '允许查看站点配置。',
  },
  {
    key: SiteConfigPermissions.WRITE,
    displayName: '编辑站点配置',
    description: '允许更新站点配置。',
  },
] as const
