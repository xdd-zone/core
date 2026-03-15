import { z } from "zod";
import { PermissionScopeSchema } from "../../domains/rbac/permission.schema";

export const CreatePermissionBodySchema = z.object({
  resource: z.string().min(1, "资源不能为空").max(50, "资源最多50个字符"),
  action: z.string().min(1, "操作不能为空").max(50, "操作最多50个字符"),
  scope: PermissionScopeSchema.optional(),
  displayName: z
    .string()
    .min(1, "显示名称不能为空")
    .max(100, "显示名称最多100个字符")
    .optional(),
  description: z.string().optional(),
});

export type CreatePermissionBody = z.infer<typeof CreatePermissionBodySchema>;
