import type { Session } from './auth.types'
import { auth } from '@/core/auth'

/**
 * 认证服务类
 *
 * 注意：
 * - Better Auth 标准端点（注册、登录、登出、获取会话）直接通过适配层透传
 * - 本服务只负责读取当前会话，供底座型自定义端点复用
 */
export class AuthService {
  /**
   * 获取当前会话
   */
  static async getSession(headers: Headers | HeadersInit): Promise<Session> {
    try {
      const session = await auth.api.getSession({
        headers: headers instanceof Headers ? headers : new Headers(headers),
      })

      return {
        session: session?.session
          ? ({
              ...session.session,
              ipAddress: session.session.ipAddress ?? null,
              userAgent: session.session.userAgent ?? null,
            } as Session['session'])
          : null,
        user: (session?.user as Session['user']) ?? null,
        isAuthenticated: !!session?.session,
      }
    } catch {
      // 会话获取失败返回未认证状态
      return {
        session: null,
        user: null,
        isAuthenticated: false,
      }
    }
  }
}
