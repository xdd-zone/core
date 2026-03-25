/**
 * 用户响应字段选择器。
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
 * 用户关键字搜索字段。
 */
export const USER_SEARCH_FIELDS = ['username', 'email', 'name'] as const
