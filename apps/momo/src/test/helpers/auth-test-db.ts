import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { closeDb, getDb } from '#momo/infra/db/client'
import {
  account,
  applicationAuthMethods,
  applications,
  roles,
  user,
  userRoleBindings,
} from '#momo/infra/db/schema/index'
import { createLogger } from '#momo/infra/logger'
import { createMomoAuth } from '#momo/modules/auth/auth.config'
import { getMomoEnv } from '#momo/shared/env'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'

const TEST_DATABASE_NAME = 'momo_test'
const TEST_DATABASE_URL = 'postgres://momo:momo@localhost:55432/momo_test'
const ADMIN_DATABASE_URL = 'postgres://momo:momo@localhost:55432/postgres'
const migrationFiles = [
  '0000_watery_praxagora.sql',
  '0001_plain_cerise.sql',
  '0002_open_victor_mancha.sql',
  '0003_daffy_miek.sql',
]
let prepareDatabaseQueue = Promise.resolve()

export const TEST_USER_PASSWORD = 'test-password-123'

export interface TestAuthUser {
  email: string
  id: string
  name: string
}

export async function prepareAuthTestDatabase(): Promise<void> {
  if (process.env.DATABASE_URL !== TEST_DATABASE_URL) {
    throw new Error(`auth 集成测试只能连接 ${TEST_DATABASE_URL}`)
  }

  prepareDatabaseQueue = prepareDatabaseQueue.then(async () => {
    await closeDb()
    await ensureTestDatabase()
    await resetSchema()
  })

  await prepareDatabaseQueue
}

export async function resetAuthTestData(): Promise<void> {
  await getDb().execute(
    'TRUNCATE TABLE "content_preview_tokens", "content_post_revisions", "content_posts", "content_assets", "rate_limit", "verification", "session", "account", "user_role_bindings", "roles", "application_auth_methods", "applications", "user" RESTART IDENTITY CASCADE',
  )

  await seedAccessRecords()
}

export async function createCredentialUser(input: {
  email: string
  name?: string
  password?: string
}): Promise<TestAuthUser> {
  const env = getMomoEnv()
  const auth = createMomoAuth({
    env,
    logger: createLogger(env),
  })

  const result = await auth.api.signUpEmail({
    body: {
      email: input.email,
      name: input.name ?? input.email,
      password: input.password ?? TEST_USER_PASSWORD,
    },
  })

  return {
    email: input.email,
    id: result.user.id,
    name: result.user.name,
  }
}

export async function signInByEmail(app: AppRequestTarget, email: string): Promise<string> {
  const response = await app.request('/api/auth/sign-in/email', {
    body: JSON.stringify({
      email,
      password: TEST_USER_PASSWORD,
    }),
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:2333',
    },
    method: 'POST',
  })

  if (response.status !== 200) {
    throw new Error(`测试登录失败: ${response.status} ${await response.text()}`)
  }

  return toCookieHeader(response)
}

export async function bindFifaOwner(userId: string): Promise<void> {
  await getDb()
    .insert(userRoleBindings)
    .values({
      id: `user_role_${userId}_role_fifa_owner`,
      roleId: 'role_fifa_owner',
      status: 'active',
      userId,
    })
}

export async function removeCredentialAccount(userId: string): Promise<void> {
  await getDb().delete(account).where(eq(account.userId, userId))
}

export async function disableUser(userId: string): Promise<void> {
  await getDb().update(user).set({ status: 'disabled', updatedAt: new Date() }).where(eq(user.id, userId))
}

async function ensureTestDatabase(): Promise<void> {
  const sql = postgres(ADMIN_DATABASE_URL, { max: 1 })

  try {
    const rows = await sql<{ exists: boolean }[]>`
      SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${TEST_DATABASE_NAME}) AS "exists"
    `

    if (!rows[0]?.exists) {
      await sql.unsafe(`CREATE DATABASE ${TEST_DATABASE_NAME}`)
    }
  } finally {
    await sql.end()
  }
}

async function resetSchema(): Promise<void> {
  const sql = postgres(TEST_DATABASE_URL, { max: 1 })

  try {
    await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE')
    await sql.unsafe('CREATE SCHEMA public')
    await sql.unsafe('GRANT ALL ON SCHEMA public TO momo')

    for (const fileName of migrationFiles) {
      const migrationPath = fileURLToPath(new URL(`../../infra/db/migrations/${fileName}`, import.meta.url))
      const migrationSql = await readFile(migrationPath, 'utf8')

      for (const statement of migrationSql
        .split('--> statement-breakpoint')
        .map((part) => part.trim())
        .filter(Boolean)) {
        await sql.unsafe(statement)
      }
    }
  } finally {
    await sql.end()
  }
}

async function seedAccessRecords(): Promise<void> {
  await getDb()
    .insert(applications)
    .values([
      { id: 'app_fifa', code: 'fifa', name: 'Fifa' },
      { id: 'app_bobo', code: 'bobo', name: 'Bobo' },
    ])

  await getDb()
    .insert(applicationAuthMethods)
    .values([
      { id: 'auth_method_fifa_password', applicationId: 'app_fifa', provider: 'password' },
      { id: 'auth_method_bobo_github', applicationId: 'app_bobo', provider: 'github' },
      { id: 'auth_method_bobo_google', applicationId: 'app_bobo', provider: 'google' },
    ])

  await getDb()
    .insert(roles)
    .values([
      { id: 'role_fifa_owner', applicationId: 'app_fifa', code: 'owner', name: 'fifa.owner' },
      { id: 'role_bobo_visitor', applicationId: 'app_bobo', code: 'visitor', name: 'bobo.visitor' },
    ])
}

function toCookieHeader(response: Response): string {
  const setCookie = response.headers.get('set-cookie')

  if (!setCookie) {
    throw new Error('测试登录没有返回 set-cookie')
  }

  return setCookie
    .replaceAll(', better-auth.', '\nbetter-auth.')
    .split('\n')
    .map((cookie) => cookie.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ')
}

interface AppRequestTarget {
  request: (path: string, init?: RequestInit) => Promise<Response> | Response
}
