import { z } from "zod";

export const UpdateRoleBodySchema = z.object({
  displayName: z
    .string()
    .min(1, "显示名称不能为空")
    .max(100, "显示名称最多100个字符")
    .optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export type UpdateRoleBody = z.infer<typeof UpdateRoleBodySchema>;
