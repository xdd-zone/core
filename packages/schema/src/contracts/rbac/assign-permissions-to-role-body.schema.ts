import { z } from "zod";

export const AssignPermissionsToRoleBodySchema = z.object({
  permissionIds: z
    .array(z.string().min(1, "权限ID不能为空"))
    .min(1, "至少需要1个权限ID"),
});

export type AssignPermissionsToRoleBody = z.infer<
  typeof AssignPermissionsToRoleBodySchema
>;
