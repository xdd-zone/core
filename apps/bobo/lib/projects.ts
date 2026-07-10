import type { PublicProjectListResponse, PublicProjectSummary } from '@xdd-zone/contracts'
import { PublicProjectListResponseSchema, PublicProjectResponseSchema } from '@xdd-zone/contracts'
import {
  getPublicProject as requestPublicProject,
  getPublicProjects as requestPublicProjects,
} from '@/lib/api/projects.api'
import { assertPublicCmsData, PublicCmsError } from '@/lib/public-cms-error'

const PROJECT_PAGE_SIZE = 8
const PROJECT_FULL_LIST_PAGE_SIZE = 50

export const FALLBACK_PUBLIC_PROJECTS = [
  {
    coverAssetId: null,
    description: '把本地项目、设计产物和 Agent 流程放在一个可见的工作区里。',
    id: 'fallback-open-design-workbench',
    links: [],
    order: 0,
    publishedAt: '2026-06-01T00:00:00.000Z',
    slug: 'open-design-workbench',
    title: 'Open Design 工作台',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    coverAssetId: null,
    description: '文章、作品、碎碎念统一发布，首页先突出最近发生的事。',
    id: 'fallback-personal-site-system',
    links: [],
    order: 10,
    publishedAt: '2026-06-01T00:00:00.000Z',
    slug: 'personal-site-system',
    title: '个人网站系统',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    coverAssetId: null,
    description: '把重复的工作流程写成可复用技能，减少每次重新解释的成本。',
    id: 'fallback-agent-skills',
    links: [],
    order: 20,
    publishedAt: '2026-06-01T00:00:00.000Z',
    slug: 'agent-skills',
    title: 'Agent 技能系统',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    coverAssetId: null,
    description: '从草稿、标签到 RSS 输出，尽量让记录本身不被工具打断。',
    id: 'fallback-content-pipeline',
    links: [],
    order: 30,
    publishedAt: '2026-06-01T00:00:00.000Z',
    slug: 'content-pipeline',
    title: '内容发布管线',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
] satisfies PublicProjectSummary[]

export async function getPublicProjects(): Promise<PublicProjectSummary[]> {
  return (await getPublicProjectList({ pageSize: PROJECT_FULL_LIST_PAGE_SIZE })).projects
}

export async function getPublicProjectList({
  page = 1,
  pageSize = PROJECT_PAGE_SIZE,
}: {
  page?: number
  pageSize?: number
} = {}): Promise<PublicProjectListResponse> {
  const body = await requestPublicProjects({ page, pageSize })

  if (!body.ok) {
    throw new PublicCmsError('request-failed', body.error.message || 'Momo 公开项目接口暂时不可用。', body.error.code)
  }

  return assertPublicCmsData(body.data, PublicProjectListResponseSchema, 'Momo 返回的公开项目列表格式不正确。')
}

export async function getPublicProject(slug: string): Promise<PublicProjectSummary> {
  const body = await requestPublicProject(slug)

  if (!body.ok) {
    throw new PublicCmsError('request-failed', body.error.message || 'Momo 公开项目接口暂时不可用。', body.error.code)
  }

  return assertPublicCmsData(body.data, PublicProjectResponseSchema, 'Momo 返回的公开项目详情格式不正确。').project
}

export async function getPublicProjectsOrFallback(): Promise<PublicProjectSummary[]> {
  try {
    return await getPublicProjects()
  } catch {
    return FALLBACK_PUBLIC_PROJECTS
  }
}

export async function getPublicProjectListOrFallback(page: number): Promise<PublicProjectListResponse> {
  try {
    return await getPublicProjectList({ page })
  } catch {
    const total = FALLBACK_PUBLIC_PROJECTS.length
    const totalPages = Math.ceil(total / PROJECT_PAGE_SIZE)
    const start = (Math.max(1, page) - 1) * PROJECT_PAGE_SIZE

    return {
      hasNextPage: page < totalPages,
      hasPreviousPage: totalPages > 0 && page > 1,
      page,
      pageSize: PROJECT_PAGE_SIZE,
      projects: FALLBACK_PUBLIC_PROJECTS.slice(start, start + PROJECT_PAGE_SIZE),
      total,
      totalPages,
    }
  }
}
