import { z } from "zod";

export const CreateRoleBodySchema = z.object({
  name: z.string().min(1, "角色标识不能为空").max(50, "角色标识最多50个字符"),
  displayName: z
    .string()
    .min(1, "显示名称不能为空")
    .max(100, "显示名称最多100个字符")
    .optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

export type CreateRoleBody = z.infer<typeof CreateRoleBodySchema>;
