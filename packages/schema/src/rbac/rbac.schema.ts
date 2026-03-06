import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * 角色列表查询
 * 支持分页、关键字搜索、包含系统角色过滤
 */
export interface RoleListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  includeSystem?: boolean;
}

export const RoleListQuerySchema: StandardSchemaV1<unknown, RoleListQuery> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<RoleListQuery>;
    types?: {
      input: unknown;
      output: RoleListQuery;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // page
      if (obj.page !== undefined) {
        const page = Number(obj.page);
        if (!Number.isInteger(page) || page < 1) {
          return {
            success: false as const,
            errors: [{ message: "page must be a positive integer" }],
          };
        }
      }

      // pageSize
      if (obj.pageSize !== undefined) {
        const pageSize = Number(obj.pageSize);
        if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
          return {
            success: false as const,
            errors: [{ message: "pageSize must be between 1 and 100" }],
          };
        }
      }

      // keyword
      if (obj.keyword !== undefined && typeof obj.keyword !== "string") {
        return {
          success: false as const,
          errors: [{ message: "keyword must be a string" }],
        };
      }

      // includeSystem
      if (
        obj.includeSystem !== undefined &&
        typeof obj.includeSystem !== "boolean"
      ) {
        return {
          success: false as const,
          errors: [{ message: "includeSystem must be a boolean" }],
        };
      }

      return {
        success: true as const,
        value: {
          page: obj.page !== undefined ? Number(obj.page) : undefined,
          pageSize:
            obj.pageSize !== undefined ? Number(obj.pageSize) : undefined,
          keyword: obj.keyword as string | undefined,
          includeSystem: obj.includeSystem as boolean | undefined,
        },
      };
    },
  },
} as never;

/**
 * 创建角色请求
 * 必填：name（角色标识）
 * 选填：displayName（显示名称）、description（描述）、parentId（父角色ID）
 */
export interface CreateRoleBody {
  name: string;
  displayName?: string;
  description?: string;
  parentId?: string;
}

export const CreateRoleBodySchema: StandardSchemaV1<unknown, CreateRoleBody> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<CreateRoleBody>;
    types?: {
      input: unknown;
      output: CreateRoleBody;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // name - required
      if (
        typeof obj.name !== "string" ||
        obj.name.length < 1 ||
        obj.name.length > 50
      ) {
        return {
          success: false as const,
          errors: [{ message: "name must be a string with 1-50 characters" }],
        };
      }

      // displayName - optional
      if (obj.displayName !== undefined) {
        if (
          typeof obj.displayName !== "string" ||
          obj.displayName.length < 1 ||
          obj.displayName.length > 100
        ) {
          return {
            success: false as const,
            errors: [
              { message: "displayName must be a string with 1-100 characters" },
            ],
          };
        }
      }

      // description - optional
      if (
        obj.description !== undefined &&
        typeof obj.description !== "string"
      ) {
        return {
          success: false as const,
          errors: [{ message: "description must be a string" }],
        };
      }

      // parentId - optional
      if (obj.parentId !== undefined && typeof obj.parentId !== "string") {
        return {
          success: false as const,
          errors: [{ message: "parentId must be a string" }],
        };
      }

      return {
        success: true as const,
        value: {
          name: obj.name,
          displayName: obj.displayName as string | undefined,
          description: obj.description as string | undefined,
          parentId: obj.parentId as string | undefined,
        },
      };
    },
  },
} as never;

/**
 * 更新角色请求
 * 所有字段均为可选，用于 PATCH /roles/:id
 * 可更新：displayName、description、parentId
 */
export interface UpdateRoleBody {
  displayName?: string;
  description?: string;
  parentId?: string | null;
}

