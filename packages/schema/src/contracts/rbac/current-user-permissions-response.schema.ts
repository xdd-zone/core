import { z } from "zod";
import { UserPermissionsSchema } from "./user-permissions-response.schema";

export const CurrentUserPermissionsSchema = UserPermissionsSchema.extend({
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      displayName: z.string().nullable(),
    }),
  ),
});

export type CurrentUserPermissions = z.infer<
  typeof CurrentUserPermissionsSchema
>;
