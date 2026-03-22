import type { UserBaseData, UserWhereInput } from './user.types'
import type { PaginatedList, PaginationQuery } from '@/infra/database'
import type { UserStatus } from '@/infra/database/prisma/generated'
import { prisma } from '@/infra/database'
import { PrismaService } from '@/infra/database/prisma.service'
import { USER_BASE_SELECT } from './user.constants'

function withActiveRecord(where: UserWhereInput = {}): UserWhereInput {
  return {
    ...where,
    deletedAt: null,
  }
}

/**
 * 用户仓储类。
 */
export class UserRepository {
  /**
   * 分页查询未归档用户。
   */
  static async paginate(where: UserWhereInput, query: PaginationQuery): Promise<PaginatedList<UserBaseData>> {
    return PrismaService.paginate<UserBaseData>('user', withActiveRecord(where), query, {
      select: USER_BASE_SELECT,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * 根据 ID 查询未归档用户。
   */
  static async findById(id: string): Promise<UserBaseData | null> {
    return prisma.user.findFirst({
      where: withActiveRecord({ id }),
      select: USER_BASE_SELECT,
    })
  }

  /**
   * 更新用户基础资料。
   */
  static async updateProfile(
    id: string,
    data: {
      username?: string | null
      name?: string
      email?: string | null
      phone?: string | null
      introduce?: string | null
      image?: string | null
    },
  ): Promise<UserBaseData> {
    return prisma.user.update({
      where: { id },
      data,
      select: USER_BASE_SELECT,
    })
  }

  /**
   * 更新用户状态。
   */
  static async updateStatus(id: string, status: UserStatus): Promise<UserBaseData> {
    return prisma.user.update({
      where: { id },
      data: { status },
      select: USER_BASE_SELECT,
    })
  }
}
