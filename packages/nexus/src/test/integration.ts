import type { PrismaClient } from '@nexus-prisma/generated/client'
import type { PermissionString } from '@nexus/core/permissions'
import type { TestAppOptions } from './app'
import type { CookieFetcherSession, TestEdenClient } from './eden'

import { expect } from 'bun:test'

import { prisma as defaultPrisma } from '../infra/database'
import { createTestApp, createTestRequest, readJson } from './app'
import { cleanupTestData, createTestSuffix } from './db'
import { createCookieClient } from './eden'
import { grantPermissionsToUser } from './permissions'

export type IntegrationRequestRunner = (path: string, init?: RequestInit) => Promise<Response>
export type IntegrationTrackedValue = string | { id: string | null | undefined } | null | undefined

export interface IntegrationRequestHelpers {
  json: <TBody>(path: string, init?: RequestInit) => Promise<IntegrationJsonResult<TBody>>
  requestJson: <TBody>(path: string, init?: IntegrationJsonRequestInit) => Promise<IntegrationJsonResult<TBody>>
}

export interface IntegrationActor extends IntegrationRequestRunner, IntegrationRequestHelpers {
  client: TestEdenClient
  session: CookieFetcherSession
  userId: string
}

export interface IntegrationActorOptions {
  prefix?: string
  email?: string
  password?: string
  name?: string
  roleName?: string
  assignedBy?: string | null | 'self'
}

export interface IntegrationJsonResult<TBody> {
  response: Response
  body: TBody
}

export interface IntegrationJsonRequestInit extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export interface IntegrationTrackInput {
  userId?: IntegrationTrackedValue
  roleId?: IntegrationTrackedValue
  postId?: IntegrationTrackedValue
  categoryId?: IntegrationTrackedValue
  commentId?: IntegrationTrackedValue
  mediaId?: IntegrationTrackedValue
}

export interface IntegrationTestContextOptions extends TestAppOptions {
  prisma?: PrismaClient
}

function createJsonHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init)
  headers.set('content-type', 'application/json')
  return headers
}

function createRequestJsonInit(init: IntegrationJsonRequestInit = {}): RequestInit {
  return {
    ...init,
    headers: createJsonHeaders(init.headers),
    body: init.body === undefined ? undefined : (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)),
  }
}

function resolveTrackedId(value?: IntegrationTrackedValue) {
  if (!value) {
    return undefined
  }

  return typeof value === 'string' ? value : (value.id ?? undefined)
}

function pushTrackedId(target: string[], value?: IntegrationTrackedValue) {
  const resolvedId = resolveTrackedId(value)
  if (resolvedId && !target.includes(resolvedId)) {
    target.push(resolvedId)
  }
}

function forgetTrackedId(target: string[], value?: IntegrationTrackedValue) {
  const resolvedId = resolveTrackedId(value)
  if (!resolvedId) {
    return
  }

  const nextIds = target.filter((id) => id !== resolvedId)
  target.splice(0, target.length, ...nextIds)
}

export interface IntegrationTrackHelper {
  (input: IntegrationTrackInput): void
  userId: (id: string | null | undefined) => void
  roleId: (id: string | null | undefined) => void
  postId: (id: string | null | undefined) => void
  categoryId: (id: string | null | undefined) => void
  commentId: (id: string | null | undefined) => void
  mediaId: (id: string | null | undefined) => void
  user: (value: IntegrationTrackedValue) => void
  role: (value: IntegrationTrackedValue) => void
  post: (value: IntegrationTrackedValue) => void
  category: (value: IntegrationTrackedValue) => void
  comment: (value: IntegrationTrackedValue) => void
  media: (value: IntegrationTrackedValue) => void
  forget: (input: IntegrationTrackInput) => void
  snapshot: () => {
    userIds: string[]
    roleIds: string[]
    postIds: string[]
    categoryIds: string[]
    commentIds: string[]
    mediaIds: string[]
  }
}

function attachRunnerHelpers<T extends IntegrationRequestRunner>(
  runner: T,
  helpers: IntegrationRequestHelpers,
): T & IntegrationRequestHelpers {
  return Object.assign(runner, helpers)
}

function createRunnerHelpers(runner: IntegrationRequestRunner) {
  return {
    json: async <TBody>(path: string, init: RequestInit = {}) => await json<TBody>(path, init, runner),
    requestJson: async <TBody>(path: string, init: IntegrationJsonRequestInit = {}) =>
      await requestJson<TBody>(path, init, runner),
  } satisfies IntegrationRequestHelpers
}

function createActorRunner(
  session: CookieFetcherSession,
  client: TestEdenClient,
  userId: string,
): IntegrationActor {
  const runner = attachRunnerHelpers(
    async (path: string, init?: RequestInit) => await session.fetcher(new URL(path, 'http://localhost').toString(), init),
    createRunnerHelpers(async (path: string, init?: RequestInit) =>
      await session.fetcher(new URL(path, 'http://localhost').toString(), init),
    ),
  )

  return Object.assign(runner, {
    client,
    session,
    userId,
  })
}

async function json<TBody>(
  path: string,
  init: RequestInit = {},
  runner: IntegrationRequestRunner,
): Promise<IntegrationJsonResult<TBody>> {
  const response = await runner(path, init)

  return {
    response,
    body: await readJson<TBody>(response),
  }
}

async function requestJson<TBody>(
  path: string,
  init: IntegrationJsonRequestInit = {},
  runner: IntegrationRequestRunner,
): Promise<IntegrationJsonResult<TBody>> {
  return await json<TBody>(path, createRequestJsonInit(init), runner)
}

