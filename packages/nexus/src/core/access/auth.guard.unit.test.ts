import type { SecuritySession } from '../auth'
import { UnauthorizedError } from '@nexus/core/http'
import { describe, expect, it } from 'bun:test'
import { assertAuthenticated } from './auth.guard'

function createSession(overrides: Partial<SecuritySession> = {}): SecuritySession {
  return {
    isAuthenticated: false,
    session: null,
    user: null,
    ...overrides,
  }
}

describe('assertAuthenticated', () => {
  it('有效登录态直接放行', () => {
    const now = new Date()
    const auth = createSession({
      isAuthenticated: true,
      user: {
        id: 'user-1',
        email: 'user-1@example.com',
        emailVerified: true,
        emailVerifiedAt: null,
        username: null,
        name: 'User 1',
        image: null,
        introduce: null,
        phone: null,
        phoneVerified: null,
        phoneVerifiedAt: null,
        lastLogin: null,
        lastLoginIp: null,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      session: {
        id: 'session-1',
        userId: 'user-1',
        token: 'token-1',
        expiresAt: new Date(Date.now() + 60_000),
        ipAddress: null,
        userAgent: null,
        createdAt: now,
        updatedAt: now,
      },
    })

    expect(() => assertAuthenticated(auth)).not.toThrow()
  })

  it('未登录时抛 UnauthorizedError', () => {
    let thrown: unknown

    try {
      assertAuthenticated(createSession())
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(UnauthorizedError)
    expect((thrown as Error).message).toBe('请先登录')
  })

  it('用户状态不是 ACTIVE 时抛 UnauthorizedError', () => {
    const now = new Date()

    expect(() =>
      assertAuthenticated(
        createSession({
          isAuthenticated: true,
          user: {
            id: 'user-1',
            email: 'user-1@example.com',
            emailVerified: true,
            emailVerifiedAt: null,
            username: null,
            name: 'User 1',
            image: null,
            introduce: null,
            phone: null,
            phoneVerified: null,
            phoneVerifiedAt: null,
            lastLogin: null,
            lastLoginIp: null,
            status: 'BANNED',
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          },
          session: {
            id: 'session-1',
            userId: 'user-1',
            token: 'token-1',
            expiresAt: new Date(Date.now() + 60_000),
            ipAddress: null,
            userAgent: null,
            createdAt: now,
            updatedAt: now,
          },
        }),
      ),
    ).toThrow(UnauthorizedError)
  })
})
