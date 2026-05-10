import {
  cleanupTestData,
  createCategoryFixture,
  createPostFixture,
  createTestApp,
  createTestRequest,
  createTestSuffix,
  expectErrorResponse,
  readJson,
} from '@nexus/test'
import { describe, expect, it } from 'bun:test'

const { app } = createTestApp()

let archiveSequence = 0

interface PublicSiteFixture {
  archiveMonth: number
  archiveYear: number
  categoryIds: string[]
  draftPostSlug: string
  hiddenCategoryPostSlug: string
  hiddenCategorySlug: string
  postIds: string[]
  publishedPostSlug: string
  publishedTag: string
  uncategorizedPostSlug: string
  visibleCategorySlug: string
}

async function createPublicSiteFixture(): Promise<PublicSiteFixture> {
  const suffix = createTestSuffix('public-site-routes')
  const publishedTag = `public-route-${suffix}`
  const sequence = archiveSequence++
  const archiveYear = 9000 + Math.floor(sequence / 12)
  const archiveMonth = (sequence % 12) + 1
  const categoryIds: string[] = []
  const postIds: string[] = []

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

  categoryIds.push(visibleCategory.id, hiddenCategory.id)

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

  postIds.push(publishedPost.id, uncategorizedPost.id, hiddenCategoryPost.id, draftPost.id)

  return {
    archiveMonth,
    archiveYear,
    categoryIds,
    draftPostSlug: draftPost.slug,
    hiddenCategoryPostSlug: hiddenCategoryPost.slug,
    hiddenCategorySlug: hiddenCategory.slug,
    postIds,
    publishedPostSlug: publishedPost.slug,
    publishedTag,
    uncategorizedPostSlug: uncategorizedPost.slug,
    visibleCategorySlug: visibleCategory.slug,
  }
}

