import { prisma } from '@nexus/infra/database/client'

/**
 * 用户角色关联数据访问层。
 */
export class UserRoleRepository {
  /**
   * 查询用户的所有角色关联。
   */
  static async findByUser(userId: string) {
    return prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
      orderBy: { assignedAt: 'desc' },
    })
  }

  /**
   * 为用户分配角色。
   */
  static async assignRole(userId: string, roleId: string, assignedBy: string | null) {
    return prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
      },
      include: {
        role: true,
      },
    })
  }

  /**
   * 移除用户角色。
   */
  static async removeRole(userId: string, roleId: string) {
    return prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    })
  }

  /**
   * 查询用户及其角色与权限。
   */
  static async findUserWithRoles(userId: string) {
    return prisma.user.findUnique({
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
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    })
  }
}
