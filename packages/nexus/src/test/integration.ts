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

export interface IntegrationActor extends IntegrationRequestRunner {
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

export interface IntegrationTrackInput {
  userId?: string | null
  roleId?: string | null
  postId?: string | null
  categoryId?: string | null
  commentId?: string | null
  mediaId?: string | null
}

export interface IntegrationTestContextOptions extends TestAppOptions {
  prisma?: PrismaClient
}

function createJsonHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init)
  headers.set('content-type', 'application/json')
  return headers
}

function pushTrackedId(target: string[], value?: string | null) {
  if (value && !target.includes(value)) {
    target.push(value)
  }
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

  const anonymous: IntegrationRequestRunner = async (path, init) => await app.handle(createTestRequest(path, init))

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
      forget(input: IntegrationTrackInput) {
        if (input.userId) tracked.userIds = tracked.userIds.filter((id) => id !== input.userId)
        if (input.roleId) tracked.roleIds = tracked.roleIds.filter((id) => id !== input.roleId)
        if (input.postId) tracked.postIds = tracked.postIds.filter((id) => id !== input.postId)
        if (input.categoryId) tracked.categoryIds = tracked.categoryIds.filter((id) => id !== input.categoryId)
        if (input.commentId) tracked.commentIds = tracked.commentIds.filter((id) => id !== input.commentId)
        if (input.mediaId) tracked.mediaIds = tracked.mediaIds.filter((id) => id !== input.mediaId)
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
  )

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

    return Object.assign(
      async (path: string, init?: RequestInit) => await session.fetcher(new URL(path, 'http://localhost').toString(), init),
      {
        client,
        session,
        userId,
      },
    )
  }

  async function json<TBody>(
    path: string,
    init: RequestInit = {},
    runner: IntegrationRequestRunner = anonymous,
  ): Promise<IntegrationJsonResult<TBody>> {
    const response = await runner(path, init)

    return {
      response,
      body: await readJson<TBody>(response),
    }
  }

  async function cleanup() {
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
    json,
    jsonHeaders: createJsonHeaders,
    track,
    cleanup,
  }
}
