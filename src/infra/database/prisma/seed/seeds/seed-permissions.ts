import type pino from 'pino'
import type { PrismaClient } from '../../generated'
import { parsePermission } from '@/core/permissions/helpers'
// 直接导入常量定义，避免触发 PermissionService 加载
import { Permissions } from '@/core/permissions/permissions'

/**
 * 权限种子数据
 *
 * 权限定义格式：{ resource: string, action: string, scope: string, displayName: string }
 *
 * - resource: 资源类型（如：user、role、permission）
 * - action: 操作类型（如：create、read、update、delete、manage）
 * - scope: 作用域（如：''、'own'、'all'、'read'、'assign' 等）
 *   - '': 通用权限，不限定作用域
 *   - 'own': 仅对自己拥有权限
 *   - 'all': 对所有资源拥有权限
 *   - 其他特定作用域：如 'read'、'assign'、'update' 等
 * - displayName: 权限显示名称
 */

const permissionDisplayNames: Record<string, string> = {
  // 用户管理权限
  'user:create': '创建用户',
  'user:read:own': '查看自己的信息',
  'user:read:all': '查看所有用户',
  'user:update:own': '更新自己的信息',
  'user:update:all': '更新所有用户',
  'user:delete:own': '删除自己',
  'user:delete:all': '删除所有用户',

  // 用户角色管理权限
  'user_role:create:own': '为自己分配角色',
  'user_role:create:all': '为用户分配角色',
  'user_role:read:own': '查看自己的角色',
  'user_role:read:all': '查看所有用户的角色',
  'user_role:update:own': '更新自己的角色',
  'user_role:update:all': '更新用户的角色',
  'user_role:delete:own': '移除自己的角色',
  'user_role:delete:all': '移除用户的角色',

  // 用户权限查询权限
  'user_permission:read:own': '查看自己的权限',
  'user_permission:read:all': '查看所有用户的权限',

  // 角色管理权限
  'role:create': '创建角色',
  'role:read': '查看角色',
  'role:read:own': '查看自己的角色详情',
  'role:read:all': '查看所有角色详情',
  'role:update': '更新角色',
  'role:update:own': '更新自己的角色',
  'role:update:all': '更新所有角色',
  'role:delete': '删除角色',
  'role:delete:own': '删除自己创建的角色',
  'role:delete:all': '删除所有角色',

  // 角色权限管理权限
  'role_permission:create': '为角色分配权限',
  'role_permission:delete': '移除角色权限',

  // 权限管理权限
  'permission:create': '创建权限',
  'permission:read': '查看权限',
  'permission:update': '更新权限',
  'permission:update:own': '更新自己创建的权限',
  'permission:update:all': '更新所有权限',
  'permission:delete': '删除权限',
  'permission:delete:own': '删除自己创建的权限',
  'permission:delete:all': '删除所有权限',
}

export async function seedPermissions(prisma: PrismaClient, logger: pino.Logger) {
  logger.info('🌱 开始创建权限...')

  /**
   * 从 Permissions 常量生成权限列表
   *
   * 转换过程：
   * 1. 递归提取 Permissions 对象中的所有字符串值
   * 2. 过滤掉非字符串值和通配符 '*'
   * 3. 使用 parsePermission 解析权限字符串为 {resource, action, scope}
   * 4. 使用 displayNames 映射生成 displayName
   * 5. 如果没有映射，则自动生成显示名称
   */
  function extractPermissionStrings(obj: any): string[] {
    const strings: string[] = []
    for (const value of Object.values(obj)) {
      if (typeof value === 'string' && value !== '*') {
        strings.push(value)
      } else if (typeof value === 'object' && value !== null) {
        strings.push(...extractPermissionStrings(value))
      }
    }
    return strings
  }

  const permissionStrings = extractPermissionStrings(Permissions)

  const permissions = permissionStrings.map((permissionStr) => {
    const parsed = parsePermission(permissionStr as `${string}:${string}`)

    // 获取或生成显示名称
    let displayName = permissionDisplayNames[permissionStr as string]
    if (!displayName) {
      // 自动生成显示名称
      const scopeText = parsed.scope ? `(${parsed.scope})` : ''
      displayName = `${parsed.resource}:${parsed.action}${scopeText}`
    }

    return {
      resource: parsed.resource,
      action: parsed.action,
      scope: parsed.scope || '',
      displayName,
    }
  })

  // 批量创建/更新权限
  // 使用 upsert 确保重复运行不会创建重复数据
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action_scope: {
          resource: permission.resource,
          action: permission.action,
          scope: permission.scope,
        },
      },
      update: {}, // 如果存在则不更新
      create: permission, // 如果不存在则创建
    })
  }

  logger.info(`✅ 权限创建完成，共 ${permissions.length} 个权限`)
}
