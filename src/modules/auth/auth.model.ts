import { z } from 'zod'

/**
 * 注册请求体 Schema
 */
export const SignUpEmailBodySchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符').max(100, '密码最多100个字符'),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名最多100个字符'),
  image: z.string().url('请输入有效的头像URL').optional(),
})

export type SignUpEmailBody = z.infer<typeof SignUpEmailBodySchema>

/**
 * 登录请求体 Schema
 */
export const SignInEmailBodySchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '密码不能为空'),
  rememberMe: z.boolean().optional(),
})

export type SignInEmailBody = z.infer<typeof SignInEmailBodySchema>
