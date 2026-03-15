import { z } from "zod";
import { DateTimeSchema } from "../../shared/primitives/datetime.schema";
import { PermissionStringSchema } from "./permission.schema";

export const RoleBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
  description: z.string().nullable(),
  parentId: z.string().nullable(),
  level: z.number(),
  isSystem: z.boolean(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type RoleBase = z.infer<typeof RoleBaseSchema>;

export const RoleParentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
});

export type RoleParentSummary = z.infer<typeof RoleParentSummarySchema>;

export const RoleSchema = RoleBaseSchema.extend({
  parent: RoleParentSummarySchema.nullable().optional(),
});

export type Role = z.infer<typeof RoleSchema>;

export const RoleDetailParentSchema = RoleBaseSchema;

export type RoleDetailParent = z.infer<typeof RoleDetailParentSchema>;

export const RoleWithPermissionsSchema = RoleBaseSchema.extend({
  parent: RoleDetailParentSchema.nullable().optional(),
  permissions: z.array(PermissionStringSchema),
});

export type RoleWithPermissions = z.infer<typeof RoleWithPermissionsSchema>;
