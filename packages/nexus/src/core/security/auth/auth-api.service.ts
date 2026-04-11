import type { ResolvedConfig } from '@nexus/core/config'
import type { AuthApiSession, SignInEmailPayload, SignUpEmailPayload } from './auth-api.types'
import type { AuthMethodsService } from './auth-methods.service'
import type { BetterAuthAdapter } from './better-auth.adapter'
import { BadRequestError } from '@nexus/core/http'

type ResponseHeaders = Headers | Record<string, string | number | string[]>
type SocialLoginErrorCode =
  | 'auth_method_disabled'
  | 'auth_sign_up_disabled'
  | 'github_sign_in_failed'
  | 'invalid_callback_url'

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function resolveTrustedOrigins(trustedOrigins: string[]) {
  return trustedOrigins.map((origin) => normalizeOrigin(origin)).filter((origin): origin is string => !!origin)
}

function resolveAllowedOrigins(configuredAuthOrigin: string, trustedOrigins: string[]) {
  return Array.from(new Set([configuredAuthOrigin, ...resolveTrustedOrigins(trustedOrigins)]))
}

function resolveTrustedBrowserOrigin(request: Request, trustedOrigins: string[]): string | null {
  const normalizedTrustedOrigins = resolveTrustedOrigins(trustedOrigins)

  const requestOrigin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const candidates = [requestOrigin, referer ? normalizeOrigin(referer) : null]

  for (const candidate of candidates) {
    if (candidate && normalizedTrustedOrigins.includes(candidate)) {
      return candidate
    }
  }

  return null
}

function resolveTrustedCallbackOrigin(
  configuredAuthOrigin: string,
  trustedOrigins: string[],
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) {
    return null
  }

  try {
    const origin = new URL(value, configuredAuthOrigin).origin
    return resolveTrustedOrigins(trustedOrigins).includes(origin) ? origin : null
  } catch {
    return null
  }
}

function resolveFrontendOrigin(
  request: Request,
  configuredAuthOrigin: string,
  trustedOrigins: string[],
  callbackURL: string | null | undefined,
): string {
  return (
    resolveTrustedBrowserOrigin(request, trustedOrigins) ??
    resolveTrustedCallbackOrigin(configuredAuthOrigin, trustedOrigins, callbackURL) ??
    configuredAuthOrigin
  )
}

function resolveBrowserUrl(
  configuredAuthOrigin: string,
  trustedOrigins: string[],
  frontendOrigin: string,
  value: string | null | undefined,
  fallbackPath: string,
): string {
  const nextValue = value && value.trim() ? value : fallbackPath

  try {
    const url = new URL(nextValue, frontendOrigin)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !resolveAllowedOrigins(configuredAuthOrigin, trustedOrigins).includes(url.origin)
    ) {
      throw new BadRequestError('Invalid callbackURL', 'INVALID_CALLBACK_URL')
    }

    return url.toString()
  } catch (error) {
    if (value?.trim()) {
      if (error instanceof BadRequestError) {
        throw error
      }

      throw new BadRequestError('Invalid callbackURL', 'INVALID_CALLBACK_URL')
    }

    return new URL(fallbackPath, frontendOrigin).toString()
  }
}

function resolveRedirectPath(callbackURL: string, frontendOrigin: string): string {
  try {
    const url = new URL(callbackURL, frontendOrigin)
    if (url.origin !== frontendOrigin) {
      return '/dashboard'
    }

    return `${url.pathname}${url.search}${url.hash}` || '/dashboard'
  } catch {
    return '/dashboard'
  }
}

function createLoginRedirectUrl(
  frontendOrigin: string,
  redirectPath: string,
  error: SocialLoginErrorCode,
  method: 'github',
): string {
  const loginUrl = new URL('/login', frontendOrigin)
  loginUrl.searchParams.set('redirect', redirectPath)
  loginUrl.searchParams.set('error', error)
  loginUrl.searchParams.set('method', method)
  return loginUrl.toString()
}

function resolveSocialLoginErrorCode(error: unknown): SocialLoginErrorCode {
  const errorCode =
    typeof error === 'object' && error && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : undefined

  if (errorCode === 'INVALID_CALLBACK_URL') {
    return 'invalid_callback_url'
  }

  if (errorCode === 'AUTH_METHOD_DISABLED') {
    return 'auth_method_disabled'
  }

  if (errorCode === 'AUTH_SIGN_UP_DISABLED') {
    return 'auth_sign_up_disabled'
  }

  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('invalid callbackurl') || message.includes('callbackurl is required')) {
    return 'invalid_callback_url'
  }

  return 'github_sign_in_failed'
}

