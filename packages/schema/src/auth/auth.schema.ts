import type { StandardSchemaV1 } from "@standard-schema/spec";
import { createSimpleSchema, createSchema } from "../standard/standard-schema";

/**
 * 用户状态枚举
 * - ACTIVE: 正常状态，可登录并使用系统
 * - INACTIVE: 未激活，需要邮箱验证
 * - BANNED: 已封禁，禁止登录
 */
export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

const VALID_USER_STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE", "BANNED"];

export const UserStatusSchema: StandardSchemaV1<string, UserStatus> =
  createSimpleSchema<UserStatus>((value) => {
    if (typeof value !== "string") {
      return {
        issues: [{ message: "用户状态必须是字符串" }],
      };
    }
    if (VALID_USER_STATUSES.includes(value as UserStatus)) {
      return { value: value as UserStatus };
    }
    return {
      issues: [{ message: `无效的用户状态: ${value}` }],
    };
  });

/**
 * 用户基础信息
 * 用户公开的公共信息，不包含敏感数据（如密码）
 * 用于接口返回、用户列表等场景
 * 字段：id, username, name, email, image, status, createdAt 等
 */
export type UserBase = {
  id: string;
  username: string | null;
  name: string;
  email: string | null;
  emailVerified: boolean | null;
  emailVerifiedAt: string | Date | null;
  introduce: string | null;
  image: string | null;
  phone: string | null;
  phoneVerified: boolean | null;
  phoneVerifiedAt: string | Date | null;
  lastLogin: string | Date | null;
  lastLoginIp: string | null;
  status: UserStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
};

export const UserBaseSchema: StandardSchemaV1<unknown, UserBase> = createSchema<
  unknown,
  UserBase
