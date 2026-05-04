import type { UserStatus } from '@nexus-prisma/generated/client'
import type { PaginatedList, PaginationQuery } from '@nexus/infra/database'
import type { UserBaseData, UserWhereInput } from './types'
import { prisma } from '@nexus/infra/database'
import { PrismaService } from '@nexus/infra/database/prisma.service'
import { USER_BASE_SELECT } from './constants'

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
   * 查询当前用户的邮箱密码账号。
   */
  static async findCredentialAccount(userId: string) {
    return prisma.account.findFirst({
      where: {
        providerId: 'credential',
        userId,
      },
      select: {
        id: true,
        password: true,
      },
    })
  }

  /**
   * 创建或更新当前用户的邮箱密码账号。
   */
  static async upsertCredentialPassword(userId: string, password: string) {
    const account = await this.findCredentialAccount(userId)

    if (account) {
      return prisma.account.update({
        where: {
          id: account.id,
        },
        data: {
          password,
        },
      })
    }

    return prisma.account.create({
      data: {
        accountId: userId,
        id: crypto.randomUUID(),
        password,
        providerId: 'credential',
        userId,
      },
    })
  }

  /**
   * 删除当前用户的其他会话。
   */
  static async deleteOtherSessions(userId: string, currentSessionId: string) {
    await prisma.session.deleteMany({
      where: {
        userId,
        id: {
          not: currentSessionId,
        },
      },
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
