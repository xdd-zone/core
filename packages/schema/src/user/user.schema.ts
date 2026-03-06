import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { UserStatus } from "../auth/auth.schema";
import type { PaginationMeta } from "../shared/pagination";
import { createSchema } from "../standard/standard-schema";

/**
 * 用户 ID 路由参数
 * 用于 /users/:id 等路径参数
 */
export type UserIdParams = { id: string };

export const UserIdParamsSchema = createSchema<{ id: string }, UserIdParams>({
  validate: (value) => {
    const input = value as { id: string } | undefined;
    if (!input || typeof input.id !== "string" || input.id.length === 0) {
      return {
        success: false,
        errors: [{ message: "id must be a non-empty string" }],
      } as unknown as StandardSchemaV1.Result<UserIdParams>;
    }
    return {
      success: true,
      value: input,
    } as unknown as StandardSchemaV1.Result<UserIdParams>;
  },
});

/**
 * 用户详情响应
 * 单个用户的完整信息，用于 GET /users/:id 接口
 */
export type UserResponse = {
  id: string;
  username: string | null;
  name: string;
  email: string | null;
  emailVerified: boolean | null;
  emailVerifiedAt: string | Date | null;
  introduce: string | null;
  image: string | null;
  phone: string | null;
  phoneVerified: boolean | null;
  phoneVerifiedAt: string | Date | null;
  lastLogin: string | Date | null;
  lastLoginIp: string | null;
  status: UserStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
};

export const UserResponseSchema = createSchema<
  {
    id: string;
    username: string | null;
    name: string;
    email: string | null;
    emailVerified: boolean | null;
    emailVerifiedAt: string | Date | null;
    introduce: string | null;
    image: string | null;
    phone: string | null;
    phoneVerified: boolean | null;
    phoneVerifiedAt: string | Date | null;
    lastLogin: string | Date | null;
    lastLoginIp: string | null;
    status: UserStatus;
    createdAt: string | Date;
    updatedAt: string | Date;
    deletedAt: string | Date | null;
  },
  UserResponse
>({
  validate: (value) => {
    const input = value as UserResponse | undefined;
    if (!input || typeof input !== "object") {
      return {
        success: false,
        errors: [{ message: "Invalid user response" }],
      } as unknown as StandardSchemaV1.Result<UserResponse>;
    }

    const errors: StandardSchemaV1.Issue[] = [];

    if (typeof input.id !== "string") {
      errors.push({ message: "id must be a string" });
    }
    if (input.username !== null && typeof input.username !== "string") {
      errors.push({ message: "username must be a string or null" });
    }
    if (typeof input.name !== "string") {
      errors.push({ message: "name must be a string" });
    }
    if (input.email !== null && typeof input.email !== "string") {
      errors.push({ message: "email must be a string or null" });
    }
    if (
      typeof input.status !== "string" ||
      !["ACTIVE", "INACTIVE", "BANNED"].includes(input.status)
    ) {
      errors.push({ message: "status must be ACTIVE, INACTIVE, or BANNED" });
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      } as unknown as StandardSchemaV1.Result<UserResponse>;
    }

    return {
      success: true,
      value: input,
    } as unknown as StandardSchemaV1.Result<UserResponse>;
  },
});

/**
 * 用户列表查询
 * 支持分页、状态过滤、关键字搜索、软删除查询
 * 过滤：status（用户状态）、keyword（用户名/邮箱/昵称）、includeDeleted（含删除）
 */
export type UserListQuery = {
  page?: number;
  pageSize?: number;
  status?: UserStatus;
  keyword?: string;
  includeDeleted?: boolean;
};

export const UserListQuerySchema = createSchema<
  {
    page?: number | string;
    pageSize?: number | string;
    status?: UserStatus;
    keyword?: string;
    includeDeleted?: boolean | string;
  },
  UserListQuery
