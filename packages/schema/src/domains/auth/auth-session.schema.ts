import { z } from "zod";
import { DateTimeSchema } from "../../shared/primitives/datetime.schema";
import { SessionSchema } from "./session.schema";

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
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const SessionDataSchema = z.object({
  user: AuthUserSchema.nullable(),
  session: SessionSchema.nullable(),
  isAuthenticated: z.boolean(),
});

export type SessionData = z.infer<typeof SessionDataSchema>;

export const AuthSessionDataSchema = z.object({
  user: AuthUserSchema,
  token: z.string().optional(),
  session: SessionSchema.nullable().optional(),
});

export type AuthSessionData = z.infer<typeof AuthSessionDataSchema>;
