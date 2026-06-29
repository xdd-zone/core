import type { MomoAuth } from '#momo/modules/auth/auth.config'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { closeDb, configureDbClient, getDb } from '#momo/infra/db/client'
import {
  account,
  applicationAuthMethods,
  applications,
  contentCategories,
  contentPostRevisions,
  contentPosts,
  contentPostTags,
  contentTags,
  llmUseCaseConfigs,
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

const llmUseCaseConfigRecords = [
  {
    apiFormat: 'chat_completions' as const,
    enabled: 0,
    id: 'llm_use_case_content_post_meta',
    model: 'gpt-5-mini',
    provider: 'none' as const,
    timeoutMs: 15000,
    useCase: 'content.post.meta' as const,
  },
]

const initialContentConfig = {
  categories: [
    {
      description: '按时间查看全部文章。',
      id: 'content_category_archive',
      name: '归档',
      slug: 'archive',
    },
    {
      description: '记录前端、后端和工程工具相关内容。',
      id: 'content_category_tech',
      name: '技术',
      slug: 'tech',
    },
    {
      description: '记录工具、环境和个人项目里的尝试。',
      id: 'content_category_tinkering',
      name: '折腾',
      slug: 'tinkering',
    },
    {
      description: '记录经历、见闻和阶段回顾。',
      id: 'content_category_experience',
      name: '经历',
      slug: 'experience',
    },
    {
      description: '记录界面、交互和视觉相关内容。',
      id: 'content_category_design',
      name: '设计',
      slug: 'design',
    },
  ],
  post: {
    categorySlug: 'tech',
    excerpt: '这里是 XDD Zone 的第一篇初始化文章，用来确认内容系统可以正常发布。',
    id: 'content_post_hello_xdd_zone',
    revisionId: 'content_revision_hello_xdd_zone_1',
    slug: 'hello-xdd-zone',
    source: [
      '# 你好，XDD Zone',
      '',
      '这是 Momo seed 脚本写入的第一篇文章。',
      '',
      '它用于确认分类、标签、文章草稿和发布版本都能正常写入数据库。',
      '',
      '后续可以在 Fifa 后台编辑或删除这篇文章。',
    ].join('\n'),
    tagSlugs: ['typescript', 'react', 'hono'],
    title: '你好，XDD Zone',
  },
  tags: [
    { id: 'content_tag_typescript', name: 'TypeScript', slug: 'typescript' },
    { id: 'content_tag_react', name: 'React', slug: 'react' },
    { id: 'content_tag_nextjs', name: 'Next.js', slug: 'nextjs' },
    { id: 'content_tag_nodejs', name: 'Node.js', slug: 'nodejs' },
    { id: 'content_tag_hono', name: 'Hono', slug: 'hono' },
    { id: 'content_tag_drizzle', name: 'Drizzle', slug: 'drizzle' },
    { id: 'content_tag_postgresql', name: 'PostgreSQL', slug: 'postgresql' },
    { id: 'content_tag_tailwind_css', name: 'Tailwind CSS', slug: 'tailwind-css' },
  ],
}

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
  await ensureLlmUseCaseConfigs()
  await ensureInitialContent(ownerUser.id)

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

async function ensureLlmUseCaseConfigs(): Promise<void> {
  await getDb()
    .insert(llmUseCaseConfigs)
    .values(llmUseCaseConfigRecords)
    .onConflictDoUpdate({
      target: llmUseCaseConfigs.useCase,
      set: {
        updatedAt: new Date(),
      },
    })
}

async function ensureInitialContent(userId: string): Promise<void> {
  const now = new Date()

  await getDb().transaction(async (tx) => {
    await tx
      .insert(contentCategories)
      .values(
        initialContentConfig.categories.map((category) => ({
          ...category,
          createdAt: now,
          createdBy: userId,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: contentCategories.slug,
        set: {
          description: sql`excluded.description`,
          name: sql`excluded.name`,
          updatedAt: now,
        },
      })

    await tx
      .insert(contentTags)
      .values(
        initialContentConfig.tags.map((tag) => ({
          ...tag,
          createdAt: now,
          createdBy: userId,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: contentTags.slug,
        set: {
          name: sql`excluded.name`,
          updatedAt: now,
        },
      })

    const categoryBySlug = await selectCategoryIdsBySlug(
      initialContentConfig.categories.map((category) => category.slug),
      tx,
    )
    const tagBySlug = await selectTagIdsBySlug(
      initialContentConfig.tags.map((tag) => tag.slug),
      tx,
    )
    const categoryId = categoryBySlug.get(initialContentConfig.post.categorySlug)
    const tagIds = initialContentConfig.post.tagSlugs.map((tagSlug) => tagBySlug.get(tagSlug)).filter(isString)

    if (!categoryId) {
      throw new Error(`初始化文章分类不存在: ${initialContentConfig.post.categorySlug}`)
    }

    if (tagIds.length !== initialContentConfig.post.tagSlugs.length) {
      throw new Error(`初始化文章标签不存在: ${initialContentConfig.post.tagSlugs.join(', ')}`)
    }

    await tx
      .insert(contentPosts)
      .values({
        categoryId,
        createdAt: now,
        createdBy: userId,
        draftRevisionId: initialContentConfig.post.revisionId,
        excerpt: initialContentConfig.post.excerpt,
        id: initialContentConfig.post.id,
        publishedAt: now,
        publishedBy: userId,
        publishedRevisionId: initialContentConfig.post.revisionId,
        slug: initialContentConfig.post.slug,
        status: 'published',
        title: initialContentConfig.post.title,
        updatedAt: now,
        updatedBy: userId,
      })
      .onConflictDoUpdate({
        target: contentPosts.slug,
        set: {
          categoryId,
          excerpt: sql`excluded.excerpt`,
          publishedAt: sql`coalesce(${contentPosts.publishedAt}, excluded.published_at)`,
          publishedBy: sql`coalesce(${contentPosts.publishedBy}, excluded.published_by)`,
          status: 'published',
          title: sql`excluded.title`,
          updatedAt: now,
          updatedBy: userId,
        },
      })

    const postId = await selectPostIdBySlug(initialContentConfig.post.slug, tx)
    if (!postId) {
      throw new Error(`初始化文章不存在: ${initialContentConfig.post.slug}`)
    }

    await tx
      .insert(contentPostRevisions)
      .values({
        createdAt: now,
        createdBy: userId,
        excerpt: initialContentConfig.post.excerpt,
        id: initialContentConfig.post.revisionId,
        postId,
        revisionNo: 1,
        source: initialContentConfig.post.source,
        title: initialContentConfig.post.title,
      })
      .onConflictDoUpdate({
        target: contentPostRevisions.id,
        set: {
          excerpt: sql`excluded.excerpt`,
          source: sql`excluded.source`,
          title: sql`excluded.title`,
        },
      })

    await tx
      .update(contentPosts)
      .set({
        draftRevisionId: initialContentConfig.post.revisionId,
        publishedRevisionId: initialContentConfig.post.revisionId,
        updatedAt: now,
      })
      .where(eq(contentPosts.id, postId))

    await tx
      .insert(contentPostTags)
      .values(
        tagIds.map((tagId) => ({
          createdAt: now,
          postId,
          tagId,
        })),
      )
      .onConflictDoNothing()
  })
}

async function selectCategoryIdsBySlug(
  slugs: string[],
  db: Pick<ReturnType<typeof getDb>, 'select'>,
): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: contentCategories.id, slug: contentCategories.slug })
    .from(contentCategories)
    .where(inArray(contentCategories.slug, slugs))

  return new Map(rows.map((row) => [row.slug, row.id]))
}

async function selectTagIdsBySlug(
  slugs: string[],
  db: Pick<ReturnType<typeof getDb>, 'select'>,
): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: contentTags.id, slug: contentTags.slug })
    .from(contentTags)
    .where(inArray(contentTags.slug, slugs))

  return new Map(rows.map((row) => [row.slug, row.id]))
}

async function selectPostIdBySlug(slug: string, db: Pick<ReturnType<typeof getDb>, 'select'>): Promise<string | null> {
  const rows = await db.select({ id: contentPosts.id }).from(contentPosts).where(eq(contentPosts.slug, slug)).limit(1)

  return rows[0]?.id ?? null
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string'
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
  })
