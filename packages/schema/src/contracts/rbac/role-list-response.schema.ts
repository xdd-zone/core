import { createPaginatedListSchema } from "../../shared/models/paginated-list.schema";
import { RoleSchema } from "../../domains/rbac/role.schema";

export const RoleListSchema = createPaginatedListSchema(RoleSchema);

export type RoleList = typeof RoleListSchema._output;
