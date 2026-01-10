/**
 * User Service
 * 业务逻辑层：处理用户相关的业务逻辑
 */

import type { CreateUserBody, UpdateUserBody, UserListQuery, UserListResponse, UserResponse } from './user.model'

import type { UserWhereInput } from './user.types'
import { buildKeywordSearch } from '@/infrastructure/database'
import { DEFAULT_USER_STATUS, USER_SEARCH_FIELDS } from './user.constants'
import { UserRepository } from './user.repository'

/**
 * 用户服务类
 * 说明：处理用户相关的业务逻辑，协调 Repository 层和控制器层
 *
 * 注意：Date 字段的转换由 Prisma 中间件自动处理
 */
export class UserService {
  /**
   * 构建查询条件
   * @param query 查询参数
   * @returns Prisma where 条件
   */
  private static buildWhereConditions(query: UserListQuery): UserWhereInput {
    const where: UserWhereInput = {}

    // 状态过滤
    if (query.status) {
      where.status = query.status
    }

    // 关键字搜索（用户名、邮箱、昵称）
    const keywordSearch = buildKeywordSearch(query.keyword, [...USER_SEARCH_FIELDS])
    if (keywordSearch) {
      where.OR = keywordSearch
    }

    return where
  }

  /**
   * 获取用户列表（支持分页、关键字搜索、状态过滤、软删除过滤）
   * @param query 查询参数
   * @returns 分页用户列表
   */
  static async list(query: UserListQuery): Promise<UserListResponse> {
    // 构建查询条件
    const where = this.buildWhereConditions(query)

    // 使用通用分页方法查询（Date 字段已由中间件自动转换）
    return await UserRepository.paginate(where, query)
  }

  /**
   * 根据 ID 获取用户信息
   * @param id 用户 ID
   * @returns 用户信息或 null
   */
  static async findById(id: string): Promise<UserResponse | null> {
    return await UserRepository.findById(id)
  }

  /**
   * 创建用户
   * @param data 用户数据
   * @returns 创建的用户信息
   */
  static async create(data: CreateUserBody): Promise<UserResponse> {
    return await UserRepository.create({
      username: data.username,
      name: data.name,
      email: data.email,
      phone: data.phone,
      introduce: data.introduce,
      image: data.image,
      status: data.status ?? DEFAULT_USER_STATUS,
    })
  }

  /**
   * 更新用户信息
   * @param id 用户 ID
   * @param data 更新数据
   * @returns 更新后的用户信息
   */
  static async update(id: string, data: UpdateUserBody): Promise<UserResponse> {
    return await UserRepository.update(id, {
      username: data.username ?? undefined,
      name: data.name,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      introduce: data.introduce ?? undefined,
      image: data.image ?? undefined,
      status: data.status,
    })
  }

  /**
   * 删除用户
   * @param id 用户 ID
   * @returns 被删除的用户信息
   */
  static async delete(id: string): Promise<UserResponse> {
    return await UserRepository.delete(id)
  }
}
