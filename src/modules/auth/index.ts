import type { SessionResponse } from './auth.types'
import type { ApiResponse } from '@/core/plugins/response.plugin'
import { Elysia } from 'elysia'
import { authGuard, BadRequestError, responsePlugin } from '@/core'
import { auth } from '@/core/auth'
import { AuthService } from './auth.service'

/**
 * 包装 BetterAuth handler 响应为项目统一格式
 * 功能：
 * 1. 调用 auth.handler() 获取 Response
 * 2. 解析 JSON 数据
 * 3. 保留 Set-Cookie header（session 机制）
 * 4. 转换为统一格式 {code, message, data}
 * 5. 检测 BetterAuth 错误响应并转换为项目错误格式
 *
 * @param request 原始请求对象
 * @param ok responsePlugin 提供的 ok 函数
 * @param set Elysia 的 set 对象（用于设置 header）
 * @param successMessage 成功消息（默认 "操作成功"）
 */
async function wrapBetterAuthResponse<T>(
  request: Request,
  ok: <D>(data: D, message?: string) => ApiResponse<D>,
  set: { headers: Record<string, string | number | string[]> },
  successMessage: string = '操作成功',
): Promise<ApiResponse<T>> {
  const response = await auth.handler(request)
  const data = (await response.json()) as T & { code?: string; message?: string }

  const cookie = response.headers.get('set-cookie')
  if (cookie) {
    set.headers['Set-Cookie'] = cookie
  }

  if (typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string') {
    throw new BadRequestError(data.message || '操作失败')
  }

  return ok(data, successMessage)
}

/**
 * Auth 模块路由
 * 路径: /api/auth/* (在 setupRoutes 中注册)
 *
 * 采用统一响应格式方案：
 * 1. BetterAuth 标准端点 - 使用 wrapBetterAuthResponse 包装，统一响应格式
 * 2. 自定义业务端点 (/api/auth/me) - 保持项目格式，提供统一的响应结构
 */
export const authModule = new Elysia({ prefix: '/auth' })
  .use(responsePlugin)
  /**
   * BetterAuth 标准端点 - 用户注册
   * POST /api/auth/sign-up/email
   */
  .post('/sign-up/email', async ({ request, ok, set }) => wrapBetterAuthResponse(request, ok, set, '注册成功'), {
    detail: {
      summary: '用户注册',
      description: '使用邮箱和密码注册新用户。注册成功后会返回用户信息和 token。',
      tags: ['Auth'],
      responses: {
        200: {
          description: '注册成功',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'number', example: 0 },
                  message: { type: 'string', example: '注册成功' },
                  data: {
                    type: 'object',
                    properties: {
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', description: '用户 ID' },
                          email: { type: 'string', description: '用户邮箱' },
                          name: { type: 'string', description: '用户姓名' },
                          emailVerified: { type: 'boolean', description: '邮箱是否已验证' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                      token: {
                        type: 'string',
                        description: '邮箱验证 token',
                      },
                    },
                  },
                },
              },
            },
          },
          headers: {
            'Set-Cookie': {
              description: 'Session token cookie (HttpOnly, SameSite=Lax)',
              schema: { type: 'string' },
            },
          },
        },
      },
    },
  })
  /**
   * BetterAuth 标准端点 - 用户登录
   * POST /api/auth/sign-in/email
   */
  .post('/sign-in/email', async ({ request, ok, set }) => wrapBetterAuthResponse(request, ok, set, '登录成功'), {
    detail: {
      summary: '用户登录',
      description: '使用邮箱和密码登录。登录成功后会自动设置 session cookie（有效期 7 天）。',
      tags: ['Auth'],
      responses: {
        200: {
          description: '登录成功',
          headers: {
            'Set-Cookie': {
              description: 'Session token cookie (HttpOnly, SameSite=Lax)',
              schema: { type: 'string' },
            },
          },
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'number', example: 0 },
                  message: { type: 'string', example: '登录成功' },
                  data: {
                    type: 'object',
                    properties: {
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          name: { type: 'string' },
                          emailVerified: { type: 'boolean' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                      session: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', description: '会话 ID' },
                          token: { type: 'string', description: 'Session token' },
                          userId: { type: 'string', description: '用户 ID' },
                          expiresAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  /**
   * BetterAuth 标准端点 - 用户登出
   * POST /api/auth/sign-out
   */
  .post('/sign-out', async ({ request, ok, set }) => wrapBetterAuthResponse(request, ok, set, '登出成功'), {
    detail: {
      summary: '用户登出',
      description: '清除当前用户的 session cookie',
      tags: ['Auth'],
      responses: {
        200: {
          description: '登出成功',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'number', example: 0 },
                  message: { type: 'string', example: '登出成功' },
                  data: { nullable: true },
                },
              },
            },
          },
        },
      },
    },
  })
  /**
   * BetterAuth 标准端点 - 获取会话信息
   * GET /api/auth/get-session
   */
  .get('/get-session', async ({ request, ok, set }) => wrapBetterAuthResponse(request, ok, set, '获取成功'), {
    detail: {
      summary: '获取当前会话',
      description: '获取当前 session cookie 对应的用户信息和会话详情。需要携带有效的 session cookie。',
      tags: ['Auth'],
      responses: {
        200: {
          description: '获取成功',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'number', example: 0 },
                  message: { type: 'string', example: '获取成功' },
                  data: {
                    type: 'object',
                    properties: {
                      session: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', description: '会话 ID' },
                          token: { type: 'string', description: 'Session token' },
                          userId: { type: 'string', description: '用户 ID' },
                          expiresAt: { type: 'string', format: 'date-time' },
                        },
                      },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          name: { type: 'string' },
                          emailVerified: { type: 'boolean' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  /**
   * 自定义业务端点 - 获取当前用户信息
   * GET /api/auth/me
   *
   * 这个端点保持项目的统一响应格式 {code, message, data}
   * 适合需要统一格式的业务场景
   */
  .use(authGuard({ required: true }))
  .get(
    '/me',
    async ({ headers, ok }): Promise<{ code: number; message: string; data: SessionResponse | null }> => {
      const session = await AuthService.getSession(new Headers(headers as Record<string, string>))

      return ok(session)
    },
    {
      detail: {
        summary: '获取当前用户信息',
        description: '获取当前登录用户信息（项目统一格式）',
        tags: ['Auth'],
      },
    },
  )

// 导出类型供其他模块使用
export type { AuthResponse, SessionResponse } from './auth.types'
export type { SignInEmailBody, SignUpEmailBody } from './auth.types'
