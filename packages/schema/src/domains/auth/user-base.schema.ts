import { z } from "zod";
import { DateTimeSchema } from "../../shared/primitives/datetime.schema";
import { UserStatusSchema } from "./user-status.schema";

export const UserBaseSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean().nullable(),
  emailVerifiedAt: DateTimeSchema.nullable(),
  introduce: z.string().nullable(),
  image: z.string().nullable(),
  phone: z.string().nullable(),
  phoneVerified: z.boolean().nullable(),
  phoneVerifiedAt: DateTimeSchema.nullable(),
  lastLogin: DateTimeSchema.nullable(),
  lastLoginIp: z.string().nullable(),
  status: UserStatusSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.nullable(),
});

export type UserBase = z.infer<typeof UserBaseSchema>;
