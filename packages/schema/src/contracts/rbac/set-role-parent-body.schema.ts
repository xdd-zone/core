import { z } from "zod";

export const SetRoleParentBodySchema = z.object({
  parentId: z.string().nullable(),
});

export type SetRoleParentBody = z.infer<typeof SetRoleParentBodySchema>;
