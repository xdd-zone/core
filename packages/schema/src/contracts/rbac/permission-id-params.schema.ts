import { z } from "zod";

export const PermissionIdParamsSchema = z.object({
  id: z.string().min(1, "权限ID不能为空"),
});

export type PermissionIdParams = z.infer<typeof PermissionIdParamsSchema>;
