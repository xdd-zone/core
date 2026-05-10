import type { PermissionString } from '@nexus/core/permissions'
import type { CookieFetcherSession, TestApp } from '../../test'
import type { AuthSession } from '../auth/model'
import type { PreviewMarkdownResponse } from './model'

import { beforeAll, describe, expect, it } from 'bun:test'

import {
  cleanupTestData,
  createCookieFetcher,
  createTestApp,
  createTestRequest,
  createTestSuffix,
  expectErrorResponse,
  grantPermissionsToUser,
  readJson,
  seedBasePermissions,
} from '../../test'
import { PostPermissions } from '../post/permissions'

const TEST_APP_OPTIONS = {
  config: {
    auth: {
      methods: {
        emailPassword: {
          enabled: true,
          allowSignUp: true,
        },
      },
    },
    http: {
      requestLogger: {
        enabled: false,
      },
    },
    logger: {
      level: 'silent',
    },
  },
} as const

interface SignedInUser {
  session: CookieFetcherSession
  userId: string
}

async function signInTestUser(app: TestApp): Promise<SignedInUser> {
  const suffix = createTestSuffix('preview-user')
  const session = createCookieFetcher(app)
  const response = await session.fetcher('http://localhost/api/auth/sign-up/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: `${suffix}@example.com`,
      password: 'password123',
      name: `Preview User ${suffix}`,
    }),
  })

  expect(response.status).toBe(200)
  const body = await readJson<AuthSession>(response)

  return {
    session,
    userId: body.user.id,
  }
}

async function grantTestPermissions(userId: string, permissionKeys: readonly PermissionString[], roleIds: string[]) {
  const { role } = await grantPermissionsToUser(userId, permissionKeys, {
    roleName: createTestSuffix('preview-role'),
  })
  roleIds.push(role.id)
}

async function requestPreview(session: CookieFetcherSession, body: unknown) {
  return await session.fetcher('http://localhost/api/preview/markdown', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('Preview routes', () => {
  const { app } = createTestApp(TEST_APP_OPTIONS)

  beforeAll(async () => {
    await seedBasePermissions()
  })

  it('拥有 WRITE_ALL 权限时应返回 Markdown 预览', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.WRITE_ALL], roleIds)

      const response = await requestPreview(user.session, {
        markdown: '# 预览标题\n\n正文',
      })

      expect(response.status).toBe(200)
      const body = await readJson<PreviewMarkdownResponse>(response)
      expect(body.toc[0]?.slug).toBe('预览标题')
      expect(body.html).toContain('<h1 id="预览标题">预览标题</h1>')
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('未授予 WRITE_ALL 权限时应返回 403', async () => {
    const userIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)

      const response = await requestPreview(user.session, {
        markdown: '# 预览标题',
      })

      await expectErrorResponse(response, {
        status: 403,
        errorCode: 'FORBIDDEN',
      })
    } finally {
      await cleanupTestData({ userIds })
    }
  })

  it('未登录访问应返回 401', async () => {
    const response = await app.handle(
      createTestRequest('/api/preview/markdown', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          markdown: '# 预览标题',
        }),
      }),
    )

    await expectErrorResponse(response, {
      status: 401,
      errorCode: 'UNAUTHORIZED',
    })
  })

  it('非法 coverImage 应返回 422', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.WRITE_ALL], roleIds)

      const response = await requestPreview(user.session, {
        markdown: '# 预览标题',
        coverImage: 'bad-cover-image',
      })

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })

  it('空 Markdown 应返回 422', async () => {
    const userIds: string[] = []
    const roleIds: string[] = []

    try {
      const user = await signInTestUser(app)
      userIds.push(user.userId)
      await grantTestPermissions(user.userId, [PostPermissions.WRITE_ALL], roleIds)

      const response = await requestPreview(user.session, {
        markdown: ' ',
      })

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    } finally {
      await cleanupTestData({ roleIds, userIds })
    }
  })
})
