import type { FifaProfileAccountProvider, UpdatePublicProfileRequest } from '@xdd-zone/contracts'
import type { DbClient } from '#momo/infra/db/client'
import { and, eq, inArray } from 'drizzle-orm'
import { account, publicProfiles, user, userProfiles } from '#momo/infra/db/schema/index'

const PROFILE_ACCOUNT_PROVIDERS = ['credential', 'github', 'google'] as const satisfies FifaProfileAccountProvider[]

export interface FifaProfileUserRecord {
  avatarUrl: string | null
  displayName: string
  email: string
  id: string
}

export interface FifaProfileAccountRecord {
  provider: FifaProfileAccountProvider
}

export interface UpdateFifaProfileInput {
  avatarUrl: string | null
  displayName: string
}

export function createProfileRepository(db: DbClient) {
  async function getUserById(userId: string): Promise<FifaProfileUserRecord | null> {
    const rows = await db
      .select({
        avatarUrl: userProfiles.avatarUrl,
        displayName: userProfiles.displayName,
        email: user.email,
        id: user.id,
      })
      .from(user)
      .innerJoin(userProfiles, eq(userProfiles.userId, user.id))
      .where(eq(user.id, userId))
      .limit(1)

    return rows[0] ?? null
  }

  async function listAccountsByUserId(userId: string): Promise<FifaProfileAccountRecord[]> {
    const rows = await db
      .select({
        provider: account.providerId,
      })
      .from(account)
      .where(and(eq(account.userId, userId), inArray(account.providerId, PROFILE_ACCOUNT_PROVIDERS)))

    return rows.map((row) => ({
      provider: row.provider as FifaProfileAccountProvider,
    }))
  }

  async function updateUserProfile(userId: string, input: UpdateFifaProfileInput): Promise<void> {
    await db
      .update(userProfiles)
      .set({
        avatarUrl: input.avatarUrl,
        displayName: input.displayName,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
  }

  async function getPublicProfile(id = 'bobo') {
    const [profile] = await db.select().from(publicProfiles).where(eq(publicProfiles.id, id)).limit(1)
    return profile
  }

  async function updatePublicProfile(id: string, input: UpdatePublicProfileRequest) {
    const current = await getPublicProfile(id)
    if (!current) {
      return undefined
    }

    const [profile] = await db
      .update(publicProfiles)
      .set({
        avatarAssetId: input.avatarAssetId === undefined ? current.avatarAssetId : input.avatarAssetId,
        availableForWork: input.availableForWork === undefined ? current.availableForWork : input.availableForWork,
        bio: input.bio === undefined ? current.bio : input.bio,
        contactEmail: input.contactEmail === undefined ? current.contactEmail : input.contactEmail,
        displayName: input.displayName ?? current.displayName,
        location: input.location === undefined ? current.location : input.location,
        socialLinks: input.socialLinks ?? current.socialLinks,
        updatedAt: new Date(),
      })
      .where(eq(publicProfiles.id, id))
      .returning()

    return profile
  }

  return {
    getPublicProfile,
    getUserById,
    listAccountsByUserId,
    updatePublicProfile,
    updateUserProfile,
  }
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>
export { PROFILE_ACCOUNT_PROVIDERS }
