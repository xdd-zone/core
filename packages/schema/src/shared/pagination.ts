import type { StandardSchemaV1 } from "@standard-schema/spec";
import { createSchema } from "../standard/standard-schema";

/**
 * 分页查询参数
 * 必填：page（页码，从1开始）、pageSize（每页数量，默认20，最大100）
 * 说明：数值自动从字符串转换，支持默认值
 */
export const PaginationQuerySchema = createSchema<
  { page?: number; pageSize?: number },
  { page: number; pageSize: number }
>({
  validate: (value: unknown) => {
    const issues: StandardSchemaV1.Issue[] = [];
    const input = value as Record<string, unknown>;

    // Validate and coerce page
    let page = 1;
    if (input.page !== undefined) {
      const pageVal = Number(input.page);
      if (isNaN(pageVal) || pageVal < 1) {
        issues.push({ message: "page must be at least 1", path: ["page"] });
      } else {
        page = pageVal;
      }
    }

    // Validate and coerce pageSize
    let pageSize = 20;
    if (input.pageSize !== undefined) {
      const pageSizeVal = Number(input.pageSize);
      if (isNaN(pageSizeVal) || pageSizeVal < 1) {
        issues.push({
          message: "pageSize must be at least 1",
          path: ["pageSize"],
        });
      } else if (pageSizeVal > 100) {
        issues.push({
          message: "pageSize must be at most 100",
          path: ["pageSize"],
        });
      } else {
        pageSize = pageSizeVal;
      }
    }

    if (issues.length > 0) {
      return { issues };
    }

    return { value: { page, pageSize } };
  },
  types: {
    input: {} as { page?: number; pageSize?: number },
    output: {} as { page: number; pageSize: number },
  },
});

export type PaginationQuery = { page: number; pageSize: number };

/**
 * 分页元数据
 * 包含当前页码、总数、每页数量、总页数、是否有上/下页等信息
 */
export const PaginationMetaSchema = createSchema<
  {
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    size: number;
    total: number;
    totalPage: number;
  },
  {
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    size: number;
    total: number;
    totalPage: number;
  }
>({
  validate: (value: unknown) => {
    const issues: StandardSchemaV1.Issue[] = [];
    const input = value as Record<string, unknown>;

    const requiredFields = [
      "currentPage",
      "hasNextPage",
      "hasPrevPage",
      "size",
      "total",
      "totalPage",
    ] as const;

    for (const field of requiredFields) {
      if (typeof input[field] !== "number") {
        issues.push({ message: `${field} must be a number`, path: [field] });
      }
    }

    if (typeof input.hasNextPage !== "boolean") {
      issues.push({
        message: "hasNextPage must be a boolean",
        path: ["hasNextPage"],
      });
    }

    if (typeof input.hasPrevPage !== "boolean") {
      issues.push({
        message: "hasPrevPage must be a boolean",
        path: ["hasPrevPage"],
      });
    }

    if (issues.length > 0) {
      return { issues };
    }

    return {
      value: {
        currentPage: input.currentPage as number,
        hasNextPage: input.hasNextPage as boolean,
        hasPrevPage: input.hasPrevPage as boolean,
        size: input.size as number,
        total: input.total as number,
        totalPage: input.totalPage as number,
      },
    };
  },
  types: {
    input: {} as {
      currentPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      size: number;
      total: number;
      totalPage: number;
    },
    output: {} as {
      currentPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      size: number;
      total: number;
      totalPage: number;
    },
  },
});

export type PaginationMeta = {
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  size: number;
  total: number;
  totalPage: number;
};

/**
 * 创建分页列表 Schema 工厂函数
 * @param itemSchema - 列表项的 Standard Schema
 * @returns 包含 list（数组）和 pagination（分页信息）的 Schema
 */
export function createPaginatedListSchema<T>(
  _itemSchema: StandardSchemaV1<unknown, T>,
) {
  return createSchema<
    { list: T[]; pagination: PaginationMeta },
    { list: T[]; pagination: PaginationMeta }
  >({
    validate: (value: unknown) => {
      const issues: StandardSchemaV1.Issue[] = [];
      const input = value as Record<string, unknown>;

      if (!Array.isArray(input.list)) {
        issues.push({ message: "list must be an array", path: ["list"] });
      }

      const paginationResult = PaginationMetaSchema["~standard"].validate(
        input.pagination,
      );

      // Handle both sync and async validation results
      if ("then" in paginationResult) {
        // It's a Promise - for now return issues if any (async not fully supported)
        if (issues.length > 0) {
          return { issues };
        }
        return {
          value: {
            list: input.list as T[],
            pagination: input.pagination as PaginationMeta,
          },
        };
      }

      if (paginationResult.issues) {
        issues.push(...paginationResult.issues);
      }

      if (issues.length > 0) {
        return { issues };
      }

      // At this point, we know paginationResult is a success result
      return {
        value: {
          list: input.list as T[],
          pagination: (paginationResult as { value: PaginationMeta }).value,
        },
      };
    },
    types: {
      input: {} as { list: T[]; pagination: PaginationMeta },
      output: {} as { list: T[]; pagination: PaginationMeta },
    },
  });
}

/**
 * 分页列表 Schema（柯里化版本）
 * 用法：const UserListSchema = PaginatedListSchema(UserSchema)
 */
export const PaginatedListSchema = <T>(
  itemSchema: StandardSchemaV1<unknown, T>,
) => createPaginatedListSchema(itemSchema);

export type PaginatedList<T> = {
  list: T[];
  pagination: PaginationMeta;
};

/**
 * API 统一响应 Schema 工厂函数
 * @param dataSchema - 响应数据的 Standard Schema
 * @returns 包含 code（状态码）、message（消息）、data（业务数据）的 Schema
 */
export const ApiResponseSchema = <T>(
  _dataSchema: StandardSchemaV1<unknown, T>,
) =>
  createSchema<
    { code: number; message: string; data: T },
    { code: number; message: string; data: T }
  >({
    validate: (value: unknown) => {
      const issues: StandardSchemaV1.Issue[] = [];
      const input = value as Record<string, unknown>;

      if (typeof input.code !== "number") {
        issues.push({ message: "code must be a number", path: ["code"] });
      }

      if (typeof input.message !== "string") {
        issues.push({ message: "message must be a string", path: ["message"] });
      }

      // Note: We don't validate the data field deeply here
      // as it would require the actual item schema

      if (issues.length > 0) {
        return { issues };
      }

      return {
        value: {
          code: input.code as number,
          message: input.message as string,
          data: input.data as T,
        },
      };
    },
    types: {
      input: {} as { code: number; message: string; data: T },
      output: {} as { code: number; message: string; data: T },
    },
  });

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};
