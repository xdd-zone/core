import { z } from "zod";
import { DateTimeSchema } from "../../shared/primitives/datetime.schema";

export const UserRoleItemSchema = z.object({
  id: z.string(),
  roleId: z.string(),
  roleName: z.string(),
  roleDisplayName: z.string().nullable(),
  assignedAt: DateTimeSchema,
});

export type UserRoleItem = z.infer<typeof UserRoleItemSchema>;

export const UserRolesSchema = z.array(UserRoleItemSchema);

export type UserRoles = z.infer<typeof UserRolesSchema>;
