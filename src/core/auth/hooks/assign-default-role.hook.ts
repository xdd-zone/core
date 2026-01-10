import { prisma } from '@/infrastructure/database/client'
import { createModuleLogger } from '@/infrastructure/logger'
import { RbacService } from '@/modules/rbac/rbac.service'

const logger = createModuleLogger('auth:assign-default-role-hook')

/**
 * BetterAuth 数据库钩子，自动为用户分配默认角色
 *
 * 该钩子在数据库中创建用户后运行。它检查这是否是系统中的第一个用户，
 * 并自动分配相应的角色：
 * - 第一个用户：分配 superAdmin 角色（拥有所有权限）
 * - 后续用户：分配 user 角色（普通用户，只能管理自己的数据）
 *
 * @param user - 刚创建的用户对象
 * @param _context - BetterAuth 上下文（此钩子中未使用）
 */
export async function assignDefaultRoleToUser(user: Record<string, any>, _context: any) {
  try {
    // 检查是否为第一个用户（创建后的计数应该为 1）
    const userCount = await prisma.user.count()

    // 第一个用户 → 分配 superAdmin 角色
    if (userCount === 1) {
      const superAdminRole = await prisma.role.findUnique({
        where: { name: 'superAdmin' },
      })

      if (!superAdminRole) {
        logger.warn('未找到 superAdmin 角色 - 可能未运行种子数据')
        return
      }

      // 分配具有完全访问权限的 superAdmin 角色
      await RbacService.assignRoleToUser(user.id as string, superAdminRole.id, {})

      logger.info({ userId: user.id, email: user.email }, '第一个用户已分配 superAdmin 角色')
      return
    }

    // 后续用户 → 分配默认 user 角色
    const userRole = await prisma.role.findUnique({
      where: { name: 'user' },
    })

    if (!userRole) {
      logger.warn('未找到 user 角色 - 可能未运行种子数据')
      return
    }

    // 分配普通用户角色
    await RbacService.assignRoleToUser(user.id as string, userRole.id, {})

    logger.info({ userId: user.id, email: user.email }, '用户已分配默认 user 角色')
  } catch (error) {
    // 记录但不抛出错误 - 即使角色分配失败，注册也应该成功
    logger.error({ error, userId: user.id }, '角色分配失败')
  }
}