>({
  validate: (value) => {
    const input = value as Record<string, unknown> | undefined;
    if (!input || typeof input !== "object") {
      return {
        success: false,
        errors: [{ message: "Invalid user list query" }],
      } as unknown as StandardSchemaV1.Result<UserListQuery>;
    }

    const errors: StandardSchemaV1.Issue[] = [];

    // Parse and validate page
    let page: number | undefined;
    if (input.page !== undefined) {
      const parsed =
        typeof input.page === "string"
          ? parseInt(input.page, 10)
          : Number(input.page);
      if (isNaN(parsed) || parsed < 1) {
        errors.push({ message: "page must be a positive number" });
      } else {
        page = parsed;
      }
    }

    // Parse and validate pageSize
    let pageSize: number | undefined;
    if (input.pageSize !== undefined) {
      const parsed =
        typeof input.pageSize === "string"
          ? parseInt(input.pageSize, 10)
          : Number(input.pageSize);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        errors.push({ message: "pageSize must be between 1 and 100" });
      } else {
        pageSize = parsed;
      }
    }

    // Validate status
    let status: UserStatus | undefined;
    if (input.status !== undefined) {
      if (!["ACTIVE", "INACTIVE", "BANNED"].includes(input.status as string)) {
        errors.push({ message: "status must be ACTIVE, INACTIVE, or BANNED" });
      } else {
        status = input.status as UserStatus;
      }
    }

    // Validate keyword
    let keyword: string | undefined;
    if (input.keyword !== undefined) {
      if (typeof input.keyword !== "string") {
        errors.push({ message: "keyword must be a string" });
      } else {
        keyword = input.keyword;
      }
    }

    // Parse includeDeleted
    let includeDeleted: boolean | undefined;
    if (input.includeDeleted !== undefined) {
      if (typeof input.includeDeleted === "string") {
        includeDeleted = input.includeDeleted === "true";
      } else if (typeof input.includeDeleted === "boolean") {
        includeDeleted = input.includeDeleted;
      } else {
        errors.push({ message: "includeDeleted must be a boolean" });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      } as unknown as StandardSchemaV1.Result<UserListQuery>;
    }

    const result: UserListQuery = {
      ...(page !== undefined && { page }),
      ...(pageSize !== undefined && { pageSize }),
      ...(status !== undefined && { status }),
      ...(keyword !== undefined && { keyword }),
      ...(includeDeleted !== undefined && { includeDeleted }),
    };

    return {
      success: true,
      value: result,
    } as unknown as StandardSchemaV1.Result<UserListQuery>;
  },
});

/**
 * 用户列表响应
 * 返回用户数组和分页信息，用于 GET /users 接口
 */
export type UserListResponse = {
  list: UserResponse[];
  pagination: PaginationMeta;
};

export const UserListResponseSchema = createSchema<
  { list: UserResponse[]; pagination: PaginationMeta },
  UserListResponse
>({
  validate: (value) => {
    const input = value as UserListResponse | undefined;
    if (!input || typeof input !== "object") {
      return {
        success: false,
        errors: [{ message: "Invalid user list response" }],
      } as unknown as StandardSchemaV1.Result<UserListResponse>;
    }

    const errors: StandardSchemaV1.Issue[] = [];

    if (!Array.isArray(input.list)) {
      errors.push({ message: "list must be an array" });
    }

    if (!input.pagination || typeof input.pagination !== "object") {
      errors.push({ message: "pagination must be an object" });
    } else {
      const p = input.pagination;
      if (
        typeof p.currentPage !== "number" ||
        typeof p.total !== "number" ||
        typeof p.size !== "number" ||
        typeof p.totalPage !== "number"
      ) {
        errors.push({
          message: "pagination must contain valid numeric fields",
        });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      } as unknown as StandardSchemaV1.Result<UserListResponse>;
    }

    return {
      success: true,
      value: input,
    } as unknown as StandardSchemaV1.Result<UserListResponse>;
  },
});

/**
 * 创建用户请求
 * 必填：name（显示名称）
 * 选填：username（用户名）、email（邮箱）、phone（手机）、introduce（简介）、image（头像）、status（状态）
 */
export type CreateUserBody = {
  username?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  introduce?: string | null;
  image?: string | null;
  status?: UserStatus;
};

export const CreateUserBodySchema = createSchema<
  {
    username?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    introduce?: string | null;
    image?: string | null;
    status?: UserStatus;
  },
  CreateUserBody
