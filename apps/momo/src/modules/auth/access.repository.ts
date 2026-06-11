import type { ApplicationCode, AuthProvider, RoleCode } from './auth.types'
import { randomUUID } from 'node:crypto'
import { getDb } from '#momo/infra/db/client'
import {
  account,
  applicationAuthMethods,
  applications,
  roles,
  user,
  userRoleBindings,
} from '#momo/infra/db/schema/index'
import { and, eq } from 'drizzle-orm'

export async function hasPasswordAccount(userId: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
    .limit(1)

  return rows.length > 0
}

export async function isUserActive(userId: string): Promise<boolean> {
  const rows = await getDb()
    .select({ status: user.status })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return rows[0]?.status === 'active'
}

export async function hasActiveAuthMethod(applicationCode: ApplicationCode, provider: AuthProvider): Promise<boolean> {
  const rows = await getDb()
    .select({ id: applicationAuthMethods.id })
    .from(applicationAuthMethods)
    .innerJoin(applications, eq(applicationAuthMethods.applicationId, applications.id))
    .where(
      and(
        eq(applications.code, applicationCode),
        eq(applications.status, 'active'),
        eq(applicationAuthMethods.provider, provider),
        eq(applicationAuthMethods.status, 'active'),
      ),
    )
    .limit(1)

  return rows.length > 0
}

export async function findActiveRoleBinding(
  userId: string,
  applicationCode: ApplicationCode,
  roleCode: RoleCode,
): Promise<{ roleCode: RoleCode } | null> {
  const rows = await getDb()
    .select({ roleCode: roles.code })
    .from(userRoleBindings)
    .innerJoin(roles, eq(userRoleBindings.roleId, roles.id))
    .innerJoin(applications, eq(roles.applicationId, applications.id))
    .where(
      and(
        eq(userRoleBindings.userId, userId),
        eq(userRoleBindings.status, 'active'),
        eq(applications.code, applicationCode),
        eq(applications.status, 'active'),
        eq(roles.code, roleCode),
      ),
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    return null
  }

  return {
    roleCode: row.roleCode as RoleCode,
  }
}

export async function ensureBoboVisitorRole(userId: string): Promise<void> {
  const role = await findRole('bobo', 'visitor')

  if (!role) {
    throw new Error('bobo visitor role is missing')
  }

  await getDb()
    .insert(userRoleBindings)
    .values({
      id: randomUUID(),
      userId,
      roleId: role.id,
      status: 'active',
    })
    .onConflictDoUpdate({
      target: [userRoleBindings.userId, userRoleBindings.roleId],
      set: {
        status: 'active',
        updatedAt: new Date(),
      },
    })
}

async function findRole(applicationCode: ApplicationCode, roleCode: RoleCode): Promise<{ id: string } | null> {
  const rows = await getDb()
    .select({ id: roles.id })
    .from(roles)
    .innerJoin(applications, eq(roles.applicationId, applications.id))
    .where(and(eq(applications.code, applicationCode), eq(applications.status, 'active'), eq(roles.code, roleCode)))
    .limit(1)

  return rows[0] ?? null
}
