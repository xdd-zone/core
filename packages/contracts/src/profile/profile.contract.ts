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

export const PublicProfileSchema = z.object({
  availableForWork: z.boolean(),
  avatarAssetId: z.string().nullable(),
  bio: z.string().nullable(),
  contactEmail: z.string().nullable(),
  displayName: z.string(),
  location: z.string().nullable(),
  socialLinks: z.array(
    z.object({
      href: z.string().url(),
      label: z.string().trim().min(1).max(80),
    }),
  ),
  updatedAt: z.string(),
})

export const PublicProfileResponseSchema = z.object({
  profile: PublicProfileSchema,
})

export const UpdatePublicProfileRequestSchema = z.object({
  availableForWork: z.boolean().optional(),
  avatarAssetId: z.string().trim().min(1).nullable().optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
  location: z.string().trim().max(120).nullable().optional(),
  socialLinks: z
    .array(
      z.object({
        href: z.string().url(),
        label: z.string().trim().min(1).max(80),
      }),
    )
    .max(12)
    .optional(),
})

export type FifaProfileAccountProvider = z.infer<typeof FifaProfileAccountProviderSchema>
export type FifaProfileAccount = z.infer<typeof FifaProfileAccountSchema>
export type FifaProfileResponse = z.infer<typeof FifaProfileResponseSchema>
export type PublicProfile = z.infer<typeof PublicProfileSchema>
export type PublicProfileResponse = z.infer<typeof PublicProfileResponseSchema>
export type UpdateFifaProfileRequest = z.infer<typeof UpdateFifaProfileRequestSchema>
export type UpdatePublicProfileRequest = z.infer<typeof UpdatePublicProfileRequestSchema>
export type UploadFifaProfileAvatarResponse = z.infer<typeof UploadFifaProfileAvatarResponseSchema>