>({
  validate: (value): StandardSchemaV1.Result<UserBase> => {
    if (typeof value !== "object" || value === null) {
      return { issues: [{ message: "用户基础信息必须是对象" }] };
    }

    const obj = value as Record<string, unknown>;
    const issues: StandardSchemaV1.Issue[] = [];

    // id
    if (typeof obj.id !== "string") {
      issues.push({ message: "id 必须是字符串" });
    }

    // username
    if (obj.username !== null && typeof obj.username !== "string") {
      issues.push({ message: "username 必须是字符串或 null" });
    }

    // name
    if (typeof obj.name !== "string") {
      issues.push({ message: "name 必须是字符串" });
    }

    // email
    if (obj.email !== null && typeof obj.email !== "string") {
      issues.push({ message: "email 必须是字符串或 null" });
    }

    // emailVerified
    if (obj.emailVerified !== null && typeof obj.emailVerified !== "boolean") {
      issues.push({ message: "emailVerified 必须是布尔值或 null" });
    }

    // emailVerifiedAt
    if (
      obj.emailVerifiedAt !== null &&
      typeof obj.emailVerifiedAt !== "string" &&
      !(obj.emailVerifiedAt instanceof Date)
    ) {
      issues.push({ message: "emailVerifiedAt 必须是字符串、Date 或 null" });
    }

    // introduce
    if (obj.introduce !== null && typeof obj.introduce !== "string") {
      issues.push({ message: "introduce 必须是字符串或 null" });
    }

    // image
    if (obj.image !== null && typeof obj.image !== "string") {
      issues.push({ message: "image 必须是字符串或 null" });
    }

    // phone
    if (obj.phone !== null && typeof obj.phone !== "string") {
      issues.push({ message: "phone 必须是字符串或 null" });
    }

    // phoneVerified
    if (obj.phoneVerified !== null && typeof obj.phoneVerified !== "boolean") {
      issues.push({ message: "phoneVerified 必须是布尔值或 null" });
    }

    // phoneVerifiedAt
    if (
      obj.phoneVerifiedAt !== null &&
      typeof obj.phoneVerifiedAt !== "string" &&
      !(obj.phoneVerifiedAt instanceof Date)
    ) {
      issues.push({ message: "phoneVerifiedAt 必须是字符串、Date 或 null" });
    }

    // lastLogin
    if (
      obj.lastLogin !== null &&
      typeof obj.lastLogin !== "string" &&
      !(obj.lastLogin instanceof Date)
    ) {
      issues.push({ message: "lastLogin 必须是字符串、Date 或 null" });
    }

    // lastLoginIp
    if (obj.lastLoginIp !== null && typeof obj.lastLoginIp !== "string") {
      issues.push({ message: "lastLoginIp 必须是字符串或 null" });
    }

    // status
    const statusResult = UserStatusSchema["~standard"].validate(obj.status);
    if (!("value" in statusResult)) {
      issues.push({ message: "status 无效" });
    }

    // createdAt
    if (typeof obj.createdAt !== "string" && !(obj.createdAt instanceof Date)) {
      issues.push({ message: "createdAt 必须是字符串或 Date" });
    }

    // updatedAt
    if (typeof obj.updatedAt !== "string" && !(obj.updatedAt instanceof Date)) {
      issues.push({ message: "updatedAt 必须是字符串或 Date" });
    }

    // deletedAt
    if (
      obj.deletedAt !== null &&
      typeof obj.deletedAt !== "string" &&
      !(obj.deletedAt instanceof Date)
    ) {
      issues.push({ message: "deletedAt 必须是字符串、Date 或 null" });
    }

    if (issues.length > 0) {
      return { issues };
    }

    return {
      value: {
        id: obj.id as string,
        username: obj.username as string | null,
        name: obj.name as string,
        email: obj.email as string | null,
        emailVerified: obj.emailVerified as boolean | null,
        emailVerifiedAt: obj.emailVerifiedAt as string | Date | null,
        introduce: obj.introduce as string | null,
        image: obj.image as string | null,
        phone: obj.phone as string | null,
        phoneVerified: obj.phoneVerified as boolean | null,
        phoneVerifiedAt: obj.phoneVerifiedAt as string | Date | null,
        lastLogin: obj.lastLogin as string | Date | null,
        lastLoginIp: obj.lastLoginIp as string | null,
        status: (obj.status as UserStatus) || "ACTIVE",
        createdAt: obj.createdAt as string | Date,
        updatedAt: obj.updatedAt as string | Date,
        deletedAt: obj.deletedAt as string | Date | null,
      },
    };
  },
});

/**
 * 用户会话信息
 * 用户登录后生成的会话数据，用于 session 认证
 * 包含会话 ID、用户 ID、token、过期时间、IP、UA 等
 */
export type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string | Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | Date;
};

export const SessionSchema: StandardSchemaV1<unknown, Session> = createSchema<
  unknown,
  Session
>({
  validate: (value): StandardSchemaV1.Result<Session> => {
    if (typeof value !== "object" || value === null) {
      return { issues: [{ message: "会话信息必须是对象" }] };
    }

    const obj = value as Record<string, unknown>;
    const issues: StandardSchemaV1.Issue[] = [];

    // id
    if (typeof obj.id !== "string") {
      issues.push({ message: "id 必须是字符串" });
    }

    // userId
    if (typeof obj.userId !== "string") {
      issues.push({ message: "userId 必须是字符串" });
    }

    // token
    if (typeof obj.token !== "string") {
      issues.push({ message: "token 必须是字符串" });
    }

    // expiresAt
    if (typeof obj.expiresAt !== "string" && !(obj.expiresAt instanceof Date)) {
      issues.push({ message: "expiresAt 必须是字符串或 Date" });
    }

    // ipAddress
    if (obj.ipAddress !== null && typeof obj.ipAddress !== "string") {
      issues.push({ message: "ipAddress 必须是字符串或 null" });
    }

    // userAgent
    if (obj.userAgent !== null && typeof obj.userAgent !== "string") {
      issues.push({ message: "userAgent 必须是字符串或 null" });
    }

    // createdAt
    if (typeof obj.createdAt !== "string" && !(obj.createdAt instanceof Date)) {
      issues.push({ message: "createdAt 必须是字符串或 Date" });
    }

    if (issues.length > 0) {
      return { issues };
    }

    return {
      value: {
        id: obj.id as string,
        userId: obj.userId as string,
        token: obj.token as string,
        expiresAt: obj.expiresAt as string | Date,
        ipAddress: obj.ipAddress as string | null,
        userAgent: obj.userAgent as string | null,
        createdAt: obj.createdAt as string | Date,
      },
    };
  },
});

