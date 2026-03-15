import { z } from "zod";

export const EmailSchema = z.string().email("请输入有效的邮箱地址");

export type Email = z.infer<typeof EmailSchema>;
