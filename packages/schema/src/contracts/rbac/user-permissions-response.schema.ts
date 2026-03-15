import { z } from "zod";
import { PermissionStringSchema } from "../../domains/rbac/permission.schema";

export const UserPermissionsSchema = z.object({
  permissions: z.array(PermissionStringSchema),
});

export type UserPermissions = z.infer<typeof UserPermissionsSchema>;
