import { describe, expect, it } from 'bun:test'
import { createApp } from '../app'

interface OpenApiParameter {
  in: string
  name: string
  required?: boolean
  schema?: {
    type?: string
  }
}

interface OpenApiRequestBody {
  content?: Record<string, { schema?: { properties?: Record<string, unknown>; required?: string[] } }>
  required?: boolean
}

interface OpenApiResponse {
  description?: string
}

interface OpenApiOperation {
  delete?: OpenApiOperation
  get?: OpenApiOperation
  parameters?: OpenApiParameter[]
  patch?: OpenApiOperation
  post?: OpenApiOperation
  put?: OpenApiOperation
  requestBody?: OpenApiRequestBody
  responses?: Record<string, OpenApiResponse>
  tags?: string[]
}

interface OpenApiDocument {
  paths?: Record<string, OpenApiOperation>
}

async function getOpenApiDocument() {
  const app = createApp()
  const response = await app.handle(new Request('http://localhost/openapi/json'))

  expect(response.status).toBe(200)

  return (await response.json()) as OpenApiDocument
}

function expectResponseStatuses(responses: Record<string, OpenApiResponse> | undefined, statuses: string[]) {
  expect(Object.keys(responses ?? {}).sort()).toEqual([...statuses].sort())
}

describe('openapi smoke', () => {
  it('应保留关键路径并标出模块 tags', async () => {
    const document = await getOpenApiDocument()
    const paths = document.paths ?? {}

    expect(paths['/api/health/']?.get?.tags).toContain('Health')
    expect(paths['/api/auth/get-session']?.get?.tags).toContain('Auth')
    expect(paths['/api/auth/sign-up/email']?.post?.tags).toContain('Auth')
    expect(paths['/api/auth/sign-in/email']?.post?.tags).toContain('Auth')
    expect(paths['/api/user/']?.get?.tags).toContain('User')
    expect(paths['/api/public-site/posts']?.get?.tags).toContain('PublicSite')
    expect(paths['/api/post/{id}']?.delete?.tags).toContain('Post')
    expect(paths['/api/comment/{id}']?.delete?.tags).toContain('Comment')
  })

  it('应导出关键 body 和 query schema', async () => {
    const document = await getOpenApiDocument()
    const paths = document.paths ?? {}

    const signUpBody = paths['/api/auth/sign-up/email']?.post?.requestBody
    const signUpJsonSchema = signUpBody?.content?.['application/json']?.schema
    const publicSitePostQuery = paths['/api/public-site/posts']?.get?.parameters ?? []
    const userListQuery = paths['/api/user/']?.get?.parameters ?? []
    const commentCreateBody = paths['/api/comment/']?.post?.requestBody

    expect(signUpBody?.required).toBe(true)
    expect(signUpJsonSchema?.required).toEqual(expect.arrayContaining(['email', 'password', 'name']))
    expect(signUpJsonSchema?.properties).toHaveProperty('email')
    expect(signUpJsonSchema?.properties).toHaveProperty('password')
    expect(signUpJsonSchema?.properties).toHaveProperty('name')

    expect(publicSitePostQuery).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'query', name: 'page' }),
        expect.objectContaining({ in: 'query', name: 'pageSize' }),
        expect.objectContaining({ in: 'query', name: 'categorySlug' }),
      ]),
    )
    expect(userListQuery).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'query', name: 'page' }),
        expect.objectContaining({ in: 'query', name: 'status' }),
        expect.objectContaining({ in: 'query', name: 'keyword' }),
      ]),
    )
    expect(commentCreateBody?.content?.['application/json']?.schema?.properties).toHaveProperty('postId')
    expect(commentCreateBody?.content?.['application/json']?.schema?.properties).toHaveProperty('authorEmail')
    expect(commentCreateBody?.content?.['application/json']?.schema?.properties).toHaveProperty('content')
  })

  it('应保留关键鉴权错误响应和 204 空 body 契约', async () => {
    const document = await getOpenApiDocument()
    const paths = document.paths ?? {}

    expectResponseStatuses(paths['/api/auth/sign-up/email']?.post?.responses, ['200', '400'])
    expectResponseStatuses(paths['/api/auth/sign-in/email']?.post?.responses, ['200', '400'])
    expectResponseStatuses(paths['/api/auth/me']?.get?.responses, ['200', '401'])
    expectResponseStatuses(paths['/api/user/']?.get?.responses, ['200', '400', '401', '403'])
    expectResponseStatuses(paths['/api/user/{id}']?.get?.responses, ['200', '401', '403', '404'])
    expectResponseStatuses(paths['/api/user/me']?.patch?.responses, ['200', '400', '401', '403', '404', '409'])
    expectResponseStatuses(paths['/api/user/me/password']?.patch?.responses, ['200', '400', '401', '403', '404'])
    expectResponseStatuses(paths['/api/user/{id}/status']?.patch?.responses, ['200', '400', '401', '403', '404'])
    expectResponseStatuses(paths['/api/user/{id}']?.patch?.responses, ['200', '400', '401', '403', '404', '409'])

    expect(paths['/api/auth/sign-out']?.post?.responses).toHaveProperty('204')
    expect(paths['/api/post/{id}']?.delete?.responses).toHaveProperty('204')
    expect(paths['/api/category/{id}']?.delete?.responses).toHaveProperty('204')
    expect(paths['/api/comment/{id}']?.delete?.responses).toHaveProperty('204')
    expect(paths['/api/rbac/users/{userId}/roles/{roleId}']?.delete?.responses).toHaveProperty('204')

    expect(paths['/api/post/{id}']?.delete?.responses?.['204']).toEqual(
      expect.objectContaining({
        description: expect.any(String),
      }),
    )
    expect(paths['/api/auth/sign-out']?.post?.responses?.['204']).toEqual(
      expect.objectContaining({
        description: expect.any(String),
      }),
    )

    expect(paths['/api/post/{id}']?.post).toBeUndefined()
    expect(paths['/api/category/{id}']?.post).toBeUndefined()
    expect(paths['/api/comment/{id}']?.post).toBeUndefined()
    expect(paths['/api/rbac/users/{userId}/roles/{roleId}']?.patch).toBeUndefined()
  })

  it('应区分公开接口和后台接口边界，并清掉旧路径', async () => {
    const document = await getOpenApiDocument()
    const paths = document.paths ?? {}

    expect(paths['/api/public-site/posts']?.get?.responses).toHaveProperty('200')
    expect(paths['/api/public-site/posts/{slug}']?.get?.responses).toHaveProperty('200')
    expect(paths['/api/public-site/posts']?.post).toBeUndefined()
    expect(paths['/api/public-site/posts/{slug}']?.delete).toBeUndefined()

    expect(paths['/api/user/']?.get?.tags).toContain('User')
    expect(paths['/api/user/']?.post).toBeUndefined()

    expect(paths['/api/page/']).toBeUndefined()
    expect(paths['/api/page/{id}']).toBeUndefined()
    expect(paths['/api/page/{id}/publish']).toBeUndefined()
    expect(paths['/api/page/{id}/unpublish']).toBeUndefined()
    expect(paths['/api/post/public']).toBeUndefined()
    expect(paths['/api/post/public/{slug}']).toBeUndefined()
    expect(paths['/api/category/public']).toBeUndefined()
    expect(paths['/api/rbac/permissions']).toBeUndefined()
    expect(paths['/api/rbac/permissions/{id}']).toBeUndefined()
    expect(paths['/api/rbac/roles/{id}/permissions']).toBeUndefined()
    expect(paths['/api/rbac/roles/{id}/permissions/{permissionId}']).toBeUndefined()
  })
})
