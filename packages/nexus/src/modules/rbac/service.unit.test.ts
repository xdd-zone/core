import type { UserBaseData } from '../user/types'
import { PermissionService } from '@nexus/core/permissions'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { UserRepository } from '../user/repository'
import { RoleRepository } from './role.repository'
import { RbacService } from './service'
import { UserRoleRepository } from './user-role.repository'

function createRepositoryRole() {
  return {
    id: 'role-1',
    name: 'admin',
    displayName: '管理员',
    description: null,
    isSystem: true,
    createdAt: new Date('2026-04-30T00:00:00.000Z'),
    updatedAt: new Date('2026-04-30T00:00:00.000Z'),
  }
}

function createUser(overrides: Partial<UserBaseData> = {}): UserBaseData {
  return {
    id: 'user-1',
    username: 'user-one',
    name: '用户一',
    email: 'one@example.com',
    emailVerified: true,
    emailVerifiedAt: null,
    introduce: null,
    image: null,
    phone: null,
    phoneVerified: false,
    phoneVerifiedAt: null,
    lastLogin: null,
    lastLoginIp: null,
    status: 'ACTIVE',
    createdAt: new Date('2026-04-30T00:00:00.000Z'),
    updatedAt: new Date('2026-04-30T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  }
}

function createRepositoryRoleAssignment() {
  return {
    id: 'assignment-1',
    userId: 'user-1',
    roleId: 'role-1',
    assignedBy: 'admin-1',
    assignedAt: new Date('2026-04-30T00:00:00.000Z'),
    role: createRepositoryRole(),
  }
}

describe('RbacService', () => {
  afterEach(() => {
    spyOn(UserRepository, 'findById').mockRestore()
    spyOn(RoleRepository, 'findMany').mockRestore()
    spyOn(RoleRepository, 'findById').mockRestore()
    spyOn(UserRoleRepository, 'assignRole').mockRestore()
    spyOn(UserRoleRepository, 'findByUser').mockRestore()
    spyOn(UserRoleRepository, 'findUserWithRoles').mockRestore()
    spyOn(UserRoleRepository, 'removeRole').mockRestore()
    spyOn(PermissionService, 'getUserPermissionSummaries').mockRestore()
    spyOn(PermissionService, 'clearCache').mockRestore()
  })

  it('角色列表查询应传入分页和关键字条件', async () => {
    const findManySpy = spyOn(RoleRepository, 'findMany').mockResolvedValue({
      roles: [createRepositoryRole()],
      total: 1,
    })

    const result = await RbacService.listRoles({
      page: 2,
      pageSize: 5,
      keyword: 'admin',
    })

    expect(findManySpy).toHaveBeenCalledWith(
      {
        OR: [
          { name: { contains: 'admin', mode: 'insensitive' } },
          { displayName: { contains: 'admin', mode: 'insensitive' } },
        ],
      },
      5,
      5,
    )
    expect(result.items).toHaveLength(1)
    expect(result.page).toBe(2)
  })

  it('获取指定用户角色时应返回序列化结果', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    const findByUserSpy = spyOn(UserRoleRepository, 'findByUser').mockResolvedValue([
      createRepositoryRoleAssignment(),
    ] as never)

    const result = await RbacService.getUserRoles('user-1')

    expect(findByUserSpy).toHaveBeenCalledWith('user-1')
    expect(result).toEqual([
      expect.objectContaining({
        roleId: 'role-1',
        roleName: 'admin',
      }),
    ])
  })

  it('可以给用户分配角色', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(RoleRepository, 'findById').mockResolvedValue(createRepositoryRole())
    const assignSpy = spyOn(UserRoleRepository, 'assignRole').mockResolvedValue(createRepositoryRoleAssignment())
    const clearCacheSpy = spyOn(PermissionService, 'clearCache').mockImplementation(() => {})

    const result = await RbacService.assignRoleToUser('user-1', 'role-1', 'admin-1')

    expect(assignSpy).toHaveBeenCalledWith('user-1', 'role-1', 'admin-1')
    expect(clearCacheSpy).toHaveBeenCalledWith('user-1')
    expect(result.userId).toBe('user-1')
    expect(result.roleId).toBe('role-1')
  })

  it('分配不存在的角色应报错', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    spyOn(RoleRepository, 'findById').mockResolvedValue(null)
    const assignSpy = spyOn(UserRoleRepository, 'assignRole').mockResolvedValue(createRepositoryRoleAssignment())

    await expect(RbacService.assignRoleToUser('user-1', 'missing', 'admin-1')).rejects.toThrow('角色不存在')
    expect(assignSpy).not.toHaveBeenCalled()
  })

  it('可以从用户移除角色', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    const removeSpy = spyOn(UserRoleRepository, 'removeRole').mockResolvedValue({ count: 1 })
    const clearCacheSpy = spyOn(PermissionService, 'clearCache').mockImplementation(() => {})

    await RbacService.removeRoleFromUser('user-1', 'role-1')

    expect(removeSpy).toHaveBeenCalledWith('user-1', 'role-1')
    expect(clearCacheSpy).toHaveBeenCalledWith('user-1')
  })

  it('移除用户未拥有的角色应报错', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    const removeSpy = spyOn(UserRoleRepository, 'removeRole').mockResolvedValue({ count: 0 })

    await expect(RbacService.removeRoleFromUser('user-1', 'role-1')).rejects.toThrow('用户角色关联不存在')
    expect(removeSpy).toHaveBeenCalledWith('user-1', 'role-1')
  })

  it('获取指定用户权限时应返回权限列表', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue(createUser())
    const getPermissionsSpy = spyOn(PermissionService, 'getUserPermissionSummaries').mockResolvedValue([
      {
        key: 'user:read:own',
        resource: 'user',
        action: 'read',
        scope: 'own',
        displayName: '读取个人资料',
        description: '读取自己的资料',
      },
    ] as never)

    const result = await RbacService.getUserPermissions('user-1')

    expect(getPermissionsSpy).toHaveBeenCalledWith('user-1')
    expect(result.permissions).toEqual([
      expect.objectContaining({
        key: 'user:read:own',
      }),
    ])
  })

  it('获取当前用户权限时用户不存在应抛 404', async () => {
    spyOn(UserRoleRepository, 'findUserWithRoles').mockResolvedValue(null)
    const getPermissionsSpy = spyOn(PermissionService, 'getUserPermissionSummaries').mockResolvedValue([] as never)

    await expect(RbacService.getCurrentUserPermissions('missing-user')).rejects.toThrow('用户不存在')
    expect(getPermissionsSpy).not.toHaveBeenCalled()
  })

  it('获取当前用户角色时用户不存在应抛 404', async () => {
    spyOn(UserRoleRepository, 'findUserWithRoles').mockResolvedValue({
      ...createUser(),
      deletedAt: new Date('2026-05-01T00:00:00.000Z'),
      userRoles: [],
    } as never)

    await expect(RbacService.getCurrentUserRoles('user-1')).rejects.toThrow('用户不存在')
  })
})
