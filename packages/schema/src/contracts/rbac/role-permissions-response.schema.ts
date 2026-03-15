import { z } from "zod";
import { PermissionSummarySchema } from "./permission-summary.schema";

export const RolePermissionsSchema = z.array(PermissionSummarySchema);

export type RolePermissions = z.infer<typeof RolePermissionsSchema>;
