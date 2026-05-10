import type { PermissionString } from './permissions.types'
import { afterEach, describe, expect, it } from 'bun:test'
import { prisma } from '../../infra/database/client'
import { PermissionService } from './permission.service'
import { Permissions, SYSTEM_PERMISSION_DEFINITIONS } from './permissions'
import { registerPermissionDefinitions } from './registry'

function createUserRoleRecord(input: {
  roleName: string
  permissions?: readonly PermissionString[]
}) {
  return {
    roleId: `${input.roleName}-role-id`,
    userId: 'user-id',
    assignedBy: null,
    assignedAt: new Date('2026-05-10T00:00:00.000Z'),
    role: {
      id: `${input.roleName}-role-id`,
      name: input.roleName,
      displayName: input.roleName,
      permissions: (input.permissions ?? []).map((permissionKey) => {
        const [resource, action, scope = ''] = permissionKey.split(':')

        return {
          roleId: `${input.roleName}-role-id`,
          permissionId: permissionKey,
          permission: {
            id: permissionKey,
            resource,
            action,
            scope,
            displayName: permissionKey,
            description: permissionKey,
          },
        }
      }),
    },
  }
}

const originalFindMany = prisma.userRole.findMany

function mockUserRoleFindMany(records: unknown[]) {
  const calls: unknown[] = []

  prisma.userRole.findMany = (async (args: unknown) => {
    calls.push(args)
    return records
  }) as typeof prisma.userRole.findMany

  return {
    calls,
  }
}

afterEach(() => {
  PermissionService.clearAllCache()
  prisma.userRole.findMany = originalFindMany
})

describe('PermissionService', () => {
  it('toPermissionSummary 应优先读取注册表里的展示信息', () => {
    registerPermissionDefinitions(SYSTEM_PERMISSION_DEFINITIONS)

    expect(PermissionService.toPermissionSummary(Permissions.USER.READ_ALL)).toEqual({
      key: Permissions.USER.READ_ALL,
      resource: 'user',
      action: 'read',
      scope: 'all',
      displayName: '查看全部用户',
      description: '允许超级管理员查看用户列表和用户详情。',
    })
  })

  it('getPermissionContext 应缓存查询结果，清理缓存后重新查库', async () => {
    const findManyMock = mockUserRoleFindMany([
      createUserRoleRecord({
        roleName: 'editor',
        permissions: [Permissions.USER.READ_ALL],
      }),
    ])

    const firstContext = await PermissionService.getPermissionContext('user-1')
    const secondContext = await PermissionService.getPermissionContext('user-1')

    expect(firstContext).toBe(secondContext)
    expect(firstContext.permissions.has(Permissions.USER.READ_ALL)).toBe(true)
    expect(findManyMock.calls).toHaveLength(1)

    PermissionService.clearCache('user-1')
    await PermissionService.getPermissionContext('user-1')

    expect(findManyMock.calls).toHaveLength(2)
  })

  it('普通用户应按 all 匹配 own，但不能反向匹配', async () => {
    mockUserRoleFindMany([
      createUserRoleRecord({
        roleName: 'operator',
        permissions: [Permissions.USER.READ_ALL, Permissions.USER.UPDATE_OWN],
      }),
    ])

    expect(await PermissionService.hasPermission('user-2', Permissions.USER.READ_OWN)).toBe(true)
    expect(await PermissionService.hasPermission('user-2', Permissions.USER.UPDATE_ALL)).toBe(false)
    expect(await PermissionService.hasAnyPermission('user-2', [Permissions.USER.UPDATE_ALL, Permissions.USER.READ_OWN])).toBe(true)
    expect(await PermissionService.hasAllPermissions('user-2', [Permissions.USER.READ_OWN, Permissions.USER.UPDATE_ALL])).toBe(false)
  })

  it('superAdmin 角色应获得系统管理权限并通过任意权限检查', async () => {
    mockUserRoleFindMany([
      createUserRoleRecord({
        roleName: 'superAdmin',
      }),
    ])

    const context = await PermissionService.getPermissionContext('admin-user')

    expect(context.isSuperAdmin).toBe(true)
    expect(context.roles).toEqual([
      {
        id: 'superAdmin-role-id',
        name: 'superAdmin',
        displayName: 'superAdmin',
      },
    ])
    expect(context.permissions.has(Permissions.SYSTEM.MANAGE)).toBe(true)
    expect(await PermissionService.hasPermission('admin-user', 'post:delete:all')).toBe(true)
  })

  it('getUserPermissions 应让 superAdmin 返回注册表中的全部权限 key', async () => {
    registerPermissionDefinitions(SYSTEM_PERMISSION_DEFINITIONS)
    mockUserRoleFindMany([
      createUserRoleRecord({
        roleName: 'superAdmin',
      }),
    ])

    expect(await PermissionService.getUserPermissions('admin-user')).toEqual(
      expect.arrayContaining([Permissions.USER.READ_ALL, Permissions.SYSTEM.MANAGE]),
    )
  })
})
