import {
  createCategoryFixture,
  createIntegrationTestContext,
  createPostFixture,
  createTestSuffix,
  expectErrorResponse,
} from '@nexus/test'
import { afterEach, describe, expect, it } from 'bun:test'

const integration = createIntegrationTestContext()
const anonymousRunner = integration.anonymous

let archiveSequence = 0

interface PublicSiteFixture {
  archiveMonth: number
  archiveYear: number
  draftPostSlug: string
  hiddenCategoryPostSlug: string
  hiddenCategorySlug: string
  publishedPostId: string
  publishedPostSlug: string
  publishedTag: string
  uncategorizedPostSlug: string
  visibleCategorySlug: string
}

interface PublicSiteConfigBody {
  defaultSeoDescription: string | null
  defaultSeoTitle: string | null
  description: string | null
  favicon: string | null
  footerText: string | null
  logo: string | null
  socialLinks: Record<string, string>
  subtitle: string | null
  title: string
}

interface PublicSiteCategoryBody {
  description: string | null
  id: string
  name: string
  postCount: number
  slug: string
  sortOrder: number
}

interface PublicSitePostSummaryBody {
  category: {
    id: string
    name: string
    slug: string
  } | null
  createdAt: string
  excerpt: string | null
  id: string
  publishedAt: string
  slug: string
  tags: string[]
  title: string
  updatedAt: string
}

