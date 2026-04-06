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
      delete?: unknown
    }

    const paths = (document.paths ?? {}) as Record<string, OpenapiPathItem>

    expect(paths).toBeTruthy()
    expect(paths['/api/health/']).toBeTruthy()
    expect(paths['/api/auth/me']).toBeTruthy()
    expect(paths['/api/auth/get-session']).toBeTruthy()
    expect(paths['/api/auth/methods']).toBeTruthy()
    expect(paths['/api/auth/sign-in/github']).toBeTruthy()
    expect(paths['/api/auth/callback/github']).toBeTruthy()
    expect(paths['/api/user/']).toBeTruthy()
    expect(paths['/api/user/me']).toBeTruthy()
    expect(paths['/api/user/{id}/status']).toBeTruthy()
    expect(paths['/api/rbac/roles']).toBeTruthy()
    expect(paths['/api/rbac/users/{userId}/roles']).toBeTruthy()
    expect(paths['/api/rbac/users/{userId}/permissions']).toBeTruthy()
    expect(paths['/api/rbac/users/me/roles']).toBeTruthy()
    expect(paths['/api/rbac/users/me/permissions']).toBeTruthy()
    expect(paths['/api/post/']).toBeTruthy()
    expect(paths['/api/post/{id}']).toBeTruthy()
    expect(paths['/api/post/{id}/publish']).toBeTruthy()
    expect(paths['/api/post/{id}/unpublish']).toBeTruthy()
    expect(paths['/api/preview/markdown']).toBeTruthy()
    expect(paths['/api/site-config']).toBeTruthy()
    expect(paths['/api/media/']).toBeTruthy()
    expect(paths['/api/media/upload']).toBeTruthy()
    expect(paths['/api/media/{id}']).toBeTruthy()
    expect(paths['/api/media/{id}/file']).toBeTruthy()
    expect(paths['/api/comment/']).toBeTruthy()
    expect(paths['/api/comment/{id}']).toBeTruthy()
    expect(paths['/api/comment/{id}/status']).toBeTruthy()

    expect(paths['/api/page/']).toBeUndefined()
    expect(paths['/api/page/{id}']).toBeUndefined()
    expect(paths['/api/page/{id}/publish']).toBeUndefined()
    expect(paths['/api/page/{id}/unpublish']).toBeUndefined()
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
