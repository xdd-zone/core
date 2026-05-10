import type { IntegrationRequestRunner } from '@nexus/test'
import type { PreviewMarkdownResponse } from './model'

import {
  createIntegrationTestContext,
  expectErrorResponse,
  seedBasePermissions,
} from '@nexus/test'
import { afterEach, beforeAll, describe, expect, it } from 'bun:test'
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

const integration = createIntegrationTestContext(TEST_APP_OPTIONS)
const anonymousRunner = integration.anonymous

async function requestPreview(body: unknown, runner: IntegrationRequestRunner = anonymousRunner) {
  return await runner('/api/preview/markdown', {
    method: 'POST',
    headers: integration.jsonHeaders(),
    body: JSON.stringify(body),
  })
}

describe('Preview routes', () => {
  beforeAll(async () => {
    await seedBasePermissions()
  })

  afterEach(async () => {
    await integration.cleanup()
  })

  it('拥有 WRITE_ALL 权限时应返回 Markdown 预览', async () => {
    const user = await integration.actor([PostPermissions.WRITE_ALL], { prefix: 'preview-user' })
    const response = await requestPreview(
      {
        markdown: '# 预览标题\n\n正文',
      },
      user,
    )

    expect(response.status).toBe(200)
    const body = (await response.json()) as PreviewMarkdownResponse
    expect(body.toc[0]?.slug).toBe('预览标题')
    expect(body.html).toContain('<h1 id="预览标题">预览标题</h1>')
  })

  it('未授予 WRITE_ALL 权限时应返回 403', async () => {
    const user = await integration.actor([], { prefix: 'preview-user' })
    const response = await requestPreview(
      {
        markdown: '# 预览标题',
      },
      user,
    )

    await expectErrorResponse(response, {
      status: 403,
      errorCode: 'FORBIDDEN',
    })
  })

  it('未登录访问应返回 401', async () => {
    const response = await requestPreview({
      markdown: '# 预览标题',
    })

    await expectErrorResponse(response, {
      status: 401,
      errorCode: 'UNAUTHORIZED',
    })
  })

  it('非法 coverImage 应返回 422', async () => {
    const user = await integration.actor([PostPermissions.WRITE_ALL], { prefix: 'preview-user' })
    const response = await requestPreview(
      {
        markdown: '# 预览标题',
        coverImage: 'bad-cover-image',
      },
      user,
    )

    await expectErrorResponse(response, {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })

  it('空 Markdown 应返回 422', async () => {
    const user = await integration.actor([PostPermissions.WRITE_ALL], { prefix: 'preview-user' })
    const response = await requestPreview(
      {
        markdown: ' ',
      },
      user,
    )

    await expectErrorResponse(response, {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })
})