export function createIntegrationTestContext(options: IntegrationTestContextOptions = {}) {
  const { prisma = defaultPrisma, ...appOptions } = options
  const { app, context } = createTestApp(appOptions)
  const tracked = {
    userIds: [] as string[],
    roleIds: [] as string[],
    postIds: [] as string[],
    categoryIds: [] as string[],
    commentIds: [] as string[],
    mediaIds: [] as string[],
  }

  const anonymous = attachRunnerHelpers(
    async (path: string, init?: RequestInit) => await app.handle(createTestRequest(path, init)),
    createRunnerHelpers(async (path: string, init?: RequestInit) => await app.handle(createTestRequest(path, init))),
  )

  const track = Object.assign(
    (input: IntegrationTrackInput) => {
      pushTrackedId(tracked.userIds, input.userId)
      pushTrackedId(tracked.roleIds, input.roleId)
      pushTrackedId(tracked.postIds, input.postId)
      pushTrackedId(tracked.categoryIds, input.categoryId)
      pushTrackedId(tracked.commentIds, input.commentId)
      pushTrackedId(tracked.mediaIds, input.mediaId)
    },
    {
      userId(id: string | null | undefined) {
        pushTrackedId(tracked.userIds, id)
      },
      roleId(id: string | null | undefined) {
        pushTrackedId(tracked.roleIds, id)
      },
      postId(id: string | null | undefined) {
        pushTrackedId(tracked.postIds, id)
      },
      categoryId(id: string | null | undefined) {
        pushTrackedId(tracked.categoryIds, id)
      },
      commentId(id: string | null | undefined) {
        pushTrackedId(tracked.commentIds, id)
      },
      mediaId(id: string | null | undefined) {
        pushTrackedId(tracked.mediaIds, id)
      },
      user(value: IntegrationTrackedValue) {
        pushTrackedId(tracked.userIds, value)
      },
      role(value: IntegrationTrackedValue) {
        pushTrackedId(tracked.roleIds, value)
      },
      post(value: IntegrationTrackedValue) {
        pushTrackedId(tracked.postIds, value)
      },
      category(value: IntegrationTrackedValue) {
        pushTrackedId(tracked.categoryIds, value)
      },
      comment(value: IntegrationTrackedValue) {
        pushTrackedId(tracked.commentIds, value)
      },
      media(value: IntegrationTrackedValue) {
        pushTrackedId(tracked.mediaIds, value)
      },
      forget(input: IntegrationTrackInput) {
        forgetTrackedId(tracked.userIds, input.userId)
        forgetTrackedId(tracked.roleIds, input.roleId)
        forgetTrackedId(tracked.postIds, input.postId)
        forgetTrackedId(tracked.categoryIds, input.categoryId)
        forgetTrackedId(tracked.commentIds, input.commentId)
        forgetTrackedId(tracked.mediaIds, input.mediaId)
      },
      snapshot() {
        return {
          userIds: [...tracked.userIds],
          roleIds: [...tracked.roleIds],
          postIds: [...tracked.postIds],
          categoryIds: [...tracked.categoryIds],
          commentIds: [...tracked.commentIds],
          mediaIds: [...tracked.mediaIds],
        }
      },
    },
  ) satisfies IntegrationTrackHelper

  async function actor(
    permissionKeys: readonly PermissionString[] = [],
    actorOptions: IntegrationActorOptions = {},
  ): Promise<IntegrationActor> {
    const { client, session } = createCookieClient(app)
    const suffix = createTestSuffix(actorOptions.prefix ?? 'actor')
    const password = actorOptions.password ?? 'test-password-123'
    const result = await client.api.auth['sign-up'].email.post({
      email: actorOptions.email ?? `${suffix}@example.com`,
      password,
      name: actorOptions.name ?? `Test Actor ${suffix}`,
    })

    expect(result.status).toBe(200)
    expect(result.error).toBeNull()

    const userId = result.data?.user?.id
    expect(userId).toBeTruthy()
    if (!userId) {
      throw new Error('缺少测试用户 ID')
    }

    track.userId(userId)

    if (permissionKeys.length > 0) {
      const { role } = await grantPermissionsToUser(
        userId,
        permissionKeys,
        {
          roleName: actorOptions.roleName ?? createTestSuffix(`${actorOptions.prefix ?? 'actor'}-role`),
          assignedBy: actorOptions.assignedBy === 'self' ? userId : (actorOptions.assignedBy ?? null),
        },
        prisma,
      )
      track.roleId(role.id)
    }

    return createActorRunner(session, client, userId)
  }

  async function jsonWithRunner<TBody>(
    path: string,
    init: RequestInit = {},
    runner: IntegrationRequestRunner = anonymous,
  ) {
    return await json<TBody>(path, init, runner)
  }

  async function requestJsonWithRunner<TBody>(
    path: string,
    init: IntegrationJsonRequestInit = {},
    runner: IntegrationRequestRunner = anonymous,
  ) {
    return await requestJson<TBody>(path, init, runner)
  }

  const signInAs = actor

  async function cleanup() {
    // 先按快照里的依赖顺序删关联数据，再清空本地跟踪状态，避免漏删后续依赖记录。
    await cleanupTestData(track.snapshot(), prisma)

    tracked.userIds = []
    tracked.roleIds = []
    tracked.postIds = []
    tracked.categoryIds = []
    tracked.commentIds = []
    tracked.mediaIds = []
  }

  return {
    app,
    context,
    anonymous,
    actor,
    signInAs,
    json: jsonWithRunner,
    requestJson: requestJsonWithRunner,
    jsonHeaders: createJsonHeaders,
    track,
    cleanup,
  }
}
