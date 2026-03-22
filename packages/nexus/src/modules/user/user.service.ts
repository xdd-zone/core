import type { UpdateMyProfileBody, UpdateUserBody, User, UserList, UserListQuery, UserStatus } from './user.contract'
import type { UserWhereInput } from './user.types'
import { NotFoundError } from '@/core/http'
import { buildKeywordSearch } from '@/infra/database'
import { USER_SEARCH_FIELDS } from './user.constants'
import { UserListSchema, UserSchema } from './user.contract'
import { UserRepository } from './user.repository'

/**
 * 用户服务类。
 */
export class UserService {
  /**
   * 构建用户列表查询条件。
   */
  private static buildWhereConditions(query: UserListQuery): UserWhereInput {
    const where: UserWhereInput = {}

    if (query.status) {
      where.status = query.status
    }

    const keywordSearch = buildKeywordSearch(query.keyword, [...USER_SEARCH_FIELDS])
    if (keywordSearch) {
      where.OR = keywordSearch
    }

    return where
  }

  /**
   * 获取后台用户列表。
   */
  static async list(query: UserListQuery): Promise<UserList> {
    return UserListSchema.parse(await UserRepository.paginate(this.buildWhereConditions(query), query))
  }

  /**
   * 获取指定用户详情。
   */
  static async findById(id: string): Promise<User> {
    const user = await UserRepository.findById(id)
    if (!user) {
      throw new NotFoundError('用户不存在')
    }

    return UserSchema.parse(user)
  }

  /**
   * 获取当前用户资料。
   */
  static async getProfile(userId: string): Promise<User> {
    return this.findById(userId)
  }

  /**
   * 更新当前用户资料。
   */
  static async updateProfile(userId: string, data: UpdateMyProfileBody): Promise<User> {
    await this.findById(userId)

    return UserSchema.parse(
      await UserRepository.updateProfile(userId, {
        username: data.username ?? undefined,
        name: data.name,
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
        introduce: data.introduce ?? undefined,
        image: data.image ?? undefined,
      }),
    )
  }

  /**
   * 后台更新指定用户基础资料。
   */
  static async updateByAdmin(userId: string, data: UpdateUserBody): Promise<User> {
    return this.updateProfile(userId, data)
  }

  /**
   * 后台更新指定用户状态。
   */
  static async updateStatus(userId: string, status: UserStatus): Promise<User> {
    await this.findById(userId)

    return UserSchema.parse(await UserRepository.updateStatus(userId, status))
  }
}
