import { z } from "zod";

const coercePositiveInt = (field: string) =>
  z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? value : parsed;
      }

      return value;
    },
    z
      .number()
      .int(`${field} 必须是整数`)
      .min(1, `${field} 必须大于 0`)
      .optional(),
  );

export const PaginationQuerySchema = z.object({
  page: coercePositiveInt("page").default(1),
  pageSize: coercePositiveInt("pageSize")
    .default(20)
    .pipe(z.number().max(100, "pageSize 不能超过 100")),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
