import { z } from "zod";

export const UserStatusSchema = z.enum(["ACTIVE", "INACTIVE", "BANNED"]);

export type UserStatus = z.infer<typeof UserStatusSchema>;
