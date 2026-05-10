import type { CookieFetcherSession } from '@nexus/test'
import type { SiteConfigRecord } from './repository'
import { prisma } from '@nexus/infra/database'
import {
  cleanupTestData,
  createCookieFetcher,
  createTestApp,
  createTestRequest,
  createTestSuffix,
  createUserFixture,
  expectErrorResponse,
  grantPermissionsToUser,
  readJson,
} from '@nexus/test'
import { hashPassword } from 'better-auth/crypto'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { SiteConfigPermissions } from './permissions'
import { SiteConfigRepository } from './repository'

const createdUserIds: string[] = []
const createdRoleIds: string[] = []
let originalConfig: SiteConfigRecord | null = null

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

const { app } = createTestApp(TEST_APP_OPTIONS)

interface SignedInUser {
  session: CookieFetcherSession
  userId: string
}

function createJsonRequest(path: string, method: string, body: unknown) {
  return createTestRequest(path, {
    method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

async function fetchJson(session: CookieFetcherSession, path: string, method: string, body: unknown) {
  return await session.fetcher(createTestRequest(path), {
    method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

async function restoreSiteConfig(snapshot: SiteConfigRecord | null) {
  if (snapshot) {
    await SiteConfigRepository.restoreDefault(snapshot)
  } else {
    await SiteConfigRepository.deleteDefault()
  }
}

async function withSiteConfigSnapshot(run: () => Promise<void>) {
  const configSnapshot = await SiteConfigRepository.findDefault()

  try {
    await run()
  } finally {
    await restoreSiteConfig(configSnapshot)
  }
}

async function createSignedInUser(prefix: string): Promise<SignedInUser> {
  const suffix = createTestSuffix(prefix)
  const password = `${prefix}-pass-123`
  const user = await createUserFixture({
    suffix,
    data: {
      email: `${suffix}@example.com`,
      name: `Site Config ${suffix}`,
    },
  })
  createdUserIds.push(user.id)

  await prisma.account.create({
    data: {
      userId: user.id,
      id: createTestSuffix(`${prefix}-account`),
      accountId: user.id,
      providerId: 'credential',
      password: await hashPassword(password),
    },
  })

  const session = createCookieFetcher(app)
  const response = await session.fetcher(
    createTestRequest('/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password,
      }),
    }),
  )

  expect(response.status).toBe(200)

  return {
    session,
    userId: user.id,
  }
}

describe('site-config routes', () => {
  beforeAll(async () => {
    originalConfig = await SiteConfigRepository.findDefault()
  })

  afterAll(async () => {
    if (originalConfig) {
      await SiteConfigRepository.restoreDefault(originalConfig)
    } else {
      await SiteConfigRepository.deleteDefault()
    }

    await cleanupTestData({
      userIds: createdUserIds,
      roleIds: createdRoleIds,
    })
  })

  it('GET /api/site-config 应返回默认配置', async () => {
    const configSnapshot = await SiteConfigRepository.findDefault()

    try {
      await SiteConfigRepository.deleteDefault()
      const user = await createSignedInUser('site-config-read')
      const grant = await grantPermissionsToUser(user.userId, [SiteConfigPermissions.READ])
      createdRoleIds.push(grant.role.id)

      const response = await user.session.fetcher(createTestRequest('/api/site-config'))
      const body = await readJson<{ title: string; socialLinks: Record<string, string> }>(response)

      expect(response.status).toBe(200)
      expect(body.title).toBe('XDD Zone')
      expect(body.socialLinks).toEqual({})
    } finally {
      await restoreSiteConfig(configSnapshot)
    }
  })

  it('PUT /api/site-config 应更新配置', async () => {
    await withSiteConfigSnapshot(async () => {
      const user = await createSignedInUser('site-config-write')
      const grant = await grantPermissionsToUser(user.userId, [SiteConfigPermissions.WRITE])
      createdRoleIds.push(grant.role.id)

      const response = await fetchJson(user.session, '/api/site-config', 'PUT', {
        title: 'Updated XDD Zone',
      })
      const body = await readJson<{ title: string; logo: string | null; socialLinks: Record<string, string> }>(response)

      expect(response.status).toBe(200)
      expect(body.title).toBe('Updated XDD Zone')
    })
  })

  it('匿名访问应返回 401', async () => {
    const response = await app.handle(createTestRequest('/api/site-config'))

    await expectErrorResponse(response, {
      status: 401,
    })
  })

  it('匿名更新应返回 401', async () => {
    const response = await app.handle(
      createJsonRequest('/api/site-config', 'PUT', {
        title: 'Anonymous XDD Zone',
      }),
    )

    await expectErrorResponse(response, {
      status: 401,
    })
  })

  it('无权限用户访问应返回 403', async () => {
    const user = await createSignedInUser('site-config-forbidden')

    const response = await user.session.fetcher(createTestRequest('/api/site-config'))

    await expectErrorResponse(response, {
      status: 403,
    })
  })

  it('无权限用户更新应返回 403', async () => {
    const user = await createSignedInUser('site-config-put-forbidden')

    const response = await fetchJson(user.session, '/api/site-config', 'PUT', {
      title: 'Forbidden XDD Zone',
    })

    await expectErrorResponse(response, {
      status: 403,
    })
  })

  it('读写权限应分开判断', async () => {
    const readUser = await createSignedInUser('site-config-read-only')
    const readGrant = await grantPermissionsToUser(readUser.userId, [SiteConfigPermissions.READ])
    createdRoleIds.push(readGrant.role.id)

    const readResponse = await readUser.session.fetcher(createTestRequest('/api/site-config'))
    expect(readResponse.status).toBe(200)

    await expectErrorResponse(
      await fetchJson(readUser.session, '/api/site-config', 'PUT', {
        title: 'Read Only XDD Zone',
      }),
      {
        status: 403,
        message: '权限不足',
      },
    )

    await withSiteConfigSnapshot(async () => {
      const writeUser = await createSignedInUser('site-config-write-only')
      const writeGrant = await grantPermissionsToUser(writeUser.userId, [SiteConfigPermissions.WRITE])
      createdRoleIds.push(writeGrant.role.id)

      const writeResponse = await fetchJson(writeUser.session, '/api/site-config', 'PUT', {
        title: 'Write Only XDD Zone',
      })
      expect(writeResponse.status).toBe(200)

      await expectErrorResponse(await writeUser.session.fetcher(createTestRequest('/api/site-config')), {
        status: 403,
        message: '权限不足',
      })
    })
  })

  it('复杂字段应按 schema 写入', async () => {
    await withSiteConfigSnapshot(async () => {
      const user = await createSignedInUser('site-config-complex')
      const grant = await grantPermissionsToUser(user.userId, [SiteConfigPermissions.WRITE])
      createdRoleIds.push(grant.role.id)

      const response = await fetchJson(user.session, '/api/site-config', 'PUT', {
        title: '  Complex XDD Zone  ',
        subtitle: '  后台站点  ',
        description: '用于测试站点配置复杂字段',
        logo: 'https://example.com/logo.png',
        favicon: 'https://example.com/favicon.ico',
        footerText: '  Footer Text  ',
        socialLinks: {
          github: 'https://github.com/xdd-zone',
          rss: 'https://example.com/rss.xml',
        },
        defaultSeoTitle: '  SEO Title  ',
        defaultSeoDescription: 'SEO Description',
      })
      const body = await readJson<{
        title: string
        subtitle: string | null
        footerText: string | null
        socialLinks: Record<string, string>
        defaultSeoTitle: string | null
      }>(response)

      expect(response.status).toBe(200)
      expect(body.title).toBe('Complex XDD Zone')
      expect(body.subtitle).toBe('后台站点')
      expect(body.footerText).toBe('Footer Text')
      expect(body.defaultSeoTitle).toBe('SEO Title')
      expect(body.socialLinks).toEqual({
        github: 'https://github.com/xdd-zone',
        rss: 'https://example.com/rss.xml',
      })
    })
  })

  it('非法 URL 应返回 422', async () => {
    const user = await createSignedInUser('site-config-invalid-url')
    const grant = await grantPermissionsToUser(user.userId, [SiteConfigPermissions.WRITE])
    createdRoleIds.push(grant.role.id)

    const response = await fetchJson(user.session, '/api/site-config', 'PUT', {
      logo: 'not-a-url',
    })

    await expectErrorResponse(response, {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })

  it('非法复杂字段应返回 422', async () => {
    const user = await createSignedInUser('site-config-invalid-complex')
    const grant = await grantPermissionsToUser(user.userId, [SiteConfigPermissions.WRITE])
    createdRoleIds.push(grant.role.id)

    await expectErrorResponse(
      await fetchJson(user.session, '/api/site-config', 'PUT', {
        socialLinks: {
          github: 'not-a-url',
        },
      }),
      {
        status: 422,
        errorCode: 'VALIDATION',
      },
    )

    await expectErrorResponse(await fetchJson(user.session, '/api/site-config', 'PUT', {}), {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })
})
