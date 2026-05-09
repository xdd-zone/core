import { describe, expect, it } from 'bun:test'
import { createApp } from '../app'

describe('openapi smoke', () => {
  it('应导出当前关键 API 路径', async () => {
    const app = createApp()
    const response = await app.handle(new Request('http://localhost/openapi/json'))

    expect(response.status).toBe(200)

    const document = (await response.json()) as {
      paths?: Record<string, unknown>
    }
    interface OpenapiPathItem {
      get?: unknown
      post?: unknown
      patch?: unknown
      put?: unknown
      delete?: unknown
    }

    const paths = (document.paths ?? {}) as Record<string, OpenapiPathItem>
    const expectMethod = (path: string, method: keyof OpenapiPathItem) => {
      expect(paths[path]?.[method]).toBeTruthy()
    }

    expect(paths).toBeTruthy()
    expectMethod('/api/health/', 'get')
    expectMethod('/api/auth/me', 'get')
    expectMethod('/api/auth/get-session', 'get')
    expectMethod('/api/auth/methods', 'get')
    expectMethod('/api/auth/sign-in/github', 'get')
    expectMethod('/api/auth/callback/github', 'get')
    expectMethod('/api/user/', 'get')
    expectMethod('/api/user/me', 'get')
    expectMethod('/api/user/me', 'patch')
    expectMethod('/api/user/me/password', 'patch')
    expectMethod('/api/user/{id}', 'get')
    expectMethod('/api/user/{id}', 'patch')
    expectMethod('/api/user/{id}/status', 'patch')
    expectMethod('/api/rbac/roles', 'get')
    expectMethod('/api/rbac/users/{userId}/roles', 'get')
    expectMethod('/api/rbac/users/{userId}/roles', 'post')
    expectMethod('/api/rbac/users/{userId}/roles/{roleId}', 'delete')
    expectMethod('/api/rbac/users/{userId}/permissions', 'get')
    expectMethod('/api/rbac/users/me/roles', 'get')
    expectMethod('/api/rbac/users/me/permissions', 'get')
    expectMethod('/api/public-site/config', 'get')
    expectMethod('/api/public-site/categories', 'get')
    expectMethod('/api/public-site/archives', 'get')
    expectMethod('/api/public-site/archives/posts', 'get')
    expectMethod('/api/public-site/categories/{slug}/posts', 'get')
    expectMethod('/api/public-site/posts', 'get')
    expectMethod('/api/public-site/posts/{slug}', 'get')
    expectMethod('/api/post/', 'get')
    expectMethod('/api/post/', 'post')
    expectMethod('/api/post/{id}', 'get')
    expectMethod('/api/post/{id}', 'patch')
    expectMethod('/api/post/{id}', 'delete')
    expectMethod('/api/post/{id}/publish', 'post')
    expectMethod('/api/post/{id}/unpublish', 'post')
    expectMethod('/api/category/', 'get')
    expectMethod('/api/category/', 'post')
    expectMethod('/api/category/{id}', 'get')
    expectMethod('/api/category/{id}', 'patch')
    expectMethod('/api/category/{id}', 'delete')
    expectMethod('/api/preview/markdown', 'post')
    expectMethod('/api/site-config', 'get')
    expectMethod('/api/site-config', 'put')
    expectMethod('/api/media/', 'get')
    expectMethod('/api/media/upload', 'post')
    expectMethod('/api/media/{id}', 'get')
    expectMethod('/api/media/{id}/file', 'get')
    expectMethod('/api/media/{id}', 'delete')
    expectMethod('/api/comment/', 'get')
    expectMethod('/api/comment/', 'post')
    expectMethod('/api/comment/{id}', 'get')
    expectMethod('/api/comment/{id}/status', 'patch')
    expectMethod('/api/comment/{id}', 'delete')

    expect(paths['/api/page/']).toBeUndefined()
    expect(paths['/api/page/{id}']).toBeUndefined()
    expect(paths['/api/page/{id}/publish']).toBeUndefined()
    expect(paths['/api/page/{id}/unpublish']).toBeUndefined()
    expect(paths['/api/post/public']).toBeUndefined()
    expect(paths['/api/post/public/{slug}']).toBeUndefined()
    expect(paths['/api/category/public']).toBeUndefined()
    expect(paths['/api/user/']?.post).toBeUndefined()
    expect(paths['/api/user/{id}']?.delete).toBeUndefined()
    expect(paths['/api/rbac/roles']?.post).toBeUndefined()
    expect(paths['/api/rbac/roles/{id}']).toBeUndefined()
    expect(paths['/api/rbac/permissions']).toBeUndefined()
    expect(paths['/api/rbac/permissions/{id}']).toBeUndefined()
    expect(paths['/api/rbac/roles/{id}/permissions']).toBeUndefined()
    expect(paths['/api/rbac/roles/{id}/permissions/{permissionId}']).toBeUndefined()
    expect(paths['/api/rbac/users/{userId}/roles/{roleId}']?.patch).toBeUndefined()
  })
})
