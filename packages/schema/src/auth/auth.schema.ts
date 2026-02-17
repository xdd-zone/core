import { z } from "zod";

/**
 * 用户状态枚举
 * - ACTIVE: 正常状态，可登录并使用系统
 * - INACTIVE: 未激活，需要邮箱验证
 * - BANNED: 已封禁，禁止登录
 */
export const UserStatusSchema = z.enum(["ACTIVE", "INACTIVE", "BANNED"]);

export type UserStatus = z.infer<typeof UserStatusSchema>;

/**
 * 用户基础信息
 * 用户公开的公共信息，不包含敏感数据（如密码）
 * 用于接口返回、用户列表等场景
 * 字段：id, username, name, email, image, status, createdAt 等
 */
export const UserBaseSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean().nullable(),
  emailVerifiedAt: z.string().or(z.date()).nullable(),
  introduce: z.string().nullable(),
  image: z.string().nullable(),
  phone: z.string().nullable(),
  phoneVerified: z.boolean().nullable(),
  phoneVerifiedAt: z.string().or(z.date()).nullable(),
  lastLogin: z.string().or(z.date()).nullable(),
  lastLoginIp: z.string().nullable(),
  status: UserStatusSchema,
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  deletedAt: z.string().or(z.date()).nullable(),
});

export type UserBase = z.infer<typeof UserBaseSchema>;

/**
 * 用户会话信息
 * 用户登录后生成的会话数据，用于 session 认证
 * 包含会话 ID、用户 ID、token、过期时间、IP、UA 等
 */
export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.string().or(z.date()),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string().or(z.date()),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * 邮箱密码注册请求
 * 必填：email（邮箱）、password（密码）、name（显示名称）
 * 选填：image（头像URL）
 */
export const SignUpEmailBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  image: z.string().url().optional(),
});

export type SignUpEmailBody = z.infer<typeof SignUpEmailBodySchema>;

/**
 * 邮箱密码登录请求
 * 必填：email（邮箱）、password（密码）
 * 选填：rememberMe（记住登录状态）
 */
export const SignInEmailBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export type SignInEmailBody = z.infer<typeof SignInEmailBodySchema>;

/**
 * 会话数据（通用）
 * 用于获取当前登录状态、/me 接口等
 * 包含：user（用户信息）、session（会话信息）、isAuthenticated（是否已登录）
 */
export const SessionDataSchema = z.object({
  user: UserBaseSchema.nullable(),
  session: SessionSchema.nullable(),
  isAuthenticated: z.boolean(),
});

export type SessionData = z.infer<typeof SessionDataSchema>;

/**
 * 认证会话数据（登录成功返回）
 * 登录成功后返回的用户信息和 token
 * 包含：user（用户信息）、token（JWT Token）、session（可选会话信息）
 */
export const AuthSessionDataSchema = z.object({
  user: UserBaseSchema,
  token: z.string().optional(),
  session: SessionSchema.nullable().optional(),
});

export type AuthSessionData = z.infer<typeof AuthSessionDataSchema>;
