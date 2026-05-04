import { apiDetail } from '@nexus/shared'

import { AuthMethodsResponseSchema, AuthSessionSchema, SessionSchema } from './model'

export const AuthOpenApi = {
  methods: apiDetail({
    summary: '获取登录方式',
    description: '返回当前开放的登录方式及是否允许首次创建用户。',
    response: AuthMethodsResponseSchema,
  }),
  signInGithub: apiDetail({
    summary: 'GitHub 登录',
    description: '发起 GitHub OAuth 登录并重定向到授权页。',
    successStatus: 302,
    responseDescription: '重定向到 GitHub 授权页',
    errors: [400],
  }),
  callbackGithub: apiDetail({
    summary: 'GitHub 回调',
    description: '处理 GitHub OAuth 回调并建立会话后重定向到 callbackURL。',
    successStatus: 302,
    responseDescription: '重定向到 callbackURL',
    errors: [400],
  }),
  signUpEmail: apiDetail({
    summary: '用户注册',
    description: '使用邮箱和密码注册新用户。注册成功后会返回用户信息和 token。',
    response: AuthSessionSchema,
    errors: [400],
  }),
  signInEmail: apiDetail({
    summary: '用户登录',
    description: '使用邮箱和密码登录。登录成功后会自动设置 session cookie。',
    response: AuthSessionSchema,
    errors: [400],
  }),
  signOut: apiDetail({
    summary: '用户登出',
    description: '清除当前用户的 session cookie。',
    successStatus: 204,
    responseDescription: '登出成功',
  }),
  getSession: apiDetail({
    summary: '获取当前会话',
    description: '返回当前 cookie 对应的用户信息、会话详情和登录状态。',
    response: SessionSchema,
  }),
  me: apiDetail({
    summary: '获取当前用户信息',
    description: '返回当前登录用户的会话信息。',
    response: SessionSchema,
    errors: [401],
  }),
}
