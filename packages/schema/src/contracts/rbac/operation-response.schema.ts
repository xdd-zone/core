import { z } from "zod";

export const OperationResultSchema = z.object({
  success: z.boolean(),
  count: z.number().optional(),
});

export type OperationResult = z.infer<typeof OperationResultSchema>;
