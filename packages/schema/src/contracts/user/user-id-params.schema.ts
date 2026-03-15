import { z } from "zod";

export const UserIdParamsSchema = z.object({
  id: z.string().min(1, "用户ID不能为空"),
});

export type UserIdParams = z.infer<typeof UserIdParamsSchema>;
