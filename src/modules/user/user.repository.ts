/**
 * User Repository
 * 数据访问层：封装所有与用户相关的数据库操作
 */

import type { UserBaseData, UserWhereInput } from './user.types'
import type { PaginatedList, PaginationQuery } from '@/infra/database'
import type { UserStatus } from '@/infra/database/prisma/generated'
import { prisma } from '@/infra/database'
import { PrismaService } from '@/infra/database/prisma.service'
import { USER_BASE_SELECT } from './user.constants'

/**
 * 用户仓储类
 * 说明：封装 Prisma 操作，提供类型安全的数据访问接口
 */
export class UserRepository {
  /**
   * 查询用户列表
   * @param where 查询条件
   * @param skip 跳过记录数
   * @param take 获取记录数
   * @returns 用户列表
   */
  static async findMany(where: UserWhereInput, skip: number, take: number): Promise<UserBaseData[]> {
    return prisma.user.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take,
      select: USER_BASE_SELECT,
    })
  }

  /**
   * 统计用户数量
   * @param where 查询条件
   * @returns 用户总数
   */
  static async count(where: UserWhereInput): Promise<number> {
    return prisma.user.count({ where })
  }

  /**
   * 分页查询用户列表
   * @param where 查询条件
   * @param query 分页参数
   * @returns 分页用户列表
   */
  static async paginate(where: UserWhereInput, query: PaginationQuery): Promise<PaginatedList<UserBaseData>> {
    return PrismaService.paginate<UserBaseData>('user', where, query, {
      select: USER_BASE_SELECT,
      orderBy: { id: 'desc' },
    })
  }

  /**
   * 根据 ID 查询单个用户
   * @param id 用户 ID
   * @param where 额外查询条件（如软删除过滤）
   * @returns 用户信息或 null
   */
  static async findById(id: string, where?: Omit<UserWhereInput, 'id'>): Promise<UserBaseData | null> {
    return prisma.user.findFirst({
      where: { id, ...where },
      select: USER_BASE_SELECT,
    })
  }

  /**
   * 创建用户
   * @param data 用户数据
   * @returns 创建的用户信息
   */
  static async create(data: {
    username?: string | null
    name: string
    email?: string | null
    phone?: string | null
    introduce?: string | null
    image?: string | null
    lastLogin?: Date | null
    lastLoginIp?: string | null
    status?: UserStatus
  }): Promise<UserBaseData> {
    return prisma.user.create({
      data,
      select: USER_BASE_SELECT,
    })
  }

  /**
   * 更新用户信息
   * @param id 用户 ID
   * @param data 更新数据
   * @returns 更新后的用户信息
   */
  static async update(
    id: string,
    data: {
      username?: string | null
      name?: string
      email?: string | null
      phone?: string | null
      introduce?: string | null
      image?: string | null
      lastLogin?: Date | null // 是否为自动记录?
      lastLoginIp?: string | null // 是否为自动记录?
      status?: UserStatus
    },
  ): Promise<UserBaseData> {
    return prisma.user.update({
      where: { id },
      data,
      select: USER_BASE_SELECT,
    })
  }

  /**
   * 删除用户（软删除）
   * @param id 用户 ID
   * @returns 被删除的用户信息
   */
  static async delete(id: string): Promise<UserBaseData> {
    return prisma.user.delete({
      where: { id },
      select: USER_BASE_SELECT,
    })
  }
}
