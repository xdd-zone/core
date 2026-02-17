import { z } from "zod";

/**
 * 角色列表查询
 * 支持分页、关键字搜索、包含系统角色过滤
 */
export const RoleListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  pageSize: z.coerce.number().int().positive().max(100).default(20).optional(),
  keyword: z.string().optional(),
  includeSystem: z.coerce.boolean().optional(),
});

export type RoleListQuery = z.infer<typeof RoleListQuerySchema>;

/**
 * 创建角色请求
 * 必填：name（角色标识）
 * 选填：displayName（显示名称）、description（描述）、parentId（父角色ID）
 */
export const CreateRoleBodySchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

export type CreateRoleBody = z.infer<typeof CreateRoleBodySchema>;

/**
 * 更新角色请求
 * 所有字段均为可选，用于 PATCH /roles/:id
 * 可更新：displayName、description、parentId
 */
export const UpdateRoleBodySchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export type UpdateRoleBody = z.infer<typeof UpdateRoleBodySchema>;

/**
 * 设置父角色请求
 * 用于建立角色的层级关系，parentId 设为 null 可取消父角色
 */
export const SetRoleParentBodySchema = z.object({
  parentId: z.string().nullable(),
});

export type SetRoleParentBody = z.infer<typeof SetRoleParentBodySchema>;

/**
 * 角色 ID 路由参数
 * 用于 /roles/:id 等路径参数
 */
export const RoleIdParamsSchema = z.object({
  id: z.string(),
});

export type RoleIdParams = z.infer<typeof RoleIdParamsSchema>;

/**
 * 权限列表查询
 * 支持分页、按资源类型过滤
 */
export const PermissionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  pageSize: z.coerce.number().int().positive().max(100).default(20).optional(),
  resource: z.string().optional(),
});

export type PermissionListQuery = z.infer<typeof PermissionListQuerySchema>;

/**
 * 创建权限请求
 * 必填：resource（资源）、action（操作）
 * 选填：scope（权限范围：空/own/all）、displayName、description
 */
export const CreatePermissionBodySchema = z.object({
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  scope: z.enum(["", "own", "all"]).optional(),
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export type CreatePermissionBody = z.infer<typeof CreatePermissionBodySchema>;

/**
 * 权限 ID 路由参数
 * 用于 /permissions/:id 等路径参数
 */
export const PermissionIdParamsSchema = z.object({
  id: z.string(),
});

export type PermissionIdParams = z.infer<typeof PermissionIdParamsSchema>;

/**
 * 分配角色给用户请求
 * 必填：roleId（角色ID）
 */
export const AssignRoleToUserBodySchema = z.object({
  roleId: z.string(),
});

export type AssignRoleToUserBody = z.infer<typeof AssignRoleToUserBodySchema>;

/**
 * 分配权限给角色请求
 * 必填：permissionIds（权限ID数组，至少1个）
 */
export const AssignPermissionsToRoleBodySchema = z.object({
  permissionIds: z.array(z.string()).min(1),
});

export type AssignPermissionsToRoleBody = z.infer<
  typeof AssignPermissionsToRoleBodySchema
>;

/**
 * 替换角色权限请求
 * 批量替换角色的所有权限（覆盖式）
 */
export const ReplaceRolePermissionsBodySchema = z.object({
  permissionIds: z.array(z.string()),
});

export type ReplaceRolePermissionsBody = z.infer<
  typeof ReplaceRolePermissionsBodySchema
>;

/**
 * 用户 ID 路由参数（RBAC）
 * 用于 /rbac/users/:userId 等路径参数
 */
export const RBACUserIdParamsSchema = z.object({
  userId: z.string(),
});

export type RBACUserIdParams = z.infer<typeof RBACUserIdParamsSchema>;

/**
 * 用户-角色 ID 路由参数
 * 用于 /rbac/users/:userId/roles/:roleId 等路径参数
 */
export const UserRoleIdParamsSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
});

export type UserRoleIdParams = z.infer<typeof UserRoleIdParamsSchema>;

/**
 * 角色-权限 ID 路由参数
 * 用于 /roles/:id/permissions/:permissionId 等路径参数
 */
export const RolePermissionIdParamsSchema = z.object({
  id: z.string(),
  permissionId: z.string(),
});

export type RolePermissionIdParams = z.infer<
  typeof RolePermissionIdParamsSchema
>;
