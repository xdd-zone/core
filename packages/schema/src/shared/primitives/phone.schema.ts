import { z } from "zod";

export const PhoneSchema = z.string().max(20, "手机号最多20个字符");

export type Phone = z.infer<typeof PhoneSchema>;
