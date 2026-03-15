import { z } from "zod";

export const SignInEmailBodySchema = z.object({
  email: z.string().min(1, "邮箱不能为空").email("请输入有效的邮箱地址"),
  password: z.string().min(1, "密码不能为空"),
  rememberMe: z.boolean().optional(),
});

export type SignInEmailBody = z.infer<typeof SignInEmailBodySchema>;
