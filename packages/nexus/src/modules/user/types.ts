import type { Prisma } from '@nexus/infra/database/prisma/generated/client'
import type { USER_BASE_SELECT } from './constants'

/**
 * 用户基础数据。
 */
export type UserBaseData = Prisma.UserGetPayload<{
  select: typeof USER_BASE_SELECT
}>

/**
 * 用户查询条件。
 */
export type UserWhereInput = Prisma.UserWhereInput

/**
 * 用户创建数据。
 */
export type UserCreateInput = Prisma.UserCreateInput

/**
 * 用户更新数据。
 */
export type UserUpdateInput = Prisma.UserUpdateInput
