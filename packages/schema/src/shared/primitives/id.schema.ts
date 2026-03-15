import { z } from "zod";

export const IdSchema = z.string().min(1, "ID 不能为空");

export type Id = z.infer<typeof IdSchema>;
