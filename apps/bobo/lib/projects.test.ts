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
      data: { projects: [project] },
      meta: { requestId: 'request-1', timestamp: '2026-06-01T00:00:00.000Z' },
      ok: true,
    })

    await expect(getPublicProjects()).resolves.toEqual([project])
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
