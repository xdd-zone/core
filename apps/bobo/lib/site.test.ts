import { BizCode } from '@xdd-zone/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPublicPosts: vi.fn(),
  getPublicProfile: vi.fn(),
  getPublicProjects: vi.fn(),
  getPublicSiteConfig: vi.fn(),
}))

vi.mock('@/lib/api/post.api', () => ({
  getPublicPosts: mocks.getPublicPosts,
}))

vi.mock('@/lib/api/profile.api', () => ({
  getPublicProfile: mocks.getPublicProfile,
}))

vi.mock('@/lib/api/projects.api', () => ({
  getPublicProjects: mocks.getPublicProjects,
}))

vi.mock('@/lib/api/site.api', () => ({
  getPublicSiteConfig: mocks.getPublicSiteConfig,
}))

const site = {
  homeSections: [
    { id: 'profile', order: 0, type: 'profile', visible: true },
    { id: 'projects', order: 20, type: 'projects', visible: true },
  ],
  navigation: [
    { href: '/hidden', id: 'hidden', label: '隐藏', order: 0, visible: false },
    { href: '/projects', id: 'projects', label: '项目', order: 20, visible: true },
    { href: '/', id: 'home', label: '首页', order: 0, visible: true },
  ],
  seo: {
    description: '公开站点说明。',
    title: 'XDD Zone',
  },
  siteKey: 'bobo',
  updatedAt: '2026-06-01T00:00:00.000Z',
}

const profile = {
  availableForWork: false,
  avatarAssetId: null,
  bio: '公开档案。',
  contactEmail: 'hi@example.com',
  displayName: '喜东东',
  location: null,
  socialLinks: [],
  updatedAt: '2026-06-01T00:00:00.000Z',
}

const project = {
  coverAssetId: null,
  description: '公开项目。',
  id: 'project-1',
  links: [],
  order: 0,
  publishedAt: '2026-06-01T00:00:00.000Z',
  slug: 'project-1',
  title: '项目一',
  updatedAt: '2026-06-01T00:00:00.000Z',
}

const post = {
  category: null,
  coverAssetId: null,
  excerpt: '公开文章。',
  id: 'post-1',
  publishedAt: '2026-06-01T00:00:00.000Z',
  slug: 'post-1',
  tags: [],
  title: '文章一',
  updatedAt: '2026-06-01T00:00:00.000Z',
}

describe('site domain', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取首页数据成功时组合 site/profile/projects/posts', async () => {
    const { getHomePageData } = await import('./site')

    mocks.getPublicSiteConfig.mockResolvedValue(ok({ site }))
    mocks.getPublicProfile.mockResolvedValue(ok({ profile }))
    mocks.getPublicProjects.mockResolvedValue(ok(createProjectListResponse([project])))
    mocks.getPublicPosts.mockResolvedValue(ok(createPostListResponse([post])))

    const data = await getHomePageData()

    expect(data.site.seo.title).toBe('XDD Zone')
    expect(data.profile.displayName).toBe('喜东东')
    expect(data.projects).toEqual([project])
    expect(data.posts).toEqual([post])
    expect(data.navigation.map((item) => item.id)).toEqual(['home', 'projects'])
  })

  it('momo 返回错误时首页数据使用静态 fallback', async () => {
    const { getHomePageData } = await import('./site')

    mocks.getPublicSiteConfig.mockResolvedValue(fail('site failed'))
    mocks.getPublicProfile.mockResolvedValue(fail('profile failed'))
    mocks.getPublicProjects.mockResolvedValue(fail('projects failed'))
    mocks.getPublicPosts.mockResolvedValue(fail('posts failed'))

    const data = await getHomePageData()

    expect(data.site.seo.title).toBe('喜东东 - 独立开发者作品集')
    expect(data.profile.displayName).toBe('喜东东')
    expect(data.projects.length).toBeGreaterThan(0)
    expect(data.posts.length).toBeGreaterThan(0)
  })
})

function ok<TData>(data: TData) {
  return {
    data,
    meta: { requestId: 'request-ok', timestamp: '2026-06-01T00:00:00.000Z' },
    ok: true,
  }
}

function fail(message: string) {
  return {
    error: {
      code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
      message,
    },
    meta: { requestId: 'request-fail', timestamp: '2026-06-01T00:00:00.000Z' },
    ok: false,
  }
}

function createPostListResponse(posts = [post]) {
  return {
    hasNextPage: false,
    hasPreviousPage: false,
    page: 1,
    pageSize: 4,
    posts,
    total: posts.length,
    totalPages: posts.length > 0 ? 1 : 0,
  }
}

function createProjectListResponse(projects = [project]) {
  return {
    hasNextPage: false,
    hasPreviousPage: false,
    page: 1,
    pageSize: 50,
    projects,
    total: projects.length,
    totalPages: projects.length > 0 ? 1 : 0,
  }
}
