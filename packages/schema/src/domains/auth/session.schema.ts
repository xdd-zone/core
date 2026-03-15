import { z } from "zod";
import { DateTimeSchema } from "../../shared/primitives/datetime.schema";

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: DateTimeSchema,
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: DateTimeSchema,
});

export type Session = z.infer<typeof SessionSchema>;