describe('public-site routes', () => {

  it('config 应允许匿名访问', async () => {
    const response = await app.handle(createTestRequest('/api/public-site/config'))
    const body = await readJson<{ title: string }>(response)

    expect(response.status).toBe(200)
    expect(typeof body.title).toBe('string')
  })

  it('categories 应允许匿名访问且只返回可见分类', async () => {
    const fixture = await createPublicSiteFixture()

    try {
      const response = await app.handle(createTestRequest('/api/public-site/categories'))
      const body = await readJson<Array<{ slug: string }>>(response)
      const slugs = body.map((item) => item.slug)

      expect(response.status).toBe(200)
      expect(slugs).toContain(fixture.visibleCategorySlug)
      expect(slugs).not.toContain(fixture.hiddenCategorySlug)
    } finally {
      await cleanupTestData({
        postIds: fixture.postIds,
        categoryIds: fixture.categoryIds,
      })
    }
  })

  it('archives 应允许匿名访问且只统计公开文章', async () => {
    const fixture = await createPublicSiteFixture()

    try {
      const response = await app.handle(createTestRequest('/api/public-site/archives'))
      const body = await readJson<{ items: Array<{ year: number; months: Array<{ month: number; count: number }> }> }>(
        response,
      )
      const yearItem = body.items.find((item) => item.year === fixture.archiveYear)
      const monthItem = yearItem?.months.find((item) => item.month === fixture.archiveMonth)
      const postsResponse = await app.handle(
        createTestRequest(
          `/api/public-site/archives/posts?year=${fixture.archiveYear}&month=${fixture.archiveMonth}&pageSize=10`,
        ),
      )
      const postsBody = await readJson<{ items: Array<{ slug: string }> }>(postsResponse)
      const slugs = postsBody.items.map((item) => item.slug)

      expect(response.status).toBe(200)
      expect(postsResponse.status).toBe(200)
      expect(monthItem).toMatchObject({
        count: 2,
        month: fixture.archiveMonth,
      })
      expect(slugs).toContain(fixture.uncategorizedPostSlug)
      expect(slugs).toContain(fixture.publishedPostSlug)
      expect(slugs).not.toContain(fixture.hiddenCategoryPostSlug)
    } finally {
      await cleanupTestData({
        postIds: fixture.postIds,
        categoryIds: fixture.categoryIds,
      })
    }
  })

  it('archives/posts 应过滤隐藏分类和草稿文章', async () => {
    const fixture = await createPublicSiteFixture()

    try {
      const response = await app.handle(
        createTestRequest(`/api/public-site/archives/posts?year=${fixture.archiveYear}&month=${fixture.archiveMonth}&pageSize=10`),
      )
      const body = await readJson<{ items: Array<{ slug: string }> }>(response)
      const slugs = body.items.map((item) => item.slug)

      expect(response.status).toBe(200)
      expect(slugs).toContain(fixture.uncategorizedPostSlug)
      expect(slugs).toContain(fixture.publishedPostSlug)
      expect(slugs).not.toContain(fixture.hiddenCategoryPostSlug)
    } finally {
      await cleanupTestData({
        postIds: fixture.postIds,
        categoryIds: fixture.categoryIds,
      })
    }
  })

  it('posts 应过滤隐藏分类和草稿文章', async () => {
    const fixture = await createPublicSiteFixture()

    try {
      const response = await app.handle(createTestRequest(`/api/public-site/posts?tag=${fixture.publishedTag}`))
      const body = await readJson<{ items: Array<{ slug: string }> }>(response)
      const slugs = body.items.map((item) => item.slug)

      expect(response.status).toBe(200)
      expect(slugs).toContain(fixture.uncategorizedPostSlug)
      expect(slugs).toContain(fixture.publishedPostSlug)
      expect(slugs).not.toContain(fixture.hiddenCategoryPostSlug)
    } finally {
      await cleanupTestData({
        postIds: fixture.postIds,
        categoryIds: fixture.categoryIds,
      })
    }
  })

  it('posts/:slug 应允许匿名访问', async () => {
    const fixture = await createPublicSiteFixture()

    try {
      const response = await app.handle(createTestRequest(`/api/public-site/posts/${fixture.publishedPostSlug}`))
      const body = await readJson<{ slug: string; markdown: string }>(response)

      expect(response.status).toBe(200)
      expect(body.slug).toBe(fixture.publishedPostSlug)
      expect(typeof body.markdown).toBe('string')
    } finally {
      await cleanupTestData({
        postIds: fixture.postIds,
        categoryIds: fixture.categoryIds,
      })
    }
  })

  it('posts/:slug 找不到公开文章时返回 404', async () => {
    const fixture = await createPublicSiteFixture()

    try {
      await expectErrorResponse(await app.handle(createTestRequest('/api/public-site/posts/missing-post-slug')), {
        status: 404,
        message: '文章不存在',
      })
      await expectErrorResponse(await app.handle(createTestRequest(`/api/public-site/posts/${fixture.hiddenCategoryPostSlug}`)), {
        status: 404,
        message: '文章不存在',
      })
      await expectErrorResponse(await app.handle(createTestRequest(`/api/public-site/posts/${fixture.draftPostSlug}`)), {
        status: 404,
        message: '文章不存在',
      })
    } finally {
      await cleanupTestData({
        postIds: fixture.postIds,
        categoryIds: fixture.categoryIds,
      })
    }
  })

  it('categories/:slug/posts 应允许匿名访问', async () => {
    const fixture = await createPublicSiteFixture()

    try {
      const response = await app.handle(
        createTestRequest(`/api/public-site/categories/${fixture.visibleCategorySlug}/posts?tag=${fixture.publishedTag}`),
      )
      const body = await readJson<{ items: Array<{ slug: string }> }>(response)
      const slugs = body.items.map((item) => item.slug)

      expect(response.status).toBe(200)
      expect(slugs).toContain(fixture.publishedPostSlug)
      expect(slugs).not.toContain(fixture.uncategorizedPostSlug)
    } finally {
      await cleanupTestData({
        postIds: fixture.postIds,
        categoryIds: fixture.categoryIds,
      })
    }
  })

  it('categories/:slug/posts 找不到可见分类时返回 404', async () => {
    const fixture = await createPublicSiteFixture()

    try {
      await expectErrorResponse(
        await app.handle(createTestRequest('/api/public-site/categories/missing-category-slug/posts')),
        {
          status: 404,
          message: '分类不存在',
        },
      )
      await expectErrorResponse(
        await app.handle(createTestRequest(`/api/public-site/categories/${fixture.hiddenCategorySlug}/posts`)),
        {
          status: 404,
          message: '分类不存在',
        },
      )
    } finally {
      await cleanupTestData({
        postIds: fixture.postIds,
        categoryIds: fixture.categoryIds,
      })
    }
  })

  it('非法公开站点请求应返回 422', async () => {
    await expectErrorResponse(await app.handle(createTestRequest('/api/public-site/posts?page=0')), {
      status: 422,
      errorCode: 'VALIDATION',
    })
    await expectErrorResponse(await app.handle(createTestRequest('/api/public-site/archives/posts?year=bad')), {
      status: 422,
      errorCode: 'VALIDATION',
    })
    await expectErrorResponse(await app.handle(createTestRequest('/api/public-site/posts/BAD-SLUG')), {
      status: 422,
      errorCode: 'VALIDATION',
    })
  })
})
