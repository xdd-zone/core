import { prisma } from '@/infrastructure/database/client'

/**
 * 角色权限关联数据访问层
 *
 * 职责：
 * - 管理角色与权限的多对多关联关系
 * - 提供批量操作方法
 * - 支持事务处理确保数据一致性
 *
 * @class RolePermissionRepository
 */
export class RolePermissionRepository {
  /**
   * 查询角色的所有权限关联
   *
   * @param roleId - 角色 ID
   * @returns 角色权限关联列表（包含权限详情）
   *
   * @example
   * ```ts
   * const rolePermissions = await RolePermissionRepository.findByRole('role_id')
   * // 返回: [{ id, roleId, permissionId, permission: {...} }, ...]
   * ```
   */
  static async findByRole(roleId: string) {
    return await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    })
  }

  /**
   * 为角色分配单个权限
   *
   * @param roleId - 角色 ID
   * @param permissionId - 权限 ID
   * @returns 创建的角色权限关联对象
   *
   * @example
   * ```ts
   * const assignment = await RolePermissionRepository.assignPermission(
   *   'role_id',
   *   'perm_id'
   * )
   * ```
   */
  static async assignPermission(roleId: string, permissionId: string) {
    return await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    })
  }

  /**
   * 移除角色的单个权限
   *
   * @param roleId - 角色 ID
   * @param permissionId - 权限 ID
   * @returns Prisma BatchPayload 包含删除的记录数
   *
   * @example
   * ```ts
   * const result = await RolePermissionRepository.removePermission(
   *   'role_id',
   *   'perm_id'
   * )
   * console.log(`删除了 ${result.count} 条关联`)
   * ```
   */
  static async removePermission(roleId: string, permissionId: string) {
    return await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    })
  }

  /**
   * 为角色批量分配权限
   *
   * 说明：
   * - 使用 skipDuplicates 跳过已存在的关联
   * - 空数组会直接返回，不执行任何操作
   *
   * @param roleId - 角色 ID
   * @param permissionIds - 权限 ID 数组
   * @returns Prisma BatchPayload 包含创建的记录数
   *
   * @example
   * ```ts
   * const result = await RolePermissionRepository.batchAssign(
   *   'role_id',
   *   ['perm1', 'perm2', 'perm3']
   * )
   * console.log(`创建了 ${result.count} 条关联`)
   * ```
   */
  static async batchAssign(roleId: string, permissionIds: string[]) {
    if (permissionIds.length === 0) {
      return []
    }

    return await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    })
  }

  /**
   * 批量移除角色的权限
   *
   * @param roleId - 角色 ID
   * @param permissionIds - 要移除的权限 ID 数组
   * @returns Prisma BatchPayload 包含删除的记录数
   *
   * @example
   * ```ts
   * const result = await RolePermissionRepository.batchRemove(
   *   'role_id',
   *   ['perm1', 'perm2']
   * )
   * console.log(`删除了 ${result.count} 条关联`)
   * ```
   */
  static async batchRemove(roleId: string, permissionIds: string[]) {
    return await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: { in: permissionIds },
      },
    })
  }

  /**
   * 替换角色的所有权限
   *
   * 说明：
   * - 使用事务确保操作的原子性
   * - 先删除该角色的所有权限关联
   * - 再批量添加新的权限关联
   * - 适用于权限完全替换场景
   *
   * @param roleId - 角色 ID
   * @param permissionIds - 新的权限 ID 数组（可空）
   * @returns 操作结果
   *
   * @example
   * ```ts
   * const result = await RolePermissionRepository.replacePermissions(
   *   'role_id',
   *   ['perm1', 'perm2', 'perm3']
   * )
   * // 角色现在的权限只有 perm1, perm2, perm3
   * ```
   */
  static async replacePermissions(roleId: string, permissionIds: string[]) {
    return await prisma.$transaction(async (tx) => {
      // Delete all existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      })

      // Add new permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        })
      }

      return { success: true }
    })
  }
}