/**
 * 邮箱密码注册请求
 * 必填：email（邮箱）、password（密码）、name（显示名称）
 * 选填：image（头像URL）
 */
export type SignUpEmailBody = {
  email: string;
  password: string;
  name: string;
  image?: string;
};

export const SignUpEmailBodySchema: StandardSchemaV1<unknown, SignUpEmailBody> =
  createSchema<unknown, SignUpEmailBody>({
    validate: (value): StandardSchemaV1.Result<SignUpEmailBody> => {
      if (typeof value !== "object" || value === null) {
        return { issues: [{ message: "注册请求必须是对象" }] };
      }

      const obj = value as Record<string, unknown>;
      const issues: StandardSchemaV1.Issue[] = [];

      // email (required)
      if (typeof obj.email !== "string") {
        issues.push({ message: "email 必须是字符串" });
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(obj.email)) {
          issues.push({ message: "email 格式无效" });
        }
      }

      // password (required, min 8, max 100)
      if (typeof obj.password !== "string") {
        issues.push({ message: "password 必须是字符串" });
      } else {
        if (obj.password.length < 8) {
          issues.push({ message: "password 长度至少为 8 个字符" });
        }
        if (obj.password.length > 100) {
          issues.push({ message: "password 长度不能超过 100 个字符" });
        }
      }

      // name (required, min 1, max 100)
      if (typeof obj.name !== "string") {
        issues.push({ message: "name 必须是字符串" });
      } else {
        if (obj.name.length < 1) {
          issues.push({ message: "name 不能为空" });
        }
        if (obj.name.length > 100) {
          issues.push({ message: "name 长度不能超过 100 个字符" });
        }
      }

      // image (optional, must be URL if provided)
      if (obj.image !== undefined) {
        if (typeof obj.image !== "string") {
          issues.push({ message: "image 必须是字符串" });
        } else {
          try {
            new URL(obj.image);
          } catch {
            issues.push({ message: "image 必须是有效的 URL" });
          }
        }
      }

      if (issues.length > 0) {
        return { issues };
      }

      return {
        value: {
          email: obj.email as string,
          password: obj.password as string,
          name: obj.name as string,
          image: obj.image as string | undefined,
        },
      };
    },
  });

/**
 * 邮箱密码登录请求
 * 必填：email（邮箱）、password（密码）
 * 选填：rememberMe（记住登录状态）
 */
export type SignInEmailBody = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export const SignInEmailBodySchema: StandardSchemaV1<unknown, SignInEmailBody> =
  createSchema<unknown, SignInEmailBody>({
    validate: (value): StandardSchemaV1.Result<SignInEmailBody> => {
      if (typeof value !== "object" || value === null) {
        return { issues: [{ message: "登录请求必须是对象" }] };
      }

      const obj = value as Record<string, unknown>;
      const issues: StandardSchemaV1.Issue[] = [];

      // email (required)
      if (typeof obj.email !== "string") {
        issues.push({ message: "email 必须是字符串" });
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(obj.email)) {
          issues.push({ message: "email 格式无效" });
        }
      }

      // password (required, min 1)
      if (typeof obj.password !== "string") {
        issues.push({ message: "password 必须是字符串" });
      } else {
        if (obj.password.length < 1) {
          issues.push({ message: "password 不能为空" });
        }
      }

      // rememberMe (optional)
      if (obj.rememberMe !== undefined && typeof obj.rememberMe !== "boolean") {
        issues.push({ message: "rememberMe 必须是布尔值" });
      }

      if (issues.length > 0) {
        return { issues };
      }

      return {
        value: {
          email: obj.email as string,
          password: obj.password as string,
          rememberMe: obj.rememberMe as boolean | undefined,
        },
      };
    },
  });

