import { z } from "zod";

/**
 * 创建分页列表 Schema。
 */
export function createPaginatedListSchema<TItem extends z.ZodTypeAny>(
  itemSchema: TItem,
) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });
}

export type PaginatedList<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
