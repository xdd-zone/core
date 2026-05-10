import { describe, expect, it } from 'bun:test'
import { createApp } from '../app'

type HttpMethod = 'delete' | 'get' | 'patch' | 'post' | 'put'

interface OpenApiParameter {
  in: string
  name: string
  required?: boolean
  schema?: {
    type?: string
  }
}

interface OpenApiSchema {
  properties?: Record<string, unknown>
  required?: string[]
}

interface OpenApiRequestBody {
  content?: Record<string, { schema?: OpenApiSchema }>
  required?: boolean
}

interface OpenApiResponse {
  content?: Record<string, { schema?: OpenApiSchema }>
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

interface ModuleSpec {
  path: string
  tag: string
  methods: HttpMethod[]
}

interface RouteSpec {
  path: string
  method: HttpMethod
  tag: string
  statuses?: string[]
  requiredBodyFields?: string[]
  bodyFields?: string[]
  queryParams?: string[]
  responseFields?: string[]
  forbiddenMethods?: HttpMethod[]
}

const moduleSpecs: ModuleSpec[] = [
  { path: '/api/health/', tag: 'Health', methods: ['get'] },
  { path: '/api/auth/methods', tag: 'Auth', methods: ['get'] },
  { path: '/api/auth/get-session', tag: 'Auth', methods: ['get'] },
  { path: '/api/auth/sign-in/github', tag: 'Auth', methods: ['get'] },
  { path: '/api/auth/sign-up/email', tag: 'Auth', methods: ['post'] },
  { path: '/api/user/', tag: 'User', methods: ['get'] },
  { path: '/api/rbac/roles', tag: 'RBAC', methods: ['get'] },
  { path: '/api/public-site/posts', tag: 'PublicSite', methods: ['get'] },
  { path: '/api/post/', tag: 'Post', methods: ['get', 'post'] },
  { path: '/api/category/', tag: 'Category', methods: ['get', 'post'] },
  { path: '/api/comment/', tag: 'Comment', methods: ['get', 'post'] },
  { path: '/api/media/', tag: 'Media', methods: ['get'] },
  { path: '/api/site-config', tag: 'SiteConfig', methods: ['get', 'put'] },
  { path: '/api/preview/markdown', tag: 'Preview', methods: ['post'] },
]

const routeSpecs: RouteSpec[] = [
  {
    path: '/api/health/',
    method: 'get',
    tag: 'Health',
    statuses: ['200'],
    responseFields: ['status', 'timestamp', 'service', 'version', 'uptime', 'database'],
  },
  {
    path: '/api/auth/sign-up/email',
    method: 'post',
    tag: 'Auth',
    statuses: ['200', '400'],
    requiredBodyFields: ['email', 'password', 'name'],
    bodyFields: ['email', 'password', 'name', 'image'],
    responseFields: ['user', 'token', 'session'],
  },
  {
    path: '/api/auth/methods',
    method: 'get',
    tag: 'Auth',
    statuses: ['200'],
    responseFields: ['methods'],
  },
  {
    path: '/api/auth/get-session',
    method: 'get',
    tag: 'Auth',
    statuses: ['200'],
    responseFields: ['user', 'session', 'isAuthenticated'],
  },
  {
    path: '/api/auth/sign-in/github',
    method: 'get',
    tag: 'Auth',
    statuses: ['302', '400'],
    queryParams: ['callbackURL'],
  },
  {
    path: '/api/auth/sign-in/email',
    method: 'post',
    tag: 'Auth',
    statuses: ['200', '400'],
    requiredBodyFields: ['email', 'password'],
    bodyFields: ['email', 'password', 'rememberMe'],
    responseFields: ['user', 'token', 'session'],
  },
  {
    path: '/api/auth/me',
    method: 'get',
    tag: 'Auth',
    statuses: ['200', '401'],
    responseFields: ['user', 'session', 'isAuthenticated'],
  },
  {
    path: '/api/auth/sign-out',
    method: 'post',
    tag: 'Auth',
    statuses: ['204'],
  },
  {
    path: '/api/user/',
    method: 'get',
    tag: 'User',
    statuses: ['200', '400', '401', '403'],
    queryParams: ['page', 'pageSize', 'status', 'keyword'],
    responseFields: ['items', 'total', 'page', 'pageSize', 'totalPages'],
    forbiddenMethods: ['post'],
  },
  {
    path: '/api/user/{id}',
    method: 'get',
    tag: 'User',
    statuses: ['200', '401', '403', '404'],
  },
  {
    path: '/api/user/me',
    method: 'patch',
    tag: 'User',
    statuses: ['200', '400', '401', '403', '404', '409'],
    bodyFields: ['username', 'name', 'email', 'phone', 'introduce', 'image'],
  },
  {
    path: '/api/user/me/password',
    method: 'patch',
    tag: 'User',
    statuses: ['200', '400', '401', '403', '404'],
  },
  {
    path: '/api/user/{id}',
    method: 'patch',
    tag: 'User',
    statuses: ['200', '400', '401', '403', '404', '409'],
  },
  {
    path: '/api/user/{id}/status',
    method: 'patch',
    tag: 'User',
    statuses: ['200', '400', '401', '403', '404'],
  },
  {
    path: '/api/public-site/posts',
    method: 'get',
    tag: 'PublicSite',
    statuses: ['200'],
    queryParams: ['page', 'pageSize', 'categorySlug'],
    responseFields: ['items', 'total', 'page', 'pageSize', 'totalPages'],
    forbiddenMethods: ['post'],
  },
  {
    path: '/api/public-site/posts/{slug}',
    method: 'get',
    tag: 'PublicSite',
    statuses: ['200'],
    responseFields: ['id', 'title', 'slug', 'category', 'tags', 'markdown'],
    forbiddenMethods: ['delete'],
  },
  {
    path: '/api/public-site/categories/{slug}/posts',
    method: 'get',
    tag: 'PublicSite',
    statuses: ['200'],
  },
  {
    path: '/api/post/{id}',
    method: 'delete',
    tag: 'Post',
    statuses: ['204', '401', '403', '404'],
    forbiddenMethods: ['post'],
  },
  {
    path: '/api/category/{id}',
    method: 'delete',
    tag: 'Category',
    statuses: ['204', '401', '403', '404'],
    forbiddenMethods: ['post'],
  },
  {
    path: '/api/comment/',
    method: 'post',
    tag: 'Comment',
    statuses: ['200'],
    requiredBodyFields: ['postId', 'authorName', 'content'],
    bodyFields: ['postId', 'authorName', 'authorEmail', 'content'],
  },
  {
    path: '/api/comment/{id}',
    method: 'delete',
    tag: 'Comment',
    statuses: ['204', '401', '403', '404'],
    forbiddenMethods: ['post'],
  },
  {
    path: '/api/rbac/users/{userId}/roles/{roleId}',
    method: 'delete',
    tag: 'RBAC',
    statuses: ['204', '401', '403', '404'],
    forbiddenMethods: ['patch'],
  },
  {
    path: '/api/media/{id}/file',
    method: 'get',
    tag: 'Media',
    statuses: ['401', '403', '404'],
  },
]

const legacyPaths = [
  '/api/page/',
  '/api/page/{id}',
  '/api/page/{id}/publish',
  '/api/page/{id}/unpublish',
  '/api/post/public',
  '/api/post/public/{slug}',
  '/api/category/public',
  '/api/rbac/permissions',
  '/api/rbac/permissions/{id}',
  '/api/rbac/roles/{id}/permissions',
  '/api/rbac/roles/{id}/permissions/{permissionId}',
]

async function getOpenApiDocument() {
  const app = createApp()
  const response = await app.handle(new Request('http://localhost/openapi/json'))

  expect(response.status).toBe(200)

  return (await response.json()) as OpenApiDocument
}

function getPath(paths: Record<string, OpenApiOperation>, path: string): OpenApiOperation {
  const item = paths[path]

  expect(item).toBeDefined()

  return item as OpenApiOperation
}

function getOperation(pathItem: OpenApiOperation, method: HttpMethod): OpenApiOperation {
  const operation = pathItem[method]

  expect(operation).toBeDefined()

  return operation as OpenApiOperation
}

function expectTag(operation: OpenApiOperation | undefined, tag: string) {
  expect(operation?.tags).toContain(tag)
}

function expectResponseStatuses(responses: Record<string, OpenApiResponse> | undefined, statuses: string[]) {
  expect(Object.keys(responses ?? {}).sort()).toEqual([...statuses].sort())
}

function expectBodyFields(operation: OpenApiOperation | undefined, fields: string[]) {
  const properties = operation?.requestBody?.content?.['application/json']?.schema?.properties

  for (const field of fields) {
    expect(properties).toHaveProperty(field)
  }
}

function expectRequiredBodyFields(operation: OpenApiOperation | undefined, fields: string[]) {
  expect(operation?.requestBody?.required).toBe(true)
  expect(operation?.requestBody?.content?.['application/json']?.schema?.required).toEqual(expect.arrayContaining(fields))
}

function expectQueryParams(operation: OpenApiOperation | undefined, params: string[]) {
  expect(operation?.parameters).toEqual(
    expect.arrayContaining(params.map((name) => expect.objectContaining({ in: 'query', name }))),
  )
}

function expectResponseFields(operation: OpenApiOperation | undefined, fields: string[]) {
  const properties = operation?.responses?.['200']?.content?.['application/json']?.schema?.properties

  for (const field of fields) {
    expect(properties).toHaveProperty(field)
  }
}

describe('openapi smoke', () => {
  it('应保留关键模块和模块 tags', async () => {
    const document = await getOpenApiDocument()
    const paths = document.paths ?? {}

    for (const spec of moduleSpecs) {
      const pathItem = getPath(paths, spec.path)

      for (const method of spec.methods) {
        expectTag(getOperation(pathItem, method), spec.tag)
      }
    }
  })

  it('应保留关键路由清单里的状态码和关键 schema', async () => {
    const document = await getOpenApiDocument()
    const paths = document.paths ?? {}

    for (const spec of routeSpecs) {
      const pathItem = getPath(paths, spec.path)
      const operation = getOperation(pathItem, spec.method)

      expectTag(operation, spec.tag)

      if (spec.statuses) {
        expectResponseStatuses(operation.responses, spec.statuses)
      }

      if (spec.requiredBodyFields) {
        expectRequiredBodyFields(operation, spec.requiredBodyFields)
      }

      if (spec.bodyFields) {
        expectBodyFields(operation, spec.bodyFields)
      }

      if (spec.queryParams) {
        expectQueryParams(operation, spec.queryParams)
      }

      if (spec.responseFields) {
        expectResponseFields(operation, spec.responseFields)
      }

      if (spec.forbiddenMethods) {
        for (const forbiddenMethod of spec.forbiddenMethods) {
          expect(pathItem[forbiddenMethod]).toBeUndefined()
        }
      }
    }
  })

  it('应保留 204 空 body 契约描述', async () => {
    const document = await getOpenApiDocument()
    const paths = document.paths ?? {}

    const deletePaths = [
      '/api/auth/sign-out',
      '/api/post/{id}',
      '/api/category/{id}',
      '/api/comment/{id}',
      '/api/rbac/users/{userId}/roles/{roleId}',
    ] as const

    for (const path of deletePaths) {
      const pathItem = getPath(paths, path)
      const method: HttpMethod = path === '/api/auth/sign-out' ? 'post' : 'delete'
      const operation = getOperation(pathItem, method)

      expect(operation.responses).toHaveProperty('204')
      expect(operation.responses?.['204']).toEqual(
        expect.objectContaining({
          description: expect.any(String),
        }),
      )
    }
  })

  it('应区分公开接口和后台接口边界，并清掉旧路径', async () => {
    const document = await getOpenApiDocument()
    const paths = document.paths ?? {}

    expect(paths['/api/public-site/posts']?.get?.responses).toHaveProperty('200')
    expect(paths['/api/public-site/posts/{slug}']?.get?.responses).toHaveProperty('200')
    expect(paths['/api/user/']?.get?.tags).toContain('User')

    for (const legacyPath of legacyPaths) {
      expect(paths[legacyPath]).toBeUndefined()
    }
  })
})