/**
 * 会话数据（通用）
 * 用于获取当前登录状态、/me 接口等
 * 包含：user（用户信息）、session（会话信息）、isAuthenticated（是否已登录）
 */
export type SessionData = {
  user: UserBase | null;
  session: Session | null;
  isAuthenticated: boolean;
};

export const SessionDataSchema: StandardSchemaV1<unknown, SessionData> =
  createSchema<unknown, SessionData>({
    validate: (value): StandardSchemaV1.Result<SessionData> => {
      if (typeof value !== "object" || value === null) {
        return { issues: [{ message: "会话数据必须是对象" }] };
      }

      const obj = value as Record<string, unknown>;
      const issues: StandardSchemaV1.Issue[] = [];

      // user (nullable)
      if (obj.user !== null) {
        const userResult = UserBaseSchema["~standard"].validate(obj.user);
        if (!("value" in userResult)) {
          issues.push({ message: "user 格式无效" });
        }
      }

      // session (nullable)
      if (obj.session !== null) {
        const sessionResult = SessionSchema["~standard"].validate(obj.session);
        if (!("value" in sessionResult)) {
          issues.push({ message: "session 格式无效" });
        }
      }

      // isAuthenticated
      if (typeof obj.isAuthenticated !== "boolean") {
        issues.push({ message: "isAuthenticated 必须是布尔值" });
      }

      if (issues.length > 0) {
        return { issues };
      }

      return {
        value: {
          user: obj.user ? ((obj.user as any).value as UserBase) : null,
          session: obj.session ? ((obj.session as any).value as Session) : null,
          isAuthenticated: obj.isAuthenticated as boolean,
        },
      };
    },
  });

/**
 * 认证会话数据（登录成功返回）
 * 登录成功后返回的用户信息和 token
 * 包含：user（用户信息）、token（JWT Token）、session（可选会话信息）
 */
export type AuthSessionData = {
  user: UserBase;
  token?: string;
  session?: Session | null;
};

export const AuthSessionDataSchema: StandardSchemaV1<unknown, AuthSessionData> =
  createSchema<unknown, AuthSessionData>({
    validate: (value): StandardSchemaV1.Result<AuthSessionData> => {
      if (typeof value !== "object" || value === null) {
        return { issues: [{ message: "认证会话数据必须是对象" }] };
      }

      const obj = value as Record<string, unknown>;
      const issues: StandardSchemaV1.Issue[] = [];

      // user (required)
      if (typeof obj.user !== "object" || obj.user === null) {
        issues.push({ message: "user 是必填字段" });
      } else {
        const userResult = UserBaseSchema["~standard"].validate(obj.user);
        if (!("value" in userResult)) {
          issues.push({ message: "user 格式无效" });
        }
      }

      // token (optional)
      if (obj.token !== undefined && typeof obj.token !== "string") {
        issues.push({ message: "token 必须是字符串" });
      }

      // session (optional, nullable)
      if (obj.session !== undefined && obj.session !== null) {
        const sessionResult = SessionSchema["~standard"].validate(obj.session);
        if (!("value" in sessionResult)) {
          issues.push({ message: "session 格式无效" });
        }
      }

      if (issues.length > 0) {
        return { issues };
      }

      return {
        value: {
          user: ((obj.user as any).value as UserBase) ?? (obj.user as UserBase),
          token: obj.token as string | undefined,
          session: obj.session
            ? ((obj.session as any).value as Session | null)
            : (obj.session as Session | null),
        },
      };
    },
  });
