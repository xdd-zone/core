/**
 * RBAC Repository 层统一导出
 *
 * 说明：
 * - 提供 RBAC 模块的所有数据访问方法
 * - 封装 Prisma 查询，为 Service 层提供数据操作接口
 * - 包含角色、权限、角色权限关联、用户角色关联的 CRUD 操作
 *
 * @module repositories
 */

export * from './permission.repository'
export * from './role-permission.repository'
export * from './role.repository'
export * from './user-role.repository'
