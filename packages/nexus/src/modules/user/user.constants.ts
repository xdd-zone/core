/**
 * User 模块常量
 * 定义用户模块相关的常量配置
 */

/**
 * 用户响应字段选择器
 * 说明：统一选择响应中需要返回的字段，避免返回敏感信息（如密码）
 */
export const USER_BASE_SELECT = {
  id: true,
  username: true,
  name: true,
  email: true,
  emailVerified: true,
  emailVerifiedAt: true,
  introduce: true,
  image: true,
  phone: true,
  phoneVerified: true,
  phoneVerifiedAt: true,
  lastLogin: true,
  lastLoginIp: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const

/**
 * 用户关键字搜索字段
 * 说明：定义支持关键字搜索的字段列表
 */
export const USER_SEARCH_FIELDS = ['username', 'email', 'name'] as const

/**
 * 默认用户状态
 */
export const DEFAULT_USER_STATUS = 'ACTIVE' as const
