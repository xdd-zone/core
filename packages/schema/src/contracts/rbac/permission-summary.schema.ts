import { z } from "zod";

export const PermissionSummarySchema = z.object({
  id: z.string(),
  resource: z.string(),
  action: z.string(),
  scope: z.string().nullable(),
  displayName: z.string().nullable(),
});

export type PermissionSummary = z.infer<typeof PermissionSummarySchema>;
