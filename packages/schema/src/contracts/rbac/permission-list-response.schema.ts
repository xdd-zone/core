import { createPaginatedListSchema } from "../../shared/models/paginated-list.schema";
import { PermissionSchema } from "../../domains/rbac/permission.schema";

export const PermissionListSchema = createPaginatedListSchema(PermissionSchema);

export type PermissionList = typeof PermissionListSchema._output;
