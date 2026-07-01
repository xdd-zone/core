import type { FifaProfileAccountProvider } from '@xdd-zone/contracts'
import type { DbClient } from '#momo/infra/db/client'
import { and, eq, inArray } from 'drizzle-orm'
import { account, user } from '#momo/infra/db/schema/index'

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
        avatarUrl: user.image,
        displayName: user.name,
        email: user.email,
        id: user.id,
      })
      .from(user)
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

  async function updateUserProfile(userId: string, input: UpdateFifaProfileInput): Promise<FifaProfileUserRecord> {
    const rows = await db
      .update(user)
      .set({
        image: input.avatarUrl,
        name: input.displayName,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning({
        avatarUrl: user.image,
        displayName: user.name,
        email: user.email,
        id: user.id,
      })

    return rows[0]!
  }

  return {
    getUserById,
    listAccountsByUserId,
    updateUserProfile,
  }
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>
export { PROFILE_ACCOUNT_PROVIDERS }
