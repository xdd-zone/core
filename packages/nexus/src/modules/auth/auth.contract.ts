import { z } from 'zod'
import { DateTimeSchema } from '@/shared/schema'

export const AuthSessionRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: DateTimeSchema,
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: DateTimeSchema,
})

export type AuthSessionRecord = z.infer<typeof AuthSessionRecordSchema>

export const AuthUserSchema = z.object({
  id: z.string(),
  username: z.string().nullable().optional(),
  name: z.string(),
  email: z.string().nullable().optional(),
  emailVerified: z.boolean().nullable().optional(),
  emailVerifiedAt: DateTimeSchema.nullable().optional(),
  introduce: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  phoneVerified: z.boolean().nullable().optional(),
  phoneVerifiedAt: DateTimeSchema.nullable().optional(),
  lastLogin: DateTimeSchema.nullable().optional(),
  lastLoginIp: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.nullable().optional(),
})

export type AuthUser = z.infer<typeof AuthUserSchema>

export const SessionSchema = z.object({
  user: AuthUserSchema.nullable(),
  session: AuthSessionRecordSchema.nullable(),
  isAuthenticated: z.boolean(),
})

export type Session = z.infer<typeof SessionSchema>

export const AuthSessionSchema = z.object({
  user: AuthUserSchema,
  token: z.string().optional(),
  session: AuthSessionRecordSchema.nullable().optional(),
})

export type AuthSession = z.infer<typeof AuthSessionSchema>

export const SignInEmailBodySchema = z.object({
  email: z.string().min(1, '邮箱不能为空').email('请输入有效的邮箱地址'),
  password: z.string().min(1, '密码不能为空'),
  rememberMe: z.boolean().optional(),
})

export type SignInEmailBody = z.infer<typeof SignInEmailBodySchema>

export const SignUpEmailBodySchema = z.object({
  email: z.string().min(1, '邮箱不能为空').email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符').max(100, '密码最多100个字符'),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名最多100个字符'),
  image: z.string().url('请输入有效的头像URL').optional(),
})

export type SignUpEmailBody = z.infer<typeof SignUpEmailBodySchema>
