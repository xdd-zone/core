import type { IntegrationRequestRunner } from '@nexus/test'
import type { SiteConfigRecord } from './repository'

import {
  createIntegrationTestContext,
  expectErrorResponse,
  seedBasePermissions,
} from '@nexus/test'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { SiteConfigPermissions } from './permissions'
import { SiteConfigRepository } from './repository'

interface SiteConfigBody {
  createdAt: string
  defaultSeoDescription: string | null
  defaultSeoTitle: string | null
  description: string | null
  favicon: string | null
  footerText: string | null
  id: string
  logo: string | null
  socialLinks: Record<string, string>
  subtitle: string | null
  title: string
  updatedAt: string
}

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

const integration = createIntegrationTestContext(TEST_APP_OPTIONS)
const anonymousRunner = integration.anonymous

async function requestJson(path: string, method: string, body: unknown, runner: IntegrationRequestRunner = anonymousRunner) {
  return await runner(path, {
    method,
    headers: integration.jsonHeaders(),
    body: JSON.stringify(body),
  })
}

function expectSiteConfigContract(
  body: SiteConfigBody,
  expected: Partial<
    Pick<
      SiteConfigBody,
      | 'defaultSeoDescription'
      | 'defaultSeoTitle'
      | 'description'
      | 'favicon'
      | 'footerText'
      | 'logo'
      | 'subtitle'
      | 'title'
    >
  >,
) {
  expect(body).toMatchObject(expected)
  expect(body.id).toBe('default')
  expect(typeof body.createdAt).toBe('string')
  expect(typeof body.updatedAt).toBe('string')
  expect(body).toHaveProperty('socialLinks')
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

describe('site-config routes', () => {
  beforeAll(async () => {
    await seedBasePermissions()
    originalConfig = await SiteConfigRepository.findDefault()
  })

  afterEach(async () => {
    await integration.cleanup()
  })

  afterAll(async () => {
    await restoreSiteConfig(originalConfig)
  })

  describe('默认配置读取', () => {
    it('GET /api/site-config 应返回默认配置', async () => {
      await withSiteConfigSnapshot(async () => {
        await SiteConfigRepository.deleteDefault()
        const user = await integration.actor([SiteConfigPermissions.READ], { prefix: 'site-config-read' })

        const { response, body } = await integration.json<SiteConfigBody>('/api/site-config', {}, user)

        expect(response.status).toBe(200)
        expectSiteConfigContract(body, {
          defaultSeoDescription: null,
          defaultSeoTitle: null,
          description: null,
          favicon: null,
          footerText: null,
          logo: null,
          subtitle: null,
          title: 'XDD Zone',
        })
        expect(body.socialLinks).toEqual({})
      })
    })

    it('匿名访问应返回 401', async () => {
      const response = await anonymousRunner('/api/site-config')

      await expectErrorResponse(response, {
        status: 401,
      })
    })

    it('无权限用户访问应返回 403', async () => {
      const user = await integration.actor([], { prefix: 'site-config-forbidden' })
      const response = await user('/api/site-config')

      await expectErrorResponse(response, {
        status: 403,
      })
    })

    it('读写权限应分开判断读取权限', async () => {
      const readUser = await integration.actor([SiteConfigPermissions.READ], { prefix: 'site-config-read-only' })

      const { response, body } = await integration.json<SiteConfigBody>('/api/site-config', {}, readUser)

      expect(response.status).toBe(200)
      expectSiteConfigContract(body, {})

      await expectErrorResponse(
        await requestJson(
          '/api/site-config',
          'PUT',
          {
            title: 'Read Only XDD Zone',
          },
          readUser,
        ),
        {
          status: 403,
          message: '权限不足',
        },
      )
    })
  })

  describe('配置更新', () => {
    it('PUT /api/site-config 应返回更新后的完整配置', async () => {
      await withSiteConfigSnapshot(async () => {
        const before = await SiteConfigRepository.findDefault()
        const user = await integration.actor([SiteConfigPermissions.WRITE], { prefix: 'site-config-write' })

        const response = await requestJson(
          '/api/site-config',
          'PUT',
          {
            title: 'Updated XDD Zone',
          },
          user,
        )
        const body = (await response.json()) as SiteConfigBody

        expect(response.status).toBe(200)
        expectSiteConfigContract(body, {
          title: 'Updated XDD Zone',
        })
        expect(body.description).toBe(before?.description ?? null)
        expect(body.subtitle).toBe(before?.subtitle ?? null)
        expect(body.logo).toBe(before?.logo ?? null)
        expect(body.favicon).toBe(before?.favicon ?? null)
        expect(body.footerText).toBe(before?.footerText ?? null)
        expect(body.defaultSeoTitle).toBe(before?.defaultSeoTitle ?? null)
        expect(body.defaultSeoDescription).toBe(before?.defaultSeoDescription ?? null)
        expect(body.socialLinks).toEqual((before?.socialLinks as Record<string, string> | null | undefined) ?? {})
      })
    })

    it('读写权限应分开判断写入权限', async () => {
      await withSiteConfigSnapshot(async () => {
        const writeUser = await integration.actor([SiteConfigPermissions.WRITE], { prefix: 'site-config-write-only' })

        const writeResponse = await requestJson(
          '/api/site-config',
          'PUT',
          {
            title: 'Write Only XDD Zone',
          },
          writeUser,
        )
        const writeBody = (await writeResponse.json()) as SiteConfigBody

        expect(writeResponse.status).toBe(200)
        expectSiteConfigContract(writeBody, {
          title: 'Write Only XDD Zone',
        })

        await expectErrorResponse(await writeUser('/api/site-config'), {
          status: 403,
          message: '权限不足',
        })
      })
    })

    it('复杂字段应按 schema 写入并保留嵌套契约', async () => {
      await withSiteConfigSnapshot(async () => {
        const user = await integration.actor([SiteConfigPermissions.WRITE], { prefix: 'site-config-complex' })

        const response = await requestJson(
          '/api/site-config',
          'PUT',
          {
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
          },
          user,
        )
        const body = (await response.json()) as SiteConfigBody

        expect(response.status).toBe(200)
        expectSiteConfigContract(body, {
          defaultSeoDescription: 'SEO Description',
          defaultSeoTitle: 'SEO Title',
          description: '用于测试站点配置复杂字段',
          favicon: 'https://example.com/favicon.ico',
          footerText: 'Footer Text',
          logo: 'https://example.com/logo.png',
          subtitle: '后台站点',
          title: 'Complex XDD Zone',
        })
        expect(body.socialLinks).toEqual({
          github: 'https://github.com/xdd-zone',
          rss: 'https://example.com/rss.xml',
        })
      })
    })

    it('空对象社交链接和空字符串可空字段应按契约写入', async () => {
      await withSiteConfigSnapshot(async () => {
        const user = await integration.actor([SiteConfigPermissions.WRITE], { prefix: 'site-config-empty-values' })

        const response = await requestJson(
          '/api/site-config',
          'PUT',
          {
            title: 'Keep Title',
            subtitle: '',
            description: '',
            footerText: '',
            defaultSeoTitle: '',
            defaultSeoDescription: '',
            socialLinks: {},
          },
          user,
        )
        const body = (await response.json()) as SiteConfigBody

        expect(response.status).toBe(200)
        expectSiteConfigContract(body, {
          defaultSeoDescription: '',
          defaultSeoTitle: '',
          description: '',
          footerText: '',
          subtitle: '',
          title: 'Keep Title',
        })
        expect(body.socialLinks).toEqual({})
      })
    })

    it('匿名更新应返回 401', async () => {
      const response = await requestJson('/api/site-config', 'PUT', {
        title: 'Anonymous XDD Zone',
      })

      await expectErrorResponse(response, {
        status: 401,
      })
    })

    it('无权限用户更新应返回 403', async () => {
      const user = await integration.actor([], { prefix: 'site-config-put-forbidden' })
      const response = await requestJson(
        '/api/site-config',
        'PUT',
        {
          title: 'Forbidden XDD Zone',
        },
        user,
      )

      await expectErrorResponse(response, {
        status: 403,
      })
    })

    it('非法 URL 混合输入应返回 422', async () => {
      const user = await integration.actor([SiteConfigPermissions.WRITE], { prefix: 'site-config-invalid-url' })
      const response = await requestJson(
        '/api/site-config',
        'PUT',
        {
          title: 'Invalid Mix',
          logo: 'not-a-url',
          socialLinks: {
            github: 'https://github.com/xdd-zone',
            blog: 'not-a-url',
          },
        },
        user,
      )

      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    })

    it('非法复杂字段和空请求体应返回 422', async () => {
      const user = await integration.actor([SiteConfigPermissions.WRITE], { prefix: 'site-config-invalid-complex' })

      await expectErrorResponse(
        await requestJson(
          '/api/site-config',
          'PUT',
          {
            socialLinks: {
              github: 'not-a-url',
            },
          },
          user,
        ),
        {
          status: 422,
          errorCode: 'VALIDATION',
        },
      )

      await expectErrorResponse(
        await requestJson(
          '/api/site-config',
          'PUT',
          {},
          user,
        ),
        {
          status: 422,
          errorCode: 'VALIDATION',
        },
      )
    })
  })
})