>({
  validate: (value) => {
    const input = value as CreateUserBody | undefined;
    if (!input || typeof input !== "object") {
      return {
        success: false,
        errors: [{ message: "Invalid create user body" }],
      } as unknown as StandardSchemaV1.Result<CreateUserBody>;
    }

    const errors: StandardSchemaV1.Issue[] = [];

    // Validate name (required)
    if (typeof input.name !== "string" || input.name.length === 0) {
      errors.push({ message: "name is required" });
    } else if (input.name.length > 100) {
      errors.push({ message: "name must be at most 100 characters" });
    }

    // Validate username (optional)
    if (input.username !== undefined && input.username !== null) {
      if (typeof input.username !== "string") {
        errors.push({ message: "username must be a string" });
      } else if (input.username.length < 3 || input.username.length > 50) {
        errors.push({
          message: "username must be between 3 and 50 characters",
        });
      }
    }

    // Validate email (optional)
    if (input.email !== undefined && input.email !== null) {
      if (typeof input.email !== "string") {
        errors.push({ message: "email must be a string" });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
        errors.push({ message: "email must be a valid email address" });
      }
    }

    // Validate phone (optional)
    if (input.phone !== undefined && input.phone !== null) {
      if (typeof input.phone !== "string") {
        errors.push({ message: "phone must be a string" });
      } else if (input.phone.length > 20) {
        errors.push({ message: "phone must be at most 20 characters" });
      }
    }

    // Validate introduce (optional)
    if (input.introduce !== undefined && input.introduce !== null) {
      if (typeof input.introduce !== "string") {
        errors.push({ message: "introduce must be a string" });
      } else if (input.introduce.length > 500) {
        errors.push({ message: "introduce must be at most 500 characters" });
      }
    }

    // Validate image (optional)
    if (input.image !== undefined && input.image !== null) {
      if (typeof input.image !== "string") {
        errors.push({ message: "image must be a string" });
      } else {
        try {
          new URL(input.image);
        } catch {
          errors.push({ message: "image must be a valid URL" });
        }
      }
    }

    // Validate status (optional)
    if (input.status !== undefined) {
      if (!["ACTIVE", "INACTIVE", "BANNED"].includes(input.status)) {
        errors.push({ message: "status must be ACTIVE, INACTIVE, or BANNED" });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      } as unknown as StandardSchemaV1.Result<CreateUserBody>;
    }

    return {
      success: true,
      value: input,
    } as unknown as StandardSchemaV1.Result<CreateUserBody>;
  },
});

/**
 * 更新用户请求
 * 所有字段均为可选，用于 PATCH /users/:id 接口
 * 可更新：username、name、email、phone、introduce、image、status
 */
export type UpdateUserBody = {
  username?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  introduce?: string | null;
  image?: string | null;
  status?: UserStatus;
};

export const UpdateUserBodySchema = createSchema<
  {
    username?: string | null;
    name?: string;
    email?: string | null;
    phone?: string | null;
    introduce?: string | null;
    image?: string | null;
    status?: UserStatus;
  },
  UpdateUserBody
>({
  validate: (value) => {
    const input = value as UpdateUserBody | undefined;
    if (!input || typeof input !== "object") {
      return {
        success: false,
        errors: [{ message: "Invalid update user body" }],
      } as unknown as StandardSchemaV1.Result<UpdateUserBody>;
    }

    const errors: StandardSchemaV1.Issue[] = [];

    // Validate name (optional)
    if (input.name !== undefined) {
      if (typeof input.name !== "string" || input.name.length === 0) {
        errors.push({ message: "name must be a non-empty string" });
      } else if (input.name.length > 100) {
        errors.push({ message: "name must be at most 100 characters" });
      }
    }

    // Validate username (optional)
    if (input.username !== undefined && input.username !== null) {
      if (typeof input.username !== "string") {
        errors.push({ message: "username must be a string" });
      } else if (input.username.length < 3 || input.username.length > 50) {
        errors.push({
          message: "username must be between 3 and 50 characters",
        });
      }
    }

    // Validate email (optional)
    if (input.email !== undefined && input.email !== null) {
      if (typeof input.email !== "string") {
        errors.push({ message: "email must be a string" });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
        errors.push({ message: "email must be a valid email address" });
      }
    }

    // Validate phone (optional)
    if (input.phone !== undefined && input.phone !== null) {
      if (typeof input.phone !== "string") {
        errors.push({ message: "phone must be a string" });
      } else if (input.phone.length > 20) {
        errors.push({ message: "phone must be at most 20 characters" });
      }
    }

    // Validate introduce (optional)
    if (input.introduce !== undefined && input.introduce !== null) {
      if (typeof input.introduce !== "string") {
        errors.push({ message: "introduce must be a string" });
      } else if (input.introduce.length > 500) {
        errors.push({ message: "introduce must be at most 500 characters" });
      }
    }

    // Validate image (optional)
    if (input.image !== undefined && input.image !== null) {
      if (typeof input.image !== "string") {
        errors.push({ message: "image must be a string" });
      } else {
        try {
          new URL(input.image);
        } catch {
          errors.push({ message: "image must be a valid URL" });
        }
      }
    }

    // Validate status (optional)
    if (input.status !== undefined) {
      if (!["ACTIVE", "INACTIVE", "BANNED"].includes(input.status)) {
        errors.push({ message: "status must be ACTIVE, INACTIVE, or BANNED" });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      } as unknown as StandardSchemaV1.Result<UpdateUserBody>;
    }

    return {
      success: true,
      value: input,
    } as unknown as StandardSchemaV1.Result<UpdateUserBody>;
  },
});
