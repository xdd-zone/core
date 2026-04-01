import type { AuthApiSession, SignInEmailPayload, SignUpEmailPayload } from './auth-api.types'
import { BETTER_AUTH_CONFIG } from '@nexus/core/config'
import { BadRequestError } from '@nexus/core/http'
import {
  clearBetterAuthCookies,
  forwardBetterAuthRedirect,
  forwardBetterAuthResponse,
  revokeBetterAuthSession,
} from './better-auth.adapter'

type ResponseHeaders = Headers | Record<string, string | number | string[]>
type SocialLoginErrorCode = 'github_sign_in_failed' | 'invalid_callback_url'

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function resolveConfiguredAuthOrigin(request: Request) {
  return normalizeOrigin(BETTER_AUTH_CONFIG.url) ?? new URL(request.url).origin
}

function resolveTrustedOrigins() {
  return BETTER_AUTH_CONFIG.trustedOrigins
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => !!origin)
}

function resolveAllowedOrigins(request: Request) {
  return Array.from(new Set([resolveConfiguredAuthOrigin(request), ...resolveTrustedOrigins()]))
}

function resolveTrustedBrowserOrigin(request: Request): string | null {
  const trustedOrigins = resolveTrustedOrigins()

  const requestOrigin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const candidates = [requestOrigin, referer ? normalizeOrigin(referer) : null]

  for (const candidate of candidates) {
    if (candidate && trustedOrigins.includes(candidate)) {
      return candidate
    }
  }

  return null
}

function resolveTrustedCallbackOrigin(request: Request, value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null
  }

  try {
    const origin = new URL(value, resolveConfiguredAuthOrigin(request)).origin
    return resolveTrustedOrigins().includes(origin) ? origin : null
  } catch {
    return null
  }
}

function resolveFrontendOrigin(request: Request, callbackURL: string | null | undefined): string {
  return (
    resolveTrustedBrowserOrigin(request) ??
    resolveTrustedCallbackOrigin(request, callbackURL) ??
    resolveConfiguredAuthOrigin(request)
  )
}

function resolveBrowserUrl(
  request: Request,
  frontendOrigin: string,
  value: string | null | undefined,
  fallbackPath: string,
): string {
  const nextValue = value && value.trim() ? value : fallbackPath

  try {
    const url = new URL(nextValue, frontendOrigin)
    if (!['http:', 'https:'].includes(url.protocol) || !resolveAllowedOrigins(request).includes(url.origin)) {
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

function createLoginRedirectUrl(frontendOrigin: string, redirectPath: string, error: SocialLoginErrorCode): string {
  const loginUrl = new URL('/login', frontendOrigin)
  loginUrl.searchParams.set('redirect', redirectPath)
  loginUrl.searchParams.set('error', error)
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

  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('invalid callbackurl') || message.includes('callbackurl is required')) {
    return 'invalid_callback_url'
  }

  return 'github_sign_in_failed'
}

/**
 * 认证接口动作服务。
 */
export class AuthApiService {
  /**
   * 发起 GitHub OAuth 登录。
   */
  static async signInGithub(request: Request, headers: ResponseHeaders): Promise<string> {
    const requestUrl = new URL(request.url)
    const requestedCallbackURL = requestUrl.searchParams.get('callbackURL')
    const frontendOrigin = resolveFrontendOrigin(request, requestedCallbackURL)
    let redirectPath = '/dashboard'

    try {
      const callbackURL = resolveBrowserUrl(request, frontendOrigin, requestedCallbackURL, '/dashboard')
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
          requestSignUp: true,
        }),
        headers: socialHeaders,
        method: 'POST',
      })

      return await forwardBetterAuthRedirect(socialSignInRequest, headers)
    } catch (error) {
      const trustedBrowserOrigin =
        resolveTrustedBrowserOrigin(request) ?? resolveTrustedCallbackOrigin(request, requestedCallbackURL)
      if (trustedBrowserOrigin) {
        return createLoginRedirectUrl(trustedBrowserOrigin, redirectPath, resolveSocialLoginErrorCode(error))
      }

      throw error
    }
  }

  /**
   * 处理 GitHub OAuth 回调。
   */
  static async callbackGithub(request: Request, headers: ResponseHeaders): Promise<string> {
    return await forwardBetterAuthRedirect(request, headers)
  }

  /**
   * 邮箱注册。
   */
  static async signUpEmail(
    request: Request,
    body: SignUpEmailPayload,
    headers: ResponseHeaders,
  ): Promise<AuthApiSession> {
    return await forwardBetterAuthResponse<AuthApiSession>(request, {
      body,
      headers,
    })
  }

  /**
   * 邮箱登录。
   */
  static async signInEmail(
    request: Request,
    body: SignInEmailPayload,
    headers: ResponseHeaders,
  ): Promise<AuthApiSession> {
    return await forwardBetterAuthResponse<AuthApiSession>(request, {
      body,
      headers,
    })
  }

  /**
   * 登出当前会话。
   */
  static async signOut(request: Request, headers: ResponseHeaders): Promise<void> {
    await revokeBetterAuthSession(request)
    clearBetterAuthCookies(headers)
  }
}
