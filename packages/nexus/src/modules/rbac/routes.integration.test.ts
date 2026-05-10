import type { PermissionString } from '@nexus/core'
import { Permissions } from '@nexus/core'
import { prisma } from '@nexus/infra/database'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import {
  cleanupTestData,
  createCookieFetcher,
  createTestApp,
  createTestSuffix,
  createUserFixture,
  expectErrorResponse,
  expectNoBody,
  grantPermissionsToUser,
  readJson,
  seedBasePermissions,
} from '../../test'

const { app } = createTestApp({
  config: {
    auth: {
      methods: {
        emailPassword: {
          enabled: true,
          allowSignUp: true,
        },
      },
    },
  },
})

const createdUserIds: string[] = []
const createdRoleIds: string[] = []

async function signUpSession(prefix: string) {
  const suffix = createTestSuffix(prefix)
  const session = createCookieFetcher(app)
  const response = await session.fetcher(new URL('/api/auth/sign-up/email', 'http://localhost'), {
    body: JSON.stringify({
      email: `${suffix}@example.com`,
      password: `${prefix}-pass-123`,
      name: `RBAC Route ${suffix}`,
    }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  })
  const body = await readJson<{ user: { id: string } }>(response)

  expect(response.status).toBe(200)
  createdUserIds.push(body.user.id)

  return {
    session,
    userId: body.user.id,
  }
}

async function createActorWithPermissions(permissionKeys: readonly PermissionString[]) {
  const actor = await signUpSession('rbac-actor')
  const { role } = await grantPermissionsToUser(actor.userId, permissionKeys, {
    roleName: createTestSuffix('rbac-actor-role'),
    assignedBy: actor.userId,
  })
  createdRoleIds.push(role.id)

  return actor
}

beforeAll(async () => {
  await seedBasePermissions(prisma)
})

afterAll(async () => {
  await cleanupTestData({ userIds: createdUserIds, roleIds: createdRoleIds }, prisma)
})

describe('rbac routes', () => {
  it('GET /roles 返回角色列表', async () => {
    const actor = await createActorWithPermissions([Permissions.ROLE.READ_ALL])
    const response = await actor.session.fetcher(new URL('/api/rbac/roles?page=1&pageSize=20', 'http://localhost'))
    const body = await readJson<{ items: Array<{ name: string }> }>(response)

    expect(response.status).toBe(200)
    expect(body.items.some((role) => role.name === 'superAdmin')).toBe(true)
    expect(body.items.some((role) => role.name === 'user')).toBe(true)
  })

  it('RBAC 后台接口未登录时返回 401', async () => {
    const target = await createUserFixture({ suffix: createTestSuffix('rbac-anon-target') }, prisma)
    createdUserIds.push(target.id)

    const role = await prisma.role.findUnique({
      where: {
        name: 'user',
      },
    })
    expect(role).not.toBeNull()
    if (!role) {
      throw new Error('缺少 user 角色')
    }

    const responses = await Promise.all([
      app.handle(new Request(new URL('/api/rbac/roles', 'http://localhost'))),
      app.handle(new Request(new URL(`/api/rbac/users/${target.id}/roles`, 'http://localhost'))),
      app.handle(
        new Request(new URL(`/api/rbac/users/${target.id}/roles`, 'http://localhost'), {
          body: JSON.stringify({ roleId: role.id }),
          headers: {
            'content-type': 'application/json',
          },
          method: 'POST',
        }),
      ),
      app.handle(
        new Request(new URL(`/api/rbac/users/${target.id}/roles/${role.id}`, 'http://localhost'), { method: 'DELETE' }),
      ),
      app.handle(new Request(new URL(`/api/rbac/users/${target.id}/permissions`, 'http://localhost'))),
      app.handle(new Request(new URL('/api/rbac/users/me/permissions', 'http://localhost'))),
      app.handle(new Request(new URL('/api/rbac/users/me/roles', 'http://localhost'))),
    ])

    for (const response of responses) {
      await expectErrorResponse(response, {
        status: 401,
      })
    }
  })

  it('RBAC 后台接口无权限时返回 403', async () => {
    const actor = await signUpSession('rbac-forbidden')
    const target = await createUserFixture({ suffix: createTestSuffix('rbac-forbidden-target') }, prisma)
    createdUserIds.push(target.id)

    const role = await prisma.role.findUnique({
      where: {
        name: 'user',
      },
    })
    expect(role).not.toBeNull()
    if (!role) {
      throw new Error('缺少 user 角色')
    }

    const responses = await Promise.all([
      actor.session.fetcher(new URL('/api/rbac/roles', 'http://localhost')),
      actor.session.fetcher(new URL(`/api/rbac/users/${target.id}/roles`, 'http://localhost')),
      actor.session.fetcher(new URL(`/api/rbac/users/${target.id}/roles`, 'http://localhost'), {
        body: JSON.stringify({ roleId: role.id }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
      actor.session.fetcher(new URL(`/api/rbac/users/${target.id}/roles/${role.id}`, 'http://localhost'), {
        method: 'DELETE',
      }),
      actor.session.fetcher(new URL(`/api/rbac/users/${target.id}/permissions`, 'http://localhost')),
    ])

    for (const response of responses) {
      await expectErrorResponse(response, {
        status: 403,
      })
    }
  })

  it('可以给用户分配角色并移除，移除返回 204 空 body', async () => {
    const actor = await createActorWithPermissions([
      Permissions.ROLE.READ_ALL,
      Permissions.USER_ROLE.ASSIGN_ALL,
      Permissions.USER_ROLE.REVOKE_ALL,
    ])
    const target = await createUserFixture({ suffix: createTestSuffix('rbac-target') }, prisma)
    createdUserIds.push(target.id)

    const role = await prisma.role.findUnique({
      where: {
        name: 'user',
      },
    })
    expect(role).not.toBeNull()
    if (!role) {
      throw new Error('缺少 user 角色')
    }

    const assignResponse = await actor.session.fetcher(
      new URL(`/api/rbac/users/${target.id}/roles`, 'http://localhost'),
      {
        body: JSON.stringify({ roleId: role.id }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      },
    )
    const assignBody = await readJson<{ userId: string; roleId: string; assignedBy: string | null }>(assignResponse)

    expect(assignResponse.status).toBe(200)
    expect(assignBody).toMatchObject({
      userId: target.id,
      roleId: role.id,
      assignedBy: actor.userId,
    })

    const rolesResponse = await actor.session.fetcher(new URL(`/api/rbac/users/${target.id}/roles`, 'http://localhost'))
    const rolesBody = await readJson<Array<{ roleId: string; roleName: string }>>(rolesResponse)

    expect(rolesResponse.status).toBe(200)
    expect(rolesBody).toContainEqual(
      expect.objectContaining({
        roleId: role.id,
        roleName: 'user',
      }),
    )

    const removeResponse = await actor.session.fetcher(
      new URL(`/api/rbac/users/${target.id}/roles/${role.id}`, 'http://localhost'),
      {
        method: 'DELETE',
      },
    )

    await expectNoBody(removeResponse)
  })

  it('GET /users/me/permissions 返回当前用户权限和角色', async () => {
    const actor = await createActorWithPermissions([
      Permissions.USER_PERMISSION.READ_OWN,
      Permissions.ROLE.READ_ALL,
      Permissions.USER_ROLE.ASSIGN_ALL,
    ])
    const response = await actor.session.fetcher(new URL('/api/rbac/users/me/permissions', 'http://localhost'))
    const body = await readJson<{
      permissions: Array<{ key: string }>
      roles: Array<{ id: string; name: string }>
    }>(response)

    expect(response.status).toBe(200)
    expect(body.permissions).toContainEqual(
      expect.objectContaining({
        key: Permissions.USER_PERMISSION.READ_OWN,
      }),
    )
    expect(body.roles.some((role) => role.name.startsWith('rbac-actor-role'))).toBe(true)
  })

  it('GET /users/me/roles 返回当前用户角色及权限', async () => {
    const actor = await createActorWithPermissions([Permissions.USER_PERMISSION.READ_OWN])
    const response = await actor.session.fetcher(new URL('/api/rbac/users/me/roles', 'http://localhost'))
    const body = await readJson<{
      roles: Array<{
        name: string
        source: string
        permissions: Array<{ key: string }>
      }>
    }>(response)

    expect(response.status).toBe(200)
    expect(body.roles.some((role) => role.name.startsWith('rbac-actor-role') && role.source === 'manual')).toBe(true)
    expect(
      body.roles.some((role) =>
        role.permissions.some((permission) => permission.key === Permissions.USER_PERMISSION.READ_OWN),
      ),
    ).toBe(true)
  })

  it('查询不存在用户时返回 404', async () => {
    const actor = await createActorWithPermissions([
      Permissions.ROLE.READ_ALL,
      Permissions.USER_PERMISSION.READ_ALL,
      Permissions.USER_ROLE.REVOKE_ALL,
    ])
    const role = await prisma.role.findUnique({
      where: {
        name: 'user',
      },
    })
    expect(role).not.toBeNull()
    if (!role) {
      throw new Error('缺少 user 角色')
    }

    const responses = await Promise.all([
      actor.session.fetcher(new URL('/api/rbac/users/missing-user/roles', 'http://localhost')),
      actor.session.fetcher(new URL('/api/rbac/users/missing-user/permissions', 'http://localhost')),
      actor.session.fetcher(new URL(`/api/rbac/users/missing-user/roles/${role.id}`, 'http://localhost'), {
        method: 'DELETE',
      }),
    ])

    for (const response of responses) {
      await expectErrorResponse(response, {
        status: 404,
        message: '用户不存在',
        errorCode: 'NOT_FOUND',
      })
    }
  })

  it('RBAC 非法参数返回 422', async () => {
    const actor = await createActorWithPermissions([Permissions.ROLE.READ_ALL, Permissions.USER_ROLE.ASSIGN_ALL])

    const responses = await Promise.all([
      actor.session.fetcher(new URL('/api/rbac/roles?page=abc', 'http://localhost')),
      actor.session.fetcher(new URL('/api/rbac/roles?page=0', 'http://localhost')),
      actor.session.fetcher(new URL(`/api/rbac/users/${actor.userId}/roles`, 'http://localhost'), {
        body: JSON.stringify({ roleId: '' }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
    ])

    for (const response of responses) {
      await expectErrorResponse(response, {
        status: 422,
        errorCode: 'VALIDATION',
      })
    }
  })
})
