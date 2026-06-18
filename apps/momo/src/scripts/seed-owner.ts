import type { MomoAuth } from '#momo/modules/auth/auth.config'
import { and, eq } from 'drizzle-orm'
import { closeDb, configureDbClient, getDb } from '#momo/infra/db/client'
import {
  account,
  applicationAuthMethods,
  applications,
  roles,
  user,
  userRoleBindings,
} from '#momo/infra/db/schema/index'
import { createChildLogger, createLogger } from '#momo/infra/logger'
import { createMomoAuth } from '#momo/modules/auth/auth.config'
import { getMomoEnv } from '#momo/shared/env'

const localDefaults: Record<string, string> = {
  APP_ENV: 'development',
  BETTER_AUTH_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  BETTER_AUTH_URL: 'http://localhost:7788',
  CORS_ORIGINS: 'http://localhost:2333,http://127.0.0.1:2333',
  DATABASE_URL: 'postgres://momo:momo@localhost:55432/momo',
  GITHUB_CLIENT_ID: 'test-github-client-id',
  GITHUB_CLIENT_SECRET: 'test-github-client-secret',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  PORT: '7788',
}

for (const [key, value] of Object.entries(localDefaults)) {
  process.env[key] ??= value
}

interface OwnerSeedInput {
  displayName: string
  email: string
  password: string
}

const appRecords = [
  { id: 'app_fifa', code: 'fifa', name: 'Fifa' },
  { id: 'app_bobo', code: 'bobo', name: 'Bobo' },
]

const authMethodRecords = [
  { id: 'auth_method_fifa_password', applicationId: 'app_fifa', provider: 'password' },
  { id: 'auth_method_bobo_github', applicationId: 'app_bobo', provider: 'github' },
  { id: 'auth_method_bobo_google', applicationId: 'app_bobo', provider: 'google' },
]

const roleRecords = [
  { id: 'role_fifa_owner', applicationId: 'app_fifa', code: 'owner', name: 'fifa.owner' },
  { id: 'role_bobo_visitor', applicationId: 'app_bobo', code: 'visitor', name: 'bobo.visitor' },
]

async function main() {
  const owner = readOwnerSeedInput()
  const env = getMomoEnv()
  const logger = createLogger(env)

  configureDbClient({ env, logger: createChildLogger(logger, 'db') })

  const auth = createMomoAuth({ env, logger })

  await ensureApplications()
  await ensureApplicationAuthMethods()
  await ensureRoles()

  const ownerUser = await ensureOwnerUser(owner, auth)

  await ensureCredentialAccount(ownerUser.id)
  await ensureUserRole(ownerUser.id, 'role_fifa_owner')
  await ensureUserRole(ownerUser.id, 'role_bobo_visitor')

  console.log(`owner seed 已完成: ${owner.email}`)
}

function readOwnerSeedInput(): OwnerSeedInput {
  return {
    displayName: readRequiredEnv('OWNER_DISPLAY_NAME'),
    email: readRequiredEnv('OWNER_EMAIL'),
    password: readRequiredEnv('OWNER_PASSWORD'),
  }
}

function readRequiredEnv(key: string): string {
  const value = process.env[key]?.trim()

  if (!value) {
    throw new Error(`${key} 未设置`)
  }

  return value
}

async function ensureApplications(): Promise<void> {
  await getDb()
    .insert(applications)
    .values(appRecords)
    .onConflictDoUpdate({
      target: applications.id,
      set: {
        status: 'active',
        updatedAt: new Date(),
      },
    })
}

async function ensureApplicationAuthMethods(): Promise<void> {
  await getDb()
    .insert(applicationAuthMethods)
    .values(authMethodRecords)
    .onConflictDoUpdate({
      target: applicationAuthMethods.id,
      set: {
        status: 'active',
        updatedAt: new Date(),
      },
    })
}

async function ensureRoles(): Promise<void> {
  await getDb()
    .insert(roles)
    .values(roleRecords)
    .onConflictDoUpdate({
      target: roles.id,
      set: {
        updatedAt: new Date(),
      },
    })
}

async function ensureOwnerUser(owner: OwnerSeedInput, auth: MomoAuth): Promise<{ id: string }> {
  const existingUser = await findUserByEmail(owner.email)

  if (!existingUser) {
    const result = await auth.api.signUpEmail({
      body: {
        email: owner.email,
        name: owner.displayName,
        password: owner.password,
      },
    })

    return {
      id: result.user.id,
    }
  }

  await getDb()
    .update(user)
    .set({
      name: owner.displayName,
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(user.id, existingUser.id))

  return existingUser
}

async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  const rows = await getDb().select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1)

  return rows[0] ?? null
}

async function ensureCredentialAccount(userId: string): Promise<void> {
  const rows = await getDb()
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
    .limit(1)

  if (rows.length === 0) {
    throw new Error('owner 已存在但没有密码登录记录，请换一个 OWNER_EMAIL 或先手动处理账号')
  }
}

async function ensureUserRole(userId: string, roleId: string): Promise<void> {
  await getDb()
    .insert(userRoleBindings)
    .values({
      id: `user_role_${userId}_${roleId}`,
      roleId,
      status: 'active',
      userId,
    })
    .onConflictDoUpdate({
      target: [userRoleBindings.userId, userRoleBindings.roleId],
      set: {
        status: 'active',
        updatedAt: new Date(),
      },
    })
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
  })
