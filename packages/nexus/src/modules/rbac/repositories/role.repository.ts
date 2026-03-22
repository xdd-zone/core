import type { Prisma } from '@/infra/database/prisma/generated'
import { prisma } from '@/infra/database/client'

/**
 * 角色数据访问层。
 */
export class RoleRepository {
  /**
   * 分页查询角色列表。
   */
  static async findMany(where: Prisma.RoleWhereInput, skip: number, take: number) {
    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.role.count({ where }),
    ])

    return { roles, total }
  }

  /**
   * 根据 ID 查询角色。
   */
  static async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
    })
  }

  /**
   * 根据名称查询角色。
   */
  static async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
    })
  }
}
