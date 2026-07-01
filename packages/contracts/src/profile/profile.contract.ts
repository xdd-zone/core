import { z } from 'zod'

export const FifaProfileAccountProviderSchema = z.enum(['credential', 'github', 'google'])

export const FifaProfileAccountSchema = z.object({
  bound: z.boolean(),
  provider: FifaProfileAccountProviderSchema,
})

export const FifaProfileResponseSchema = z.object({
  accounts: z.array(FifaProfileAccountSchema),
  avatarUrl: z.string().nullable(),
  displayName: z.string(),
  email: z.string(),
  id: z.string(),
})

export const UpdateFifaProfileRequestSchema = z.object({
  avatarUrl: z.string().trim().min(1).nullable(),
  displayName: z.string().trim().min(1).max(120),
})

export const UploadFifaProfileAvatarResponseSchema = z.object({
  avatarUrl: z.string(),
})

export type FifaProfileAccountProvider = z.infer<typeof FifaProfileAccountProviderSchema>
export type FifaProfileAccount = z.infer<typeof FifaProfileAccountSchema>
export type FifaProfileResponse = z.infer<typeof FifaProfileResponseSchema>
export type UpdateFifaProfileRequest = z.infer<typeof UpdateFifaProfileRequestSchema>
export type UploadFifaProfileAvatarResponse = z.infer<typeof UploadFifaProfileAvatarResponseSchema>
