import { prisma } from '@/infra/database/client'

/**
 * 用户角色关联数据访问层
 *
 * 职责：
 * - 管理用户与角色的多对多关联关系
 * - 提供用户和角色的双向查询
 *
 * @class UserRoleRepository
 */
export class UserRoleRepository {
  /**
   * 查询用户的所有角色关联
   *
   * @param userId - 用户 ID
   * @returns 用户角色关联列表（按分配时间倒序）
   *
   * @example
   * ```ts
   * const userRoles = await UserRoleRepository.findByUser('user_id')
   * // 返回: [{ id, userId, roleId, role: {...}, assignedAt }, ...]
   * ```
   */
  static async findByUser(userId: string) {
    return await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
      orderBy: { assignedAt: 'desc' },
    })
  }

  /**
   * 为用户分配角色
   *
   * @param userId - 用户 ID
   * @param roleId - 角色 ID
   * @returns 创建的用户角色关联对象（包含角色详情）
   *
   * @example
   * ```ts
   * const userRole = await UserRoleRepository.assignRole('user_id', 'editor_role_id')
   * ```
   */
  static async assignRole(userId: string, roleId: string) {
    return await prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
      include: {
        role: true,
      },
    })
  }

  /**
   * 移除用户的角色
   *
   * @param userId - 用户 ID
   * @param roleId - 角色 ID
   * @returns Prisma BatchPayload 包含删除的记录数
   *
   * @example
   * ```ts
   * const result = await UserRoleRepository.removeRole('user_id', 'role_id')
   * console.log(`删除了 ${result.count} 条关联`)
   * ```
   */
  static async removeRole(userId: string, roleId: string) {
    return await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    })
  }

  /**
   * 更新用户角色
   *
   * @param userId - 用户 ID
   * @param roleId - 角色 ID
   * @returns Prisma BatchPayload 包含更新的记录数
   *
   * @example
   * ```ts
   * const result = await UserRoleRepository.updateUserRole('user_id', 'role_id', {})
   * ```
   */
  static async updateUserRole(userId: string, roleId: string, _data: Record<string, never>) {
    return await prisma.userRole.updateMany({
      where: {
        userId,
        roleId,
      },
      data: {},
    })
  }

  /**
   * 查询用户及其所有角色和权限
   *
   * 说明：
   * - 深度查询，包含用户的角色、角色的权限
   * - 用于计算用户的完整权限列表
   *
   * @param userId - 用户 ID
   * @returns 用户对象（包含角色和权限）
   * @returns null 如果用户不存在
   *
   * @example
   * ```ts
   * const userWithRoles = await UserRoleRepository.findUserWithRoles('user_id')
   * console.log(userWithRoles.roles)
   * ```
   */
  static async findUserWithRoles(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  /**
   * 查询拥有指定角色的所有用户
   *
   * 说明：
   * - 返回用户 ID 列表
   * - 用于权限缓存失效时清除相关用户的缓存
   *
   * @param roleId - 角色 ID
   * @returns 用户 ID 列表
   *
   * @example
   * ```ts
   * const users = await UserRoleRepository.findUsersByRole('role_id')
   * users.forEach(user => {
   *   PermissionService.clearCache(user.id)
   * })
   * ```
   */
  static async findUsersByRole(roleId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: { roleId },
      select: {
        userId: true,
      },
    })

    return userRoles.map((ur) => ({ id: ur.userId }))
  }
}
