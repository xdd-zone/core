import { z } from "zod";
import { intFromQuery } from "../../shared/utils/schema-helpers";

export const PermissionListQuerySchema = z.object({
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
  resource: z.string().optional(),
});

export type PermissionListQuery = z.infer<typeof PermissionListQuerySchema>;