export const UpdateRoleBodySchema: StandardSchemaV1<unknown, UpdateRoleBody> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<UpdateRoleBody>;
    types?: {
      input: unknown;
      output: UpdateRoleBody;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // displayName - optional
      if (obj.displayName !== undefined) {
        if (
          typeof obj.displayName !== "string" ||
          obj.displayName.length < 1 ||
          obj.displayName.length > 100
        ) {
          return {
            success: false as const,
            errors: [
              { message: "displayName must be a string with 1-100 characters" },
            ],
          };
        }
      }

      // description - optional
      if (
        obj.description !== undefined &&
        typeof obj.description !== "string"
      ) {
        return {
          success: false as const,
          errors: [{ message: "description must be a string" }],
        };
      }

      // parentId - optional, can be null
      if (
        obj.parentId !== undefined &&
        obj.parentId !== null &&
        typeof obj.parentId !== "string"
      ) {
        return {
          success: false as const,
          errors: [{ message: "parentId must be a string or null" }],
        };
      }

      return {
        success: true as const,
        value: {
          displayName: obj.displayName as string | undefined,
          description: obj.description as string | undefined,
          parentId: obj.parentId as string | null | undefined,
        },
      };
    },
  },
} as never;

/**
 * 设置父角色请求
 * 用于建立角色的层级关系，parentId 设为 null 可取消父角色
 */
export interface SetRoleParentBody {
  parentId: string | null;
}

export const SetRoleParentBodySchema: StandardSchemaV1<
  unknown,
  SetRoleParentBody
> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<SetRoleParentBody>;
    types?: {
      input: unknown;
      output: SetRoleParentBody;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // parentId - required, can be null
      if (obj.parentId !== null && typeof obj.parentId !== "string") {
        return {
          success: false as const,
          errors: [{ message: "parentId must be a string or null" }],
        };
      }

      return {
        success: true as const,
        value: {
          parentId: obj.parentId as string | null,
        },
      };
    },
  },
} as never;

/**
 * 角色 ID 路由参数
 * 用于 /roles/:id 等路径参数
 */
export interface RoleIdParams {
  id: string;
}

export const RoleIdParamsSchema: StandardSchemaV1<unknown, RoleIdParams> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<RoleIdParams>;
    types?: {
      input: unknown;
      output: RoleIdParams;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // id - required
      if (typeof obj.id !== "string") {
        return {
          success: false as const,
          errors: [{ message: "id must be a string" }],
        };
      }

      return {
        success: true as const,
        value: {
          id: obj.id,
        },
      };
    },
  },
} as never;

/**
 * 权限列表查询
 * 支持分页、按资源类型过滤
 */
export interface PermissionListQuery {
  page?: number;
  pageSize?: number;
  resource?: string;
}

export const PermissionListQuerySchema: StandardSchemaV1<
  unknown,
  PermissionListQuery
> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<PermissionListQuery>;
    types?: {
      input: unknown;
      output: PermissionListQuery;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // page
      if (obj.page !== undefined) {
        const page = Number(obj.page);
        if (!Number.isInteger(page) || page < 1) {
          return {
            success: false as const,
            errors: [{ message: "page must be a positive integer" }],
          };
        }
      }

      // pageSize
      if (obj.pageSize !== undefined) {
        const pageSize = Number(obj.pageSize);
        if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
          return {
            success: false as const,
            errors: [{ message: "pageSize must be between 1 and 100" }],
          };
        }
      }

      // resource - optional
      if (obj.resource !== undefined && typeof obj.resource !== "string") {
        return {
          success: false as const,
          errors: [{ message: "resource must be a string" }],
        };
      }

      return {
        success: true as const,
        value: {
          page: obj.page !== undefined ? Number(obj.page) : undefined,
          pageSize:
            obj.pageSize !== undefined ? Number(obj.pageSize) : undefined,
          resource: obj.resource as string | undefined,
        },
      };
    },
  },
} as never;

/**
 * 创建权限请求
 * 必填：resource（资源）、action（操作）
 * 选填：scope（权限范围：空/own/all）、displayName、description
 */
export interface CreatePermissionBody {
  resource: string;
  action: string;
  scope?: "" | "own" | "all";
  displayName?: string;
  description?: string;
}

export const CreatePermissionBodySchema: StandardSchemaV1<
  unknown,
  CreatePermissionBody
> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<CreatePermissionBody>;
    types?: {
      input: unknown;
      output: CreatePermissionBody;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // resource - required
      if (
        typeof obj.resource !== "string" ||
        obj.resource.length < 1 ||
        obj.resource.length > 50
      ) {
        return {
          success: false as const,
          errors: [
            { message: "resource must be a string with 1-50 characters" },
          ],
        };
      }

      // action - required
      if (
        typeof obj.action !== "string" ||
        obj.action.length < 1 ||
        obj.action.length > 50
      ) {
        return {
          success: false as const,
          errors: [{ message: "action must be a string with 1-50 characters" }],
        };
      }

      // scope - optional, must be one of "", "own", "all"
      if (obj.scope !== undefined) {
        if (obj.scope !== "" && obj.scope !== "own" && obj.scope !== "all") {
          return {
            success: false as const,
            errors: [{ message: "scope must be one of: '', 'own', 'all'" }],
          };
        }
      }

      // displayName - optional
      if (obj.displayName !== undefined) {
        if (
          typeof obj.displayName !== "string" ||
          obj.displayName.length < 1 ||
          obj.displayName.length > 100
        ) {
          return {
            success: false as const,
            errors: [
              { message: "displayName must be a string with 1-100 characters" },
            ],
          };
        }
      }

      // description - optional
      if (
        obj.description !== undefined &&
        typeof obj.description !== "string"
      ) {
        return {
          success: false as const,
          errors: [{ message: "description must be a string" }],
        };
      }

      return {
        success: true as const,
        value: {
          resource: obj.resource,
          action: obj.action,
          scope: obj.scope as "" | "own" | "all" | undefined,
          displayName: obj.displayName as string | undefined,
          description: obj.description as string | undefined,
        },
      };
    },
  },
} as never;

/**
 * 权限 ID 路由参数
 * 用于 /permissions/:id 等路径参数
 */
export interface PermissionIdParams {
  id: string;
}

export const PermissionIdParamsSchema: StandardSchemaV1<
  unknown,
  PermissionIdParams
> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<PermissionIdParams>;
    types?: {
      input: unknown;
      output: PermissionIdParams;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // id - required
      if (typeof obj.id !== "string") {
        return {
          success: false as const,
          errors: [{ message: "id must be a string" }],
        };
      }

      return {
        success: true as const,
        value: {
          id: obj.id,
        },
      };
    },
  },
} as never;

/**
 * 分配角色给用户请求
 * 必填：roleId（角色ID）
 */
export interface AssignRoleToUserBody {
  roleId: string;
}

export const AssignRoleToUserBodySchema: StandardSchemaV1<
  unknown,
  AssignRoleToUserBody
> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<AssignRoleToUserBody>;
    types?: {
      input: unknown;
      output: AssignRoleToUserBody;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // roleId - required
      if (typeof obj.roleId !== "string") {
        return {
          success: false as const,
          errors: [{ message: "roleId must be a string" }],
        };
      }

      return {
        success: true as const,
        value: {
          roleId: obj.roleId,
        },
      };
    },
  },
} as never;

/**
 * 分配权限给角色请求
 * 必填：permissionIds（权限ID数组，至少1个）
 */
export interface AssignPermissionsToRoleBody {
  permissionIds: string[];
}

export const AssignPermissionsToRoleBodySchema: StandardSchemaV1<
  unknown,
  AssignPermissionsToRoleBody
> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (
      value: unknown,
    ) => StandardSchemaV1.Result<AssignPermissionsToRoleBody>;
    types?: {
      input: unknown;
      output: AssignPermissionsToRoleBody;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // permissionIds - required, array with at least 1 item
      if (!Array.isArray(obj.permissionIds)) {
        return {
          success: false as const,
          errors: [{ message: "permissionIds must be an array" }],
        };
      }
      if (obj.permissionIds.length < 1) {
        return {
          success: false as const,
          errors: [{ message: "permissionIds must have at least 1 item" }],
        };
      }
      for (const id of obj.permissionIds) {
        if (typeof id !== "string") {
          return {
            success: false as const,
            errors: [{ message: "permissionIds must contain only strings" }],
          };
        }
      }

      return {
        success: true as const,
        value: {
          permissionIds: obj.permissionIds,
        },
      };
    },
  },
} as never;

