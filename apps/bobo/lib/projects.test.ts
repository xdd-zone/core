import { BizCode } from '@xdd-zone/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPublicProject: vi.fn(),
  getPublicProjects: vi.fn(),
}))

vi.mock('@/lib/api/projects.api', () => ({
  getPublicProject: mocks.getPublicProject,
  getPublicProjects: mocks.getPublicProjects,
}))

const project = {
  coverAssetId: null,
  description: '一个公开项目。',
  id: 'project-1',
  links: [{ href: 'https://example.com', label: 'Example' }],
  order: 0,
  publishedAt: '2026-06-01T00:00:00.000Z',
  slug: 'project-1',
  title: '项目一',
  updatedAt: '2026-06-01T00:00:00.000Z',
}

describe('projects domain', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取公开项目列表成功时返回 projects', async () => {
    const { getPublicProjects } = await import('./projects')

    mocks.getPublicProjects.mockResolvedValue({
      data: createProjectListResponse([project]),
      meta: { requestId: 'request-1', timestamp: '2026-06-01T00:00:00.000Z' },
      ok: true,
    })

    await expect(getPublicProjects()).resolves.toEqual([project])
    expect(mocks.getPublicProjects).toHaveBeenCalledWith({ page: 1, pageSize: 50 })
  })

  it('读取公开项目分页列表成功时返回完整分页数据', async () => {
    const { getPublicProjectList } = await import('./projects')
    const payload = {
      ...createProjectListResponse([project]),
      hasPreviousPage: true,
      page: 2,
    }

    mocks.getPublicProjects.mockResolvedValue({
      data: payload,
      meta: { requestId: 'request-4', timestamp: '2026-06-01T00:00:00.000Z' },
      ok: true,
    })

    await expect(getPublicProjectList({ page: 2 })).resolves.toEqual(payload)
    expect(mocks.getPublicProjects).toHaveBeenCalledWith({ page: 2, pageSize: 8 })
  })

  it('公开项目列表返回错误时抛出错误信息', async () => {
    const { getPublicProjects } = await import('./projects')

    mocks.getPublicProjects.mockResolvedValue({
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: 'projects failed',
      },
      meta: { requestId: 'request-2', timestamp: '2026-06-01T00:00:00.000Z' },
      ok: false,
    })

    await expect(getPublicProjects()).rejects.toMatchObject({
      code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
      message: 'projects failed',
      reason: 'request-failed',
    })
  })

  it('读取公开项目详情成功时按 slug 请求', async () => {
    const { getPublicProject } = await import('./projects')

    mocks.getPublicProject.mockResolvedValue({
      data: { project },
      meta: { requestId: 'request-3', timestamp: '2026-06-01T00:00:00.000Z' },
      ok: true,
    })

    await expect(getPublicProject('project-1')).resolves.toEqual(project)
    expect(mocks.getPublicProject).toHaveBeenCalledWith('project-1')
  })
})

function createProjectListResponse(projects = [project]) {
  return {
    hasNextPage: false,
    hasPreviousPage: false,
    page: 1,
    pageSize: 8,
    projects,
    total: projects.length,
    totalPages: projects.length > 0 ? 1 : 0,
  }
}
