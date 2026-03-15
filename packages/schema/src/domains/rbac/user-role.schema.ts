import { z } from "zod";
import { DateTimeSchema } from "../../shared/primitives/datetime.schema";

export const UserRoleDetailSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string(),
  roleName: z.string(),
  roleDisplayName: z.string().nullable(),
  assignedAt: DateTimeSchema,
});

export type UserRoleDetail = z.infer<typeof UserRoleDetailSchema>;
