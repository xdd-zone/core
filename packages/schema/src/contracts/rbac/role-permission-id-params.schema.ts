import { z } from "zod";

export const RolePermissionIdParamsSchema = z.object({
  id: z.string().min(1, "角色ID不能为空"),
  permissionId: z.string().min(1, "权限ID不能为空"),
});

export type RolePermissionIdParams = z.infer<
  typeof RolePermissionIdParamsSchema
>;
