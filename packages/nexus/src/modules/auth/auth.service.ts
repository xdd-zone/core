import type { SessionResponse } from './auth.types'
import { auth } from '@/core/auth'

/**
 * 认证服务类
 *
 * 注意: BetterAuth 标准端点 (sign-up, sign-in, sign-out, get-session) 直接使用 auth.handler()
 * 本服务仅用于自定义业务端点 (如 /api/auth/me)
 */
export class AuthService {
  /**
   * 获取当前会话
   */
  static async getSession(headers: Headers): Promise<SessionResponse> {
    try {
      const session = await auth.api.getSession({
        headers,
      })

      return {
        session: session?.session
          ? ({
              ...session.session,
              ipAddress: session.session.ipAddress ?? null,
              userAgent: session.session.userAgent ?? null,
            } as SessionResponse['session'])
          : null,
        user: (session?.user as SessionResponse['user']) ?? null,
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
