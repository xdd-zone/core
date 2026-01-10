export * from './helpers'
// 延迟导出 PermissionService，避免循环依赖
// 使用时需要显式导入：import { PermissionService } from '@/core/permissions/permission.service'
export { PermissionService } from './permission.service'
export * from './permissions'

export * from './permissions.types'
