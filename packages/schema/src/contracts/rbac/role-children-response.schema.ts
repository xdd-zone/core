import { z } from "zod";
import { RoleSchema } from "../../domains/rbac/role.schema";

export const RoleChildrenSchema = z.array(RoleSchema);

export type RoleChildren = z.infer<typeof RoleChildrenSchema>;
