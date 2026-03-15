import { z } from "zod";
import { DateTimeSchema } from "../../shared/primitives/datetime.schema";

export const PermissionScopeSchema = z.enum(["", "own", "all"]);

export type PermissionScope = z.infer<typeof PermissionScopeSchema>;

export const PermissionStringSchema = z.string();

export type PermissionString = z.infer<typeof PermissionStringSchema>;

export const PermissionSchema = z.object({
  id: z.string(),
  resource: z.string(),
  action: z.string(),
  scope: PermissionScopeSchema.optional(),
  displayName: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;
