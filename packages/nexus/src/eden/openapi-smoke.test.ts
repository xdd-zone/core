import { createApp } from '@nexus/app'
import { describe, expect, it } from 'bun:test'

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
    expect(paths['/api/user/']).toBeTruthy()
    expect(paths['/api/user/me']).toBeTruthy()
    expect(paths['/api/user/{id}/status']).toBeTruthy()
    expect(paths['/api/rbac/roles']).toBeTruthy()
    expect(paths['/api/rbac/users/{userId}/roles']).toBeTruthy()
    expect(paths['/api/rbac/users/{userId}/permissions']).toBeTruthy()
    expect(paths['/api/rbac/users/me/roles']).toBeTruthy()
    expect(paths['/api/rbac/users/me/permissions']).toBeTruthy()

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