/**
 * 认证接口动作服务。
 */
export interface AuthApiService {
  callbackGithub: (request: Request, headers: ResponseHeaders) => Promise<string>
  signInEmail: (request: Request, body: SignInEmailPayload, headers: ResponseHeaders) => Promise<AuthApiSession>
  signInGithub: (request: Request, headers: ResponseHeaders) => Promise<string>
  signOut: (request: Request, headers: ResponseHeaders) => Promise<void>
  signUpEmail: (request: Request, body: SignUpEmailPayload, headers: ResponseHeaders) => Promise<AuthApiSession>
}

export function createAuthApiService(
  config: Pick<ResolvedConfig, 'auth' | 'betterAuth'>,
  authMethodsService: AuthMethodsService,
  betterAuthAdapter: BetterAuthAdapter,
): AuthApiService {
  const configuredAuthOrigin = normalizeOrigin(config.betterAuth.url) ?? 'http://localhost'
  const trustedOrigins = config.auth.trustedOrigins

  return {
    async signInGithub(request: Request, headers: ResponseHeaders): Promise<string> {
      const requestUrl = new URL(request.url)
      const requestedCallbackURL = requestUrl.searchParams.get('callbackURL')
      const frontendOrigin = resolveFrontendOrigin(request, configuredAuthOrigin, trustedOrigins, requestedCallbackURL)
      let redirectPath = '/dashboard'

      try {
        authMethodsService.assertMethodEnabled('github')

        const callbackURL = resolveBrowserUrl(
          configuredAuthOrigin,
          trustedOrigins,
          frontendOrigin,
          requestedCallbackURL,
          '/dashboard',
        )
        redirectPath = resolveRedirectPath(callbackURL, frontendOrigin)
        const errorCallbackURL = new URL('/login', frontendOrigin)
        errorCallbackURL.searchParams.set('redirect', redirectPath)

        const socialSignInUrl = new URL(request.url)
        socialSignInUrl.pathname = socialSignInUrl.pathname.replace(/\/sign-in\/github$/, '/sign-in/social')
        socialSignInUrl.search = ''

        const socialHeaders = new Headers(request.headers)
        socialHeaders.set('content-type', 'application/json')
        socialHeaders.set('origin', requestUrl.origin)

        const socialSignInRequest = new Request(socialSignInUrl.toString(), {
          body: JSON.stringify({
            callbackURL,
            errorCallbackURL: errorCallbackURL.toString(),
            newUserCallbackURL: callbackURL,
            provider: 'github',
            requestSignUp: authMethodsService.canMethodSignUp('github'),
          }),
          headers: socialHeaders,
          method: 'POST',
        })

        return await betterAuthAdapter.forwardBetterAuthRedirect(socialSignInRequest, headers)
      } catch (error) {
        const trustedBrowserOrigin =
          resolveTrustedBrowserOrigin(request, trustedOrigins) ??
          resolveTrustedCallbackOrigin(configuredAuthOrigin, trustedOrigins, requestedCallbackURL)
        if (trustedBrowserOrigin) {
          return createLoginRedirectUrl(
            trustedBrowserOrigin,
            redirectPath,
            resolveSocialLoginErrorCode(error),
            'github',
          )
        }

        throw error
      }
    },

    async callbackGithub(request: Request, headers: ResponseHeaders): Promise<string> {
      return await betterAuthAdapter.forwardBetterAuthRedirect(request, headers)
    },

    async signUpEmail(request: Request, body: SignUpEmailPayload, headers: ResponseHeaders): Promise<AuthApiSession> {
      authMethodsService.assertMethodEnabled('emailPassword')
      authMethodsService.assertMethodSignUpAllowed('emailPassword')

      return await betterAuthAdapter.forwardBetterAuthResponse<AuthApiSession>(request, {
        body,
        headers,
      })
    },

    async signInEmail(request: Request, body: SignInEmailPayload, headers: ResponseHeaders): Promise<AuthApiSession> {
      authMethodsService.assertMethodEnabled('emailPassword')

      return await betterAuthAdapter.forwardBetterAuthResponse<AuthApiSession>(request, {
        body,
        headers,
      })
    },

    async signOut(request: Request, headers: ResponseHeaders): Promise<void> {
      await betterAuthAdapter.revokeBetterAuthSession(request)
      betterAuthAdapter.clearBetterAuthCookies(headers)
    },
  }
}
