import type {
  PublicPostSummary,
  PublicProfile,
  PublicProjectSummary,
  SiteConfig,
  SiteNavigationItem,
} from '@xdd-zone/contracts'
import { PublicPostListResponseSchema, SiteConfigResponseSchema } from '@xdd-zone/contracts'
import { getPublicPosts as requestPublicPosts } from '@/lib/api/post.api'
import { getPublicSiteConfig as requestPublicSiteConfig } from '@/lib/api/site.api'
import { FALLBACK_PUBLIC_PROFILE, getPublicProfileOrFallback } from '@/lib/profile'
import { FALLBACK_PUBLIC_PROJECTS, getPublicProjectsOrFallback } from '@/lib/projects'
import { assertPublicCmsData, PublicCmsError } from '@/lib/public-cms-error'

export const FALLBACK_SITE_CONFIG = {
  homeSections: [
    { id: 'profile', order: 0, type: 'profile', visible: true },
    { id: 'writing', order: 10, type: 'writing', visible: true },
    { id: 'projects', order: 20, type: 'projects', visible: true },
  ],
  navigation: [
    { href: '/', id: 'home', label: '首页', order: 0, visible: true },
    { href: '/writing', id: 'writing', label: '文稿', order: 10, visible: true },
    { href: '/projects', id: 'projects', label: '项目', order: 20, visible: true },
    { href: '/search', id: 'search', label: '搜索', order: 30, visible: true },
  ],
  seo: {
    description: '我做 Web 产品、Agent 工具和内容系统。这里放近期文章、代表作品、碎碎念，以及一些正在打磨的技术实验。',
    title: '喜东东 - 独立开发者作品集',
  },
  siteKey: 'bobo',
  updatedAt: '2026-06-01T00:00:00.000Z',
} satisfies SiteConfig

export const FALLBACK_HOME_POSTS = [
  {
    category: null,
    coverAssetId: null,
    excerpt: null,
    id: 'fallback-post-content-system',
    publishedAt: '2026-06-01T00:00:00.000Z',
    slug: 'content-system',
    tags: [],
    title: '从一个页面开始整理自己的内容系统',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    category: null,
    coverAssetId: null,
    excerpt: null,
    id: 'fallback-post-typescript-boundaries',
    publishedAt: '2026-05-01T00:00:00.000Z',
    slug: 'typescript-boundaries',
    tags: [],
    title: 'TypeScript 全栈项目里我会先定哪些边界',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    category: null,
    coverAssetId: null,
    excerpt: null,
    id: 'fallback-post-agent-skills',
    publishedAt: '2026-04-01T00:00:00.000Z',
    slug: 'agent-skills-rules',
    tags: [],
    title: '给 Agent 写技能时，什么该写进规则',
    updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    category: null,
    coverAssetId: null,
    excerpt: null,
    id: 'fallback-post-daily-notes',
    publishedAt: null,
    slug: 'daily-notes',
    tags: [],
    title: '一些没那么正式的日常记录',
    updatedAt: '2026-04-01T00:00:00.000Z',
  },
] satisfies PublicPostSummary[]

export interface SiteShellData {
  navigation: SiteNavigationItem[]
  profile: PublicProfile
  site: SiteConfig
}

export interface HomePageData extends SiteShellData {
  posts: PublicPostSummary[]
  projects: PublicProjectSummary[]
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const body = await requestPublicSiteConfig()

  if (!body.ok) {
    throw new PublicCmsError('request-failed', body.error.message || 'Momo 站点配置接口暂时不可用。', body.error.code)
  }

  return assertPublicCmsData(body.data, SiteConfigResponseSchema, 'Momo 返回的站点配置格式不正确。').site
}

export async function getSiteShellData(): Promise<SiteShellData> {
  const [siteResult, profile] = await Promise.allSettled([getSiteConfig(), getPublicProfileOrFallback()])
  const site = siteResult.status === 'fulfilled' ? siteResult.value : FALLBACK_SITE_CONFIG

  return {
    navigation: readVisibleNavigation(site),
    profile: profile.status === 'fulfilled' ? profile.value : FALLBACK_PUBLIC_PROFILE,
    site,
  }
}

export async function getHomePageData(): Promise<HomePageData> {
  const [shell, projects, posts] = await Promise.allSettled([
    getSiteShellData(),
    getPublicProjectsOrFallback(),
    getHomePostsOrFallback(),
  ])
  const shellData = shell.status === 'fulfilled' ? shell.value : fallbackSiteShellData()

  return {
    ...shellData,
    posts: posts.status === 'fulfilled' ? posts.value : FALLBACK_HOME_POSTS,
    projects: projects.status === 'fulfilled' ? projects.value : FALLBACK_PUBLIC_PROJECTS,
  }
}

export function getSiteBaseUrl(): string {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  return vercelUrl ?? 'https://xidongdong.dev'
}

function readVisibleNavigation(site: SiteConfig): SiteNavigationItem[] {
  return site.navigation.filter((item) => item.visible).sort((a, b) => a.order - b.order)
}

function fallbackSiteShellData(): SiteShellData {
  return {
    navigation: readVisibleNavigation(FALLBACK_SITE_CONFIG),
    profile: FALLBACK_PUBLIC_PROFILE,
    site: FALLBACK_SITE_CONFIG,
  }
}

async function getHomePostsOrFallback(): Promise<PublicPostSummary[]> {
  try {
    const body = await requestPublicPosts({ pageSize: 4 })

    if (!body.ok) {
      return FALLBACK_HOME_POSTS
    }

    return assertPublicCmsData(body.data, PublicPostListResponseSchema, 'Momo 返回的公开文章列表格式不正确。').posts
  } catch {
    return FALLBACK_HOME_POSTS
  }
}
