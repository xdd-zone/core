import { ForbiddenError } from '@nexus/core/http'
import { PermissionService } from '@nexus/core/permissions'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { ensureOwnPermission, normalizeOwnPermission } from './ownership.guard'

describe('normalizeOwnPermission', () => {
  it('字符串配置默认使用 id 参数', () => {
    expect(normalizeOwnPermission('user:read:own')).toEqual({
      permission: 'user:read:own',
      paramKey: 'id',
    })
  })

  it('对象配置保留自定义资源参数', () => {
    expect(normalizeOwnPermission({ permission: 'user:read:own', paramKey: 'userId' })).toEqual({
      permission: 'user:read:own',
      paramKey: 'userId',
    })
  })
})

describe('ensureOwnPermission', () => {
  afterEach(() => {
    spyOn(PermissionService, 'hasPermission').mockRestore()
  })

  it('有 all 权限时不再检查资源归属', async () => {
    const hasPermissionSpy = spyOn(PermissionService, 'hasPermission').mockResolvedValueOnce(true)

    await expect(ensureOwnPermission('user-1', { id: 'user-2' }, 'user:read:own')).resolves.toBeUndefined()
    expect(hasPermissionSpy).toHaveBeenCalledTimes(1)
    expect(hasPermissionSpy).toHaveBeenCalledWith('user-1', 'user:read:all')
  })

  it('资源拥有者匹配且有 own 权限时放行', async () => {
    const hasPermissionSpy = spyOn(PermissionService, 'hasPermission')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)

    await expect(
      ensureOwnPermission('user-1', { userId: 'user-1' }, { permission: 'user:read:own', paramKey: 'userId' }),
    ).resolves.toBeUndefined()
    expect(hasPermissionSpy).toHaveBeenNthCalledWith(1, 'user-1', 'user:read:all')
    expect(hasPermissionSpy).toHaveBeenNthCalledWith(2, 'user-1', 'user:read:own')
  })

  it('资源拥有者不匹配时抛 ForbiddenError', async () => {
    const hasPermissionSpy = spyOn(PermissionService, 'hasPermission').mockResolvedValue(false)

    await expect(ensureOwnPermission('user-1', { id: 'user-2' }, 'user:read:own')).rejects.toThrow(ForbiddenError)
    await expect(ensureOwnPermission('user-1', { id: 'user-2' }, 'user:read:own')).rejects.toThrow('权限不足')
    expect(hasPermissionSpy).toHaveBeenCalledWith('user-1', 'user:read:all')
  })

  it('资源拥有者匹配但缺少 own 权限时抛 ForbiddenError', async () => {
    spyOn(PermissionService, 'hasPermission').mockResolvedValue(false)

    await expect(ensureOwnPermission('user-1', { id: 'user-1' }, 'user:read:own')).rejects.toThrow(ForbiddenError)
  })
})
