import { z } from "zod";

export const ApiErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.null(),
  errorCode: z.string().optional(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
