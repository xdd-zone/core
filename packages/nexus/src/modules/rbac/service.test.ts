import type { UserRoleAssignment } from './model'
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

function createRoleAssignment(overrides: Partial<UserRoleAssignment> = {}): UserRoleAssignment {
  return {
    id: 'assignment-1',
    userId: 'user-1',
    roleId: 'role-1',
    assignedBy: 'admin-1',
    assignedAt: '2026-04-30T00:00:00.000Z',
    role: {
      id: 'role-1',
      name: 'admin',
      displayName: '管理员',
      description: null,
      isSystem: true,
      createdAt: '2026-04-30T00:00:00.000Z',
      updatedAt: '2026-04-30T00:00:00.000Z',
    },
    ...overrides,
  }
}

describe('RbacService', () => {
  afterEach(() => {
    spyOn(UserRepository, 'findById').mockRestore()
    spyOn(RoleRepository, 'findById').mockRestore()
    spyOn(UserRoleRepository, 'assignRole').mockRestore()
    spyOn(UserRoleRepository, 'removeRole').mockRestore()
    spyOn(PermissionService, 'clearCache').mockRestore()
  })

  it('可以给用户分配角色', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue({ id: 'user-1' } as any)
    spyOn(RoleRepository, 'findById').mockResolvedValue(createRepositoryRole())
    const assignSpy = spyOn(UserRoleRepository, 'assignRole').mockResolvedValue(createRoleAssignment() as any)
    const clearCacheSpy = spyOn(PermissionService, 'clearCache').mockImplementation(() => {})

    const result = await RbacService.assignRoleToUser('user-1', 'role-1', 'admin-1')

    expect(assignSpy).toHaveBeenCalledWith('user-1', 'role-1', 'admin-1')
    expect(clearCacheSpy).toHaveBeenCalledWith('user-1')
    expect(result.userId).toBe('user-1')
    expect(result.roleId).toBe('role-1')
  })

  it('分配不存在的角色应报错', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue({ id: 'user-1' } as any)
    spyOn(RoleRepository, 'findById').mockResolvedValue(null)
    const assignSpy = spyOn(UserRoleRepository, 'assignRole').mockResolvedValue(createRoleAssignment() as any)

    await expect(RbacService.assignRoleToUser('user-1', 'missing', 'admin-1')).rejects.toThrow('角色不存在')
    expect(assignSpy).not.toHaveBeenCalled()
  })

  it('可以从用户移除角色', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue({ id: 'user-1' } as any)
    const removeSpy = spyOn(UserRoleRepository, 'removeRole').mockResolvedValue({ count: 1 })
    const clearCacheSpy = spyOn(PermissionService, 'clearCache').mockImplementation(() => {})

    await RbacService.removeRoleFromUser('user-1', 'role-1')

    expect(removeSpy).toHaveBeenCalledWith('user-1', 'role-1')
    expect(clearCacheSpy).toHaveBeenCalledWith('user-1')
  })

  it('移除用户未拥有的角色应报错', async () => {
    spyOn(UserRepository, 'findById').mockResolvedValue({ id: 'user-1' } as any)
    const removeSpy = spyOn(UserRoleRepository, 'removeRole').mockResolvedValue({ count: 0 })

    await expect(RbacService.removeRoleFromUser('user-1', 'role-1')).rejects.toThrow('用户角色关联不存在')
    expect(removeSpy).toHaveBeenCalledWith('user-1', 'role-1')
  })
})
