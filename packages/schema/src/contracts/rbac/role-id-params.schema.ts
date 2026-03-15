import { z } from "zod";

export const RoleIdParamsSchema = z.object({
  id: z.string().min(1, "角色ID不能为空"),
});

export type RoleIdParams = z.infer<typeof RoleIdParamsSchema>;
