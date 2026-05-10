import { ForbiddenError } from '@nexus/core/http'
import { PermissionService } from '@nexus/core/permissions'
import { afterEach, describe, expect, it } from 'bun:test'
import { ensureAnyPermission, ensurePermission } from './permission.guard'

const originalHasPermission = PermissionService.hasPermission
const originalHasAnyPermission = PermissionService.hasAnyPermission

describe('ensurePermission', () => {
  afterEach(() => {
    PermissionService.hasPermission = originalHasPermission
    PermissionService.hasAnyPermission = originalHasAnyPermission
  })

  it('权限不足时抛 ForbiddenError', async () => {
    PermissionService.hasPermission = async () => false

    await expect(ensurePermission('user-1', 'post:read:all')).rejects.toThrow(ForbiddenError)
    await expect(ensurePermission('user-1', 'post:read:all')).rejects.toThrow('权限不足')
  })

  it('权限足够时放行', async () => {
    const calls: Array<[string, string]> = []

    PermissionService.hasPermission = async (userId, permission) => {
      calls.push([userId, permission])
      return true
    }

    await expect(ensurePermission('user-1', 'post:read:all')).resolves.toBeUndefined()
    expect(calls).toEqual([['user-1', 'post:read:all']])
  })
})

describe('ensureAnyPermission', () => {
  afterEach(() => {
    PermissionService.hasPermission = originalHasPermission
    PermissionService.hasAnyPermission = originalHasAnyPermission
  })

  it('任一权限满足时放行', async () => {
    const calls: Array<[string, string[]]> = []

    PermissionService.hasAnyPermission = async (userId, permissions) => {
      calls.push([userId, [...permissions]])
      return true
    }

    await expect(ensureAnyPermission('user-1', ['post:read:all', 'post:write:all'])).resolves.toBeUndefined()
    expect(calls).toEqual([['user-1', ['post:read:all', 'post:write:all']]])
  })

  it('任一权限都不满足时抛 ForbiddenError', async () => {
    PermissionService.hasAnyPermission = async () => false

    await expect(ensureAnyPermission('user-1', ['post:read:all', 'post:write:all'])).rejects.toThrow(ForbiddenError)
    await expect(ensureAnyPermission('user-1', ['post:read:all', 'post:write:all'])).rejects.toThrow('权限不足')
  })
})
