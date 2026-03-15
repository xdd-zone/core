import { z } from "zod";

export const SignUpEmailBodySchema = z.object({
  email: z.string().min(1, "邮箱不能为空").email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(8, "密码至少需要8个字符")
    .max(100, "密码最多100个字符"),
  name: z.string().min(1, "姓名不能为空").max(100, "姓名最多100个字符"),
  image: z.string().url("请输入有效的头像URL").optional(),
});

export type SignUpEmailBody = z.infer<typeof SignUpEmailBodySchema>;