/**
 * 替换角色权限请求
 * 批量替换角色的所有权限（覆盖式）
 */
export interface ReplaceRolePermissionsBody {
  permissionIds: string[];
}

export const ReplaceRolePermissionsBodySchema: StandardSchemaV1<
  unknown,
  ReplaceRolePermissionsBody
> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (
      value: unknown,
    ) => StandardSchemaV1.Result<ReplaceRolePermissionsBody>;
    types?: {
      input: unknown;
      output: ReplaceRolePermissionsBody;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // permissionIds - required, array
      if (!Array.isArray(obj.permissionIds)) {
        return {
          success: false as const,
          errors: [{ message: "permissionIds must be an array" }],
        };
      }
      for (const id of obj.permissionIds) {
        if (typeof id !== "string") {
          return {
            success: false as const,
            errors: [{ message: "permissionIds must contain only strings" }],
          };
        }
      }

      return {
        success: true as const,
        value: {
          permissionIds: obj.permissionIds,
        },
      };
    },
  },
} as never;

/**
 * 用户 ID 路由参数（RBAC）
 * 用于 /rbac/users/:userId 等路径参数
 */
export interface RBACUserIdParams {
  userId: string;
}

export const RBACUserIdParamsSchema: StandardSchemaV1<
  unknown,
  RBACUserIdParams
> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<RBACUserIdParams>;
    types?: {
      input: unknown;
      output: RBACUserIdParams;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // userId - required
      if (typeof obj.userId !== "string") {
        return {
          success: false as const,
          errors: [{ message: "userId must be a string" }],
        };
      }

      return {
        success: true as const,
        value: {
          userId: obj.userId,
        },
      };
    },
  },
} as never;

/**
 * 用户-角色 ID 路由参数
 * 用于 /rbac/users/:userId/roles/:roleId 等路径参数
 */
export interface UserRoleIdParams {
  userId: string;
  roleId: string;
}

export const UserRoleIdParamsSchema: StandardSchemaV1<
  unknown,
  UserRoleIdParams
> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (value: unknown) => StandardSchemaV1.Result<UserRoleIdParams>;
    types?: {
      input: unknown;
      output: UserRoleIdParams;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // userId - required
      if (typeof obj.userId !== "string") {
        return {
          success: false as const,
          errors: [{ message: "userId must be a string" }],
        };
      }

      // roleId - required
      if (typeof obj.roleId !== "string") {
        return {
          success: false as const,
          errors: [{ message: "roleId must be a string" }],
        };
      }

      return {
        success: true as const,
        value: {
          userId: obj.userId,
          roleId: obj.roleId,
        },
      };
    },
  },
} as never;

/**
 * 角色-权限 ID 路由参数
 * 用于 /roles/:id/permissions/:permissionId 等路径参数
 */
export interface RolePermissionIdParams {
  id: string;
  permissionId: string;
}

export const RolePermissionIdParamsSchema: StandardSchemaV1<
  unknown,
  RolePermissionIdParams
> & {
  "~standard": {
    version: 1;
    vendor: "xdd-zone";
    validate: (
      value: unknown,
    ) => StandardSchemaV1.Result<RolePermissionIdParams>;
    types?: {
      input: unknown;
      output: RolePermissionIdParams;
    };
  };
} = {
  "~standard": {
    version: 1,
    vendor: "xdd-zone",
    validate: (value: unknown) => {
      if (typeof value !== "object" || value === null) {
        return {
          success: false as const,
          errors: [{ message: "Expected object" }],
        };
      }
      const obj = value as Record<string, unknown>;

      // id - required
      if (typeof obj.id !== "string") {
        return {
          success: false as const,
          errors: [{ message: "id must be a string" }],
        };
      }

      // permissionId - required
      if (typeof obj.permissionId !== "string") {
        return {
          success: false as const,
          errors: [{ message: "permissionId must be a string" }],
        };
      }

      return {
        success: true as const,
        value: {
          id: obj.id,
          permissionId: obj.permissionId,
        },
      };
    },
  },
} as never;
