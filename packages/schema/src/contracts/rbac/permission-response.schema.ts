import { PermissionSchema } from "../../domains/rbac/permission.schema";

export { PermissionSchema };
export type Permission = typeof PermissionSchema._output;
