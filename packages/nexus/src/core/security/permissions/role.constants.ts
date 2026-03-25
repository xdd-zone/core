/**
 * 固定系统角色名称。
 */
export const SYSTEM_ROLE_NAMES = ['superAdmin', 'admin', 'user'] as const

export type SystemRoleName = (typeof SYSTEM_ROLE_NAMES)[number]

/**
 * 默认注册角色。
 */
export const DEFAULT_ROLE_NAME: SystemRoleName = 'user'

/**
 * 首个用户默认角色。
 */
export const FIRST_USER_ROLE_NAME: SystemRoleName = 'superAdmin'
