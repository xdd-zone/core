import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import { closeDb, getDb } from '#momo/infra/db/client'
import {
  account,
  applicationAuthMethods,
  applications,
  llmProviders,
  llmUseCaseConfigs,
  publicProfiles,
  roles,
  siteConfigs,
  user,
  userProfiles,
  userRoleBindings,
} from '#momo/infra/db/schema/index'
import { createLogger } from '#momo/infra/logger'
import { createMomoAuth } from '#momo/modules/auth/auth.config'
import { getMomoEnv } from '#momo/shared/env'

const TEST_DATABASE_NAME = 'momo_test'
const TEST_DATABASE_URL = 'postgres://momo:momo@localhost:55432/momo_test'
const ADMIN_DATABASE_URL = 'postgres://momo:momo@localhost:55432/postgres'
const migrationFiles = [
  '0000_watery_praxagora.sql',
  '0001_plain_cerise.sql',
  '0002_open_victor_mancha.sql',
  '0003_daffy_miek.sql',
  '0004_high_vapor.sql',
  '0005_puzzling_wasp.sql',
  '0006_typical_wither.sql',
  '0007_smiling_katie_power.sql',
  '0008_user_profiles.sql',
  '0009_site_cms_foundation.sql',
  '0010_public_profile_site_fields.sql',
  '0011_generic_preview_tokens.sql',
  '0012_site_cms_final_shape.sql',
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
    'TRUNCATE TABLE "event_outbox", "projects", "public_profiles", "site_configs", "llm_call_logs", "llm_use_case_configs", "llm_providers", "content_preview_tokens", "content_post_revisions", "content_post_published_tags", "content_post_draft_tags", "content_posts", "content_tags", "content_categories", "assets", "rate_limit", "verification", "session", "account", "user_profiles", "user_role_bindings", "roles", "application_auth_methods", "applications", "user" RESTART IDENTITY CASCADE',
  )

  await seedAccessRecords()
  await seedLlmUseCaseConfigs()
  await seedSiteCmsDefaults()
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

export async function updateBetterAuthUserProfile(
  userId: string,
  input: { image: string | null; name: string },
): Promise<void> {
  await getDb()
    .update(user)
    .set({ image: input.image, name: input.name, updatedAt: new Date() })
    .where(eq(user.id, userId))
}

export async function getUserProfile(
  userId: string,
): Promise<{ avatarUrl: string | null; displayName: string } | null> {
  const rows = await getDb()
    .select({
      avatarUrl: userProfiles.avatarUrl,
      displayName: userProfiles.displayName,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)

  return rows[0] ?? null
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

async function seedLlmUseCaseConfigs(): Promise<void> {
  await getDb().insert(llmProviders).values({
    apiFormat: 'chat_completions',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-5-mini',
    enabled: 0,
    id: 'llm_provider_default',
    name: '默认 OpenAI 兼容服务',
    providerType: 'openai',
    timeoutMs: 15000,
  })

  await getDb().insert(llmUseCaseConfigs).values({
    enabled: 0,
    id: 'llm_use_case_content_post_meta',
    model: 'gpt-5-mini',
    providerId: 'llm_provider_default',
    useCase: 'content.post.meta',
  })
}

async function seedSiteCmsDefaults(): Promise<void> {
  await getDb()
    .insert(siteConfigs)
    .values({
      homeSections: [
        { id: 'profile', order: 0, type: 'profile', visible: true },
        { id: 'writing', order: 10, type: 'writing', visible: true },
        { id: 'projects', order: 20, type: 'projects', visible: true },
      ],
      navigation: [
        { href: '/', id: 'home', label: '首页', order: 0, visible: true },
        { href: '/writing', id: 'writing', label: '文稿', order: 10, visible: true },
        { href: '/projects', id: 'projects', label: '项目', order: 20, visible: true },
      ],
      seo: {
        description: '喜东东的个人站',
        title: 'XDD Zone',
      },
      siteKey: 'bobo',
    })

  await getDb().insert(publicProfiles).values({
    displayName: '喜东东',
    id: 'bobo',
    socialLinks: [],
  })
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
