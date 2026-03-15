import { z } from "zod";
import { DateTimeSchema } from "../../shared/primitives/datetime.schema";

export const CurrentUserRolesSchema = z.object({
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      displayName: z.string().nullable(),
      assignedAt: DateTimeSchema,
    }),
  ),
});

export type CurrentUserRoles = z.infer<typeof CurrentUserRolesSchema>;
