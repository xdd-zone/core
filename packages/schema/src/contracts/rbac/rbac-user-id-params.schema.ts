import { z } from "zod";

export const RBACUserIdParamsSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
});

export type RBACUserIdParams = z.infer<typeof RBACUserIdParamsSchema>;
