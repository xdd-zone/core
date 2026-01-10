import type pino from 'pino'
import type { PrismaClient } from '../../generated'
// 直接导入常量定义，避免触发 PermissionService 加载
import { Permissions } from '@/core/permissions/permissions'

/**
 * 角色权限关系种子数据
 *
 * 权限分配策略：
 * 1. superAdmin - 拥有所有权限（无限制）
 * 2. admin - 拥有用户管理权限，但不能分配角色
 * 3. user - 普通用户，只能管理自己的数据
 */
export async function seedRolePermissions(prisma: PrismaClient, logger: pino.Logger) {
  logger.info('🌱 开始分配角色权限...')

  // 获取所有角色（必须先运行 seedRoles）
  const [superAdmin, admin, user] = await Promise.all([
    prisma.role.findUnique({ where: { name: 'superAdmin' } }),
    prisma.role.findUnique({ where: { name: 'admin' } }),
    prisma.role.findUnique({ where: { name: 'user' } }),
  ])

  // 角色不存在时抛出错误
  if (!superAdmin || !admin || !user) {
    throw new Error('角色未找到，请先运行 seedRoles')
  }

  // 获取所有权限
  const allPermissions = await prisma.permission.findMany()

  /**
   * 辅助函数：为角色分配权限
   * @param roleId 角色 ID
   * @param resource 资源类型
   * @param action 操作类型
   * @param scope 作用域
   */
  const assignPermission = async (roleId: string, resource: string, action: string, scope?: string | null) => {
    const permission = await prisma.permission.findUnique({
      where: {
        resource_action_scope: {
          resource,
          action,
          scope: scope || '',
        },
      },
    })

    if (permission) {
      // 使用 upsert 确保重复运行不会创建重复数据
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id,
          },
        },
        update: {}, // 如果存在则不更新
        create: {
          roleId,
          permissionId: permission.id,
        }, // 如果不存在则创建
      })
    }
  }

  /**
   * 从权限常量字符串中提取 resource、action、scope
   * 支持格式：
   * - resource:action (2 parts)
   * - resource:action:scope (3 parts)
   */
  const parsePermissionString = (permissionStr: string) => {
    const parts = permissionStr.split(':')
    if (parts.length === 3) {
      return { resource: parts[0]!, action: parts[1]!, scope: parts[2]! }
    }
    if (parts.length === 2) {
      return { resource: parts[0]!, action: parts[1]!, scope: '' }
    }
    throw new Error(`无效的权限格式: ${permissionStr}`)
  }

  /**
   * 使用 Permissions 常量为角色分配权限
   */
  const assignByConstant = async (roleId: string, permissionStr: string) => {
    const { resource, action, scope } = parsePermissionString(permissionStr)
    await assignPermission(roleId, resource, action, scope)
  }

  // ==================== 超级管理员 - 拥有所有权限 ====================
  // superAdmin 拥有系统中的所有权限，无任何限制
  for (const permission of allPermissions) {
    await assignPermission(superAdmin.id, permission.resource, permission.action, permission.scope)
  }

  // ==================== 管理员 - 用户管理权限 ====================
  // admin 可以管理用户，但不能分配角色（assign_role 权限被排除）
  // 使用 Permissions 常量定义管理员权限
  const adminPermissions = [
    // 基本用户管理权限
    Permissions.USER.CREATE,
    Permissions.USER.READ_OWN,
    Permissions.USER.UPDATE_OWN,
    Permissions.USER.DELETE_OWN,
    Permissions.USER.READ_ALL,
    Permissions.USER.UPDATE_ALL,
    Permissions.USER.DELETE_ALL,
    // 用户角色相关权限
    Permissions.USER_ROLE.READ_OWN,
    Permissions.USER_ROLE.READ_ALL,
    Permissions.USER_ROLE.UPDATE_ALL,
    Permissions.USER_ROLE.DELETE_ALL,
    // 用户权限查询相关
    Permissions.USER_PERMISSION.READ_OWN,
    Permissions.USER_PERMISSION.READ_ALL,
  ]

  for (const permissionStr of adminPermissions) {
    await assignByConstant(admin.id, permissionStr)
  }

  // ==================== 普通用户 - 基本权限 ====================
  // 普通用户只能管理自己的数据（scope: 'own'）
  // 使用 Permissions 常量定义普通用户权限
  const userPermissions = [
    Permissions.USER.READ_OWN, // 查看自己的信息
    Permissions.USER.UPDATE_OWN, // 更新自己的信息
    Permissions.USER.DELETE_OWN, // 删除自己的账号
    Permissions.USER_ROLE.READ_OWN, // 查看自己的角色
    Permissions.USER_PERMISSION.READ_OWN, // 查看自己的权限
  ]

  for (const permissionStr of userPermissions) {
    await assignByConstant(user.id, permissionStr)
  }

  logger.info('✅ 角色权限分配完成')
}
