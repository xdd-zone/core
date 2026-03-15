import { z } from "zod";

export const ReplaceRolePermissionsBodySchema = z.object({
  permissionIds: z.array(z.string().min(1, "权限ID不能为空")),
});

export type ReplaceRolePermissionsBody = z.infer<
  typeof ReplaceRolePermissionsBodySchema
>;
