import { RoleWithPermissionsSchema } from "../../domains/rbac/role.schema";

export const RoleDetailSchema = RoleWithPermissionsSchema;

export type RoleDetail = typeof RoleDetailSchema._output;