interface PublicSitePostListBody {
  items: PublicSitePostSummaryBody[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

async function createPublicSiteFixture(): Promise<PublicSiteFixture> {
  const suffix = createTestSuffix('public-site-routes')
  const publishedTag = `public-route-${suffix}`
  const sequence = archiveSequence++
  const archiveYear = 9000 + Math.floor(sequence / 12)
  const archiveMonth = (sequence % 12) + 1

  const visibleCategory = await createCategoryFixture({
    suffix,
    data: {
      name: `Public Visible ${suffix}`,
      slug: `public-visible-${suffix}`,
      isVisible: true,
    },
  })
  const hiddenCategory = await createCategoryFixture({
    suffix: `${suffix}-hidden`,
    data: {
      name: `Public Hidden ${suffix}`,
      slug: `public-hidden-${suffix}`,
      isVisible: false,
    },
  })

  integration.track.categoryId(visibleCategory.id)
  integration.track.categoryId(hiddenCategory.id)

  const publishedPost = await createPostFixture({
    suffix,
    data: {
      title: `Public Published ${suffix}`,
      slug: `public-published-${suffix}`,
      status: 'PUBLISHED',
      categoryId: visibleCategory.id,
      tags: [publishedTag],
      publishedAt: new Date(Date.UTC(archiveYear, archiveMonth - 1, 10)),
    },
  })
  const uncategorizedPost = await createPostFixture({
    suffix: `${suffix}-uncategorized`,
    data: {
      title: `Public Uncategorized ${suffix}`,
      slug: `public-uncategorized-${suffix}`,
      status: 'PUBLISHED',
      categoryId: null,
      tags: [publishedTag],
      publishedAt: new Date(Date.UTC(archiveYear, archiveMonth - 1, 11)),
    },
  })
  const hiddenCategoryPost = await createPostFixture({
    suffix: `${suffix}-hidden-post`,
    data: {
      title: `Public Hidden Post ${suffix}`,
      slug: `public-hidden-post-${suffix}`,
      status: 'PUBLISHED',
      categoryId: hiddenCategory.id,
      tags: [publishedTag],
      publishedAt: new Date(Date.UTC(archiveYear, archiveMonth - 1, 12)),
    },
  })
  const draftPost = await createPostFixture({
    suffix: `${suffix}-draft`,
    data: {
      title: `Public Draft ${suffix}`,
      slug: `public-draft-${suffix}`,
      status: 'DRAFT',
      categoryId: visibleCategory.id,
      tags: [publishedTag],
      publishedAt: null,
    },
  })

  integration.track.postId(publishedPost.id)
  integration.track.postId(uncategorizedPost.id)
  integration.track.postId(hiddenCategoryPost.id)
  integration.track.postId(draftPost.id)

  return {
    archiveMonth,
    archiveYear,
    draftPostSlug: draftPost.slug,
    hiddenCategoryPostSlug: hiddenCategoryPost.slug,
    hiddenCategorySlug: hiddenCategory.slug,
    publishedPostId: publishedPost.id,
    publishedPostSlug: publishedPost.slug,
    publishedTag,
    uncategorizedPostSlug: uncategorizedPost.slug,
    visibleCategorySlug: visibleCategory.slug,
  }
}

function expectPostListContract(body: PublicSitePostListBody, expected: { page: number; pageSize: number }) {
  expect(body).toMatchObject(expected)
  expect(typeof body.total).toBe('number')
  expect(typeof body.totalPages).toBe('number')
}

describe('public-site routes', () => {
  afterEach(async () => {
    await integration.cleanup()
  })

  describe('config', () => {
    it('config 应允许匿名访问并返回默认契约', async () => {
      const { response, body } = await integration.json<PublicSiteConfigBody>('/api/public-site/config')

      expect(response.status).toBe(200)
      expect(typeof body.title).toBe('string')
      expect(body).toHaveProperty('subtitle')
      expect(body).toHaveProperty('description')
      expect(body).toHaveProperty('logo')
      expect(body).toHaveProperty('favicon')
      expect(body).toHaveProperty('footerText')
      expect(body).toHaveProperty('defaultSeoTitle')
      expect(body).toHaveProperty('defaultSeoDescription')
      expect(body.socialLinks).toEqual(expect.any(Object))
    })
  })

  describe('categories', () => {
    it('categories 应允许匿名访问且只返回可见分类', async () => {
      const fixture = await createPublicSiteFixture()
      const { response, body } = await integration.json<PublicSiteCategoryBody[]>('/api/public-site/categories')
      const slugs = body.map((item) => item.slug)

      expect(response.status).toBe(200)
      expect(slugs).toContain(fixture.visibleCategorySlug)
      expect(slugs).not.toContain(fixture.hiddenCategorySlug)
      expect(body.every((item) => item.postCount >= 0)).toBe(true)
    })

    it('categories/:slug/posts 应允许匿名访问并过滤未分类文章', async () => {
      const fixture = await createPublicSiteFixture()
      const { response, body } = await integration.json<PublicSitePostListBody>(
        `/api/public-site/categories/${fixture.visibleCategorySlug}/posts?tag=${fixture.publishedTag}&page=1&pageSize=10`,
      )
      const slugs = body.items.map((item) => item.slug)

      expect(response.status).toBe(200)
      expectPostListContract(body, { page: 1, pageSize: 10 })
      expect(slugs).toContain(fixture.publishedPostSlug)
      expect(slugs).not.toContain(fixture.uncategorizedPostSlug)
      expect(slugs).not.toContain(fixture.hiddenCategoryPostSlug)
    })

    it('categories/:slug/posts 找不到可见分类时返回 404', async () => {
      const fixture = await createPublicSiteFixture()

      await expectErrorResponse(await anonymousRunner('/api/public-site/categories/missing-category-slug/posts'), {
        status: 404,
        message: '分类不存在',
      })
      await expectErrorResponse(await anonymousRunner(`/api/public-site/categories/${fixture.hiddenCategorySlug}/posts`), {
        status: 404,
        message: '分类不存在',
      })
    })
  })

  describe('archives', () => {
    it('archives 应允许匿名访问且只统计公开文章', async () => {
      const fixture = await createPublicSiteFixture()
      const { response, body } = await integration.json<{
        items: Array<{ count: number; months: Array<{ count: number; month: number; year: number }>; year: number }>
      }>('/api/public-site/archives')
      const yearItem = body.items.find((item) => item.year === fixture.archiveYear)
      const monthItem = yearItem?.months.find((item) => item.month === fixture.archiveMonth)

      expect(response.status).toBe(200)
      expect(yearItem?.count).toBe(2)
      expect(monthItem).toMatchObject({
        count: 2,
        month: fixture.archiveMonth,
        year: fixture.archiveYear,
      })
    })

    it('archives/posts 应过滤隐藏分类和草稿文章并返回分页元数据', async () => {
      const fixture = await createPublicSiteFixture()
      const { response, body } = await integration.json<PublicSitePostListBody>(
        `/api/public-site/archives/posts?year=${fixture.archiveYear}&month=${fixture.archiveMonth}&page=1&pageSize=1`,
      )
      const slugs = body.items.map((item) => item.slug)

      expect(response.status).toBe(200)
      expectPostListContract(body, { page: 1, pageSize: 1 })
      expect(body.total).toBe(2)
      expect(body.totalPages).toBe(2)
      expect(slugs).not.toContain(fixture.hiddenCategoryPostSlug)
      expect(slugs).not.toContain(fixture.draftPostSlug)
    })

    it('archives/posts 清理后不应再残留归档文章', async () => {
      const fixture = await createPublicSiteFixture()
      const beforeCleanup = await integration.json<PublicSitePostListBody>(
        `/api/public-site/archives/posts?year=${fixture.archiveYear}&month=${fixture.archiveMonth}&page=1&pageSize=10`,
      )

      expect(beforeCleanup.body.items.some((item) => item.slug === fixture.publishedPostSlug)).toBe(true)

      await integration.cleanup()

      const afterCleanup = await integration.json<PublicSitePostListBody>(
        `/api/public-site/archives/posts?year=${fixture.archiveYear}&month=${fixture.archiveMonth}&page=1&pageSize=10`,
      )

      expect(afterCleanup.response.status).toBe(200)
      expect(afterCleanup.body.items.some((item) => item.slug === fixture.publishedPostSlug)).toBe(false)
      expect(afterCleanup.body.items.some((item) => item.slug === fixture.uncategorizedPostSlug)).toBe(false)
    })
  })

  describe('posts', () => {
    it('posts 应过滤隐藏分类和草稿文章并返回分页元数据', async () => {
      const fixture = await createPublicSiteFixture()
      const { response, body } = await integration.json<PublicSitePostListBody>(
        `/api/public-site/posts?tag=${fixture.publishedTag}&page=1&pageSize=10`,
      )
      const slugs = body.items.map((item) => item.slug)

      expect(response.status).toBe(200)
      expectPostListContract(body, { page: 1, pageSize: 10 })
      expect(slugs).toContain(fixture.uncategorizedPostSlug)
      expect(slugs).toContain(fixture.publishedPostSlug)
      expect(slugs).not.toContain(fixture.hiddenCategoryPostSlug)
      expect(slugs).not.toContain(fixture.draftPostSlug)
    })

    it('posts 可以按隐藏分类 slug 查询且返回空结果', async () => {
      const fixture = await createPublicSiteFixture()
      const { response, body } = await integration.json<PublicSitePostListBody>(
        `/api/public-site/posts?categorySlug=${fixture.hiddenCategorySlug}&page=1&pageSize=10`,
      )

      expect(response.status).toBe(200)
      expectPostListContract(body, { page: 1, pageSize: 10 })
      expect(body.items).toEqual([])
      expect(body.total).toBe(0)
      expect(body.totalPages).toBe(0)
    })
  })

  describe('single post', () => {
    it('posts/:slug 应允许匿名访问并返回关键文章字段', async () => {
      const fixture = await createPublicSiteFixture()
      const { response, body } = await integration.json<PublicSitePostSummaryBody & { markdown: string }>(
        `/api/public-site/posts/${fixture.publishedPostSlug}`,
      )

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        id: fixture.publishedPostId,
        slug: fixture.publishedPostSlug,
      })
      expect(typeof body.markdown).toBe('string')
      expect(Array.isArray(body.tags)).toBe(true)
      expect(typeof body.publishedAt).toBe('string')
    })

    it('posts/:slug 找不到公开文章时返回 404', async () => {
      const fixture = await createPublicSiteFixture()

      await expectErrorResponse(await anonymousRunner('/api/public-site/posts/missing-post-slug'), {
        status: 404,
        message: '文章不存在',
      })
      await expectErrorResponse(await anonymousRunner(`/api/public-site/posts/${fixture.hiddenCategoryPostSlug}`), {
        status: 404,
        message: '文章不存在',
      })
      await expectErrorResponse(await anonymousRunner(`/api/public-site/posts/${fixture.draftPostSlug}`), {
        status: 404,
        message: '文章不存在',
      })
    })
  })

  describe('validation', () => {
    it('非法公开站点请求应返回 422', async () => {
      await expectErrorResponse(await anonymousRunner('/api/public-site/posts?page=0'), {
        status: 422,
        errorCode: 'VALIDATION',
      })
      await expectErrorResponse(await anonymousRunner('/api/public-site/archives/posts?year=bad'), {
        status: 422,
        errorCode: 'VALIDATION',
      })
      await expectErrorResponse(await anonymousRunner('/api/public-site/posts/BAD-SLUG'), {
        status: 422,
        errorCode: 'VALIDATION',
      })
    })
  })
})
