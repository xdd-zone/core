import { z } from "zod";

export const DateTimeSchema = z.union([z.string(), z.date()]);

export type DateTime = z.infer<typeof DateTimeSchema>;
