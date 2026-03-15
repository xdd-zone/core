import { z } from "zod";
import { UserStatusSchema } from "../../domains/auth/user-status.schema";

export const UpdateUserBodySchema = z.object({
  username: z
    .string()
    .min(3, "用户名至少3个字符")
    .max(50, "用户名最多50个字符")
    .nullable()
    .optional(),
  name: z
    .string()
    .min(1, "姓名不能为空")
    .max(100, "姓名最多100个字符")
    .optional(),
  email: z.string().email("请输入有效的邮箱地址").nullable().optional(),
  phone: z.string().max(20, "手机号最多20个字符").nullable().optional(),
  introduce: z.string().max(500, "简介最多500个字符").nullable().optional(),
  image: z.string().url("请输入有效的头像URL").nullable().optional(),
  status: UserStatusSchema.optional(),
});

export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>;
