import { z } from "zod";
import { booleanish, intFromQuery } from "../../shared/utils/schema-helpers";

export const RoleListQuerySchema = z.object({
  page: intFromQuery("页码必须是整数").pipe(
    z.number().min(1, "页码必须大于0").optional(),
  ),
  pageSize: intFromQuery("每页数量必须是整数").pipe(
    z
      .number()
      .min(1, "每页数量必须大于0")
      .max(100, "每页数量不能超过100")
      .optional(),
  ),
  keyword: z.string().optional(),
  includeSystem: booleanish(),
});

export type RoleListQuery = z.infer<typeof RoleListQuerySchema>;
