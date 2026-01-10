/**
 * User 模块类型定义
 * 定义用户模块内部使用的 TypeScript 类型
 */

import type { USER_BASE_SELECT } from './user.constants'
import type { Prisma } from '@/infrastructure/database/prisma/generated/client'

/**
 * 用户基础数据类型（从数据库查询返回）
 * 基于 USER_BASE_SELECT 选择器生成的类型
 */
export type UserBaseData = Prisma.UserGetPayload<{
  select: typeof USER_BASE_SELECT
}>

/**
 * 用户查询条件类型
 */
export type UserWhereInput = Prisma.UserWhereInput

/**
 * 用户创建数据类型
 */
export type UserCreateInput = Prisma.UserCreateInput

/**
 * 用户更新数据类型
 */
export type UserUpdateInput = Prisma.UserUpdateInput
