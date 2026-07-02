import type { ApiResponse, ProjectListResponse, ProjectResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  listProjects: vi.fn(),
  publishProject: vi.fn(),
  saveDraft: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      projects: {
        $get: rpcMocks.listProjects,
        $post: rpcMocks.createProject,
        ':id': {
          draft: {
            $patch: rpcMocks.saveDraft,
          },
          publish: {
            $post: rpcMocks.publishProject,
          },
        },
      },
    },
  },
}))

describe('projects api 封装', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取项目列表时调用 /rpc/projects', async () => {
    const responseBody: ApiResponse<ProjectListResponse> = {
      ok: true,
      data: {
        projects: [],
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.listProjects.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { listProjects } = await import('@fifa/api/projects/projects.api')

    await expect(listProjects()).resolves.toEqual(responseBody)
  })

  it('创建项目时传入请求体', async () => {
    const payload = {
      description: null,
      links: [],
      order: 1,
      slug: 'xdd-zone',
      title: 'XDD Zone',
    }
    const responseBody: ApiResponse<ProjectResponse> = {
      ok: true,
      data: {
        project: {
          coverAssetId: null,
          description: null,
          id: 'project-1',
          links: [],
          order: 1,
          publishedAt: null,
          slug: 'xdd-zone',
          status: 'draft',
          title: 'XDD Zone',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.createProject.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { createProject } = await import('@fifa/api/projects/projects.api')

    await expect(createProject(payload)).resolves.toEqual(responseBody)
    expect(rpcMocks.createProject).toHaveBeenCalledWith({
      json: payload,
    })
  })

  it('保存项目草稿时传入项目 id 和请求体', async () => {
    const payload = {
      title: 'XDD Zone Next',
    }
    const responseBody: ApiResponse<ProjectResponse> = {
      ok: true,
      data: {
        project: {
          coverAssetId: null,
          description: null,
          id: 'project-1',
          links: [],
          order: 1,
          publishedAt: null,
          slug: 'xdd-zone',
          status: 'draft',
          title: 'XDD Zone Next',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.saveDraft.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { saveProjectDraft } = await import('@fifa/api/projects/projects.api')

    await expect(saveProjectDraft('project-1', payload)).resolves.toEqual(responseBody)
    expect(rpcMocks.saveDraft).toHaveBeenCalledWith({
      json: payload,
      param: {
        id: 'project-1',
      },
    })
  })

  it('发布项目时传入项目 id', async () => {
    const responseBody: ApiResponse<ProjectResponse> = {
      ok: true,
      data: {
        project: {
          coverAssetId: null,
          description: null,
          id: 'project-1',
          links: [],
          order: 1,
          publishedAt: '2026-01-01T00:00:00.000Z',
          slug: 'xdd-zone',
          status: 'published',
          title: 'XDD Zone',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.publishProject.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { publishProject } = await import('@fifa/api/projects/projects.api')

    await expect(publishProject('project-1')).resolves.toEqual(responseBody)
    expect(rpcMocks.publishProject).toHaveBeenCalledWith({
      param: {
        id: 'project-1',
      },
    })
  })
})
