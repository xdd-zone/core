import { z } from "zod";

export const UserRoleIdParamsSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
  roleId: z.string().min(1, "角色ID不能为空"),
});

export type UserRoleIdParams = z.infer<typeof UserRoleIdParamsSchema>;
