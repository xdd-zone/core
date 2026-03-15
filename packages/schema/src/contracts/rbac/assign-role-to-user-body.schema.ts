import { z } from "zod";

export const AssignRoleToUserBodySchema = z.object({
  roleId: z.string().min(1, "角色ID不能为空"),
});

export type AssignRoleToUserBody = z.infer<typeof AssignRoleToUserBodySchema>;
