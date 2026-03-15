import { z } from "zod";
import { DateTimeSchema } from "../../shared/primitives/datetime.schema";
import { RoleSchema } from "../../domains/rbac/role.schema";

export const UserRoleAssignmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string(),
  assignedAt: DateTimeSchema,
  role: RoleSchema,
});

export type UserRoleAssignment = z.infer<typeof UserRoleAssignmentSchema>;
