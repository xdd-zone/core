import type { AuthApiService, AuthMethodsService, AuthPluginInstance } from '@nexus/core'

import { ApiErrorSchema } from '@nexus/shared/schema'
import { Elysia } from 'elysia'

import {
  AuthMethodsResponseSchema,
  AuthSessionSchema,
  GitHubSignInQuerySchema,
  SessionSchema,
  SignInEmailBodySchema,
  SignUpEmailBodySchema,
} from './model'
import { AuthOpenApi } from './openapi'

/**
 * 认证模块。
 */
export interface AuthModuleOptions {
  authApiService: AuthApiService
  authMethodsService: AuthMethodsService
  authPlugin: AuthPluginInstance
}

export function createAuthModule({ authApiService, authMethodsService, authPlugin }: AuthModuleOptions) {
  return new Elysia({
    name: 'auth-module',
    prefix: '/auth',
    tags: ['Auth'],
  })
    .use(authPlugin)
    .get('/methods', () => AuthMethodsResponseSchema.parse({ methods: authMethodsService.listPublicMethods() }), {
      response: AuthMethodsResponseSchema,
      detail: AuthOpenApi.methods,
    })
    .get(
      '/sign-in/github',
      async ({ request }) => {
        const responseHeaders = new Headers()
        const redirectURL = await authApiService.signInGithub(request, responseHeaders)

        responseHeaders.set('Location', redirectURL)

        return new Response(null, {
          headers: responseHeaders,
          status: 302,
        })
      },
      {
        query: GitHubSignInQuerySchema,
        detail: AuthOpenApi.signInGithub,
      },
    )
    .get(
      '/callback/github',
      async ({ request }) => {
        const responseHeaders = new Headers()
        const redirectURL = await authApiService.callbackGithub(request, responseHeaders)

        responseHeaders.set('Location', redirectURL)

        return new Response(null, {
          headers: responseHeaders,
          status: 302,
        })
      },
      {
        detail: AuthOpenApi.callbackGithub,
      },
    )
    .post(
      '/sign-up/email',
      async ({ body, request, set }) =>
        AuthSessionSchema.parse(await authApiService.signUpEmail(request, body, set.headers)),
      {
        body: SignUpEmailBodySchema,
        response: {
          200: AuthSessionSchema,
          400: ApiErrorSchema,
        },
        detail: AuthOpenApi.signUpEmail,
      },
    )
    .post(
      '/sign-in/email',
      async ({ body, request, set }) =>
        AuthSessionSchema.parse(await authApiService.signInEmail(request, body, set.headers)),
      {
        body: SignInEmailBodySchema,
        response: {
          200: AuthSessionSchema,
          400: ApiErrorSchema,
        },
        detail: AuthOpenApi.signInEmail,
      },
    )
    .post(
      '/sign-out',
      async ({ request, set }) => {
        await authApiService.signOut(request, set.headers)
        set.status = 204
      },
      {
        detail: AuthOpenApi.signOut,
      },
    )
    .get('/get-session', ({ auth }) => SessionSchema.parse(auth), {
      response: SessionSchema,
      detail: AuthOpenApi.getSession,
    })
    .get('/me', ({ auth }) => SessionSchema.parse(auth), {
      auth: 'required',
      response: {
        200: SessionSchema,
        401: ApiErrorSchema,
      },
      detail: AuthOpenApi.me,
    })
}
