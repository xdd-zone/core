/**
 * RBAC 模块常量配置
 *
 * 说明：
 * - 定义系统角色名称
 *
 * @module rbac.constants
 */

/**
 * 系统内置角色名称列表
 *
 * 说明：
 * - 这些角色由系统初始化时创建
 * - 系统角色不允许删除
 * - 系统角色的 name 字段不允许修改
 *
 * @constant
 * @type {string[]}
 *
 * @example
 * ```ts
 * if (SYSTEM_ROLE_NAMES.includes(role.name)) {
 *   throw new ForbiddenError('系统角色不能删除')
 * }
 * ```
 */
export const SYSTEM_ROLE_NAMES = ['superAdmin', 'admin', 'user']
