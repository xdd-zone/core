import type { AuthenticatedSecuritySession, SecuritySession } from '../auth'
import { UnauthorizedError } from '@nexus/core/http'

/**
 * 断言当前请求已登录。
 */
export function assertAuthenticated(auth: SecuritySession): asserts auth is AuthenticatedSecuritySession {
  if (!auth.isAuthenticated || !auth.session || !auth.user) {
    throw new UnauthorizedError('请先登录')
  }
}
