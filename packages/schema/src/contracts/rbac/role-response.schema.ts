import { RoleSchema } from "../../domains/rbac/role.schema";

export { RoleSchema };
export type Role = typeof RoleSchema._output;
