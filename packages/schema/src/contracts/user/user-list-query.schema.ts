import { z } from "zod";
import { UserStatusSchema } from "../../domains/auth/user-status.schema";
import { booleanish, intFromQuery } from "../../shared/utils/schema-helpers";

export const UserListQuerySchema = z.object({
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
  status: UserStatusSchema.optional(),
  keyword: z.string().optional(),
  includeDeleted: booleanish(),
});

export type UserListQuery = z.infer<typeof UserListQuerySchema>;
