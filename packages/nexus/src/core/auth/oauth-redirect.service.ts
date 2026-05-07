import { BadRequestError } from '@nexus/core/http'

export type SocialLoginErrorCode =
  | 'auth_method_disabled'
  | 'auth_sign_up_disabled'
  | 'github_sign_in_failed'
  | 'invalid_callback_url'
  | 'inactive_account'

export interface OAuthRedirectService {
  createLoginRedirectUrl: (
    frontendOrigin: string,
    redirectPath: string,
    error: SocialLoginErrorCode,
    method: 'github',
  ) => string
  resolveCallbackUrl: (frontendOrigin: string, value: string | null | undefined, fallbackPath?: string) => string
  resolveFrontendOrigin: (request: Request, callbackURL: string | null | undefined) => string
  resolveRedirectPath: (callbackURL: string, frontendOrigin: string) => string
  resolveSocialLoginErrorCode: (error: unknown) => SocialLoginErrorCode
  resolveTrustedLoginOrigin: (request: Request, callbackURL: string | null | undefined) => string | null
  resolveTrustedRedirectOrigin: (request: Request, redirectURL: string) => string | null
}

export interface OAuthRedirectServiceOptions {
  configuredAuthOrigin: string
  trustedOrigins: string[]
}

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

function resolveAllowedOrigins(trustedOrigins: string[], fallbackOrigin: string) {
  return trustedOrigins.length ? trustedOrigins : [fallbackOrigin]
}

function resolveTrustedBrowserOrigin(request: Request, trustedOrigins: string[]): string | null {
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
    return trustedOrigins.includes(origin) ? origin : null
  } catch {
    return null
  }
}

export function createOAuthRedirectService(options: OAuthRedirectServiceOptions): OAuthRedirectService {
  const configuredAuthOrigin = normalizeOrigin(options.configuredAuthOrigin) ?? 'http://localhost'
  const trustedOrigins = resolveTrustedOrigins(options.trustedOrigins)
  const defaultFrontendOrigin = trustedOrigins[0] ?? configuredAuthOrigin

  function resolveFrontendOrigin(request: Request, callbackURL: string | null | undefined): string {
    return (
      resolveTrustedBrowserOrigin(request, trustedOrigins) ??
      resolveTrustedCallbackOrigin(configuredAuthOrigin, trustedOrigins, callbackURL) ??
      defaultFrontendOrigin
    )
  }

  function resolveCallbackUrl(
    frontendOrigin: string,
    value: string | null | undefined,
    fallbackPath = '/dashboard',
  ): string {
    const nextValue = value && value.trim() ? value : fallbackPath

    try {
      const url = new URL(nextValue, frontendOrigin)
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        !resolveAllowedOrigins(trustedOrigins, defaultFrontendOrigin).includes(url.origin)
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

  function resolveTrustedLoginOrigin(request: Request, callbackURL: string | null | undefined): string | null {
    return (
      resolveTrustedBrowserOrigin(request, trustedOrigins) ??
      resolveTrustedCallbackOrigin(configuredAuthOrigin, trustedOrigins, callbackURL)
    )
  }

  function resolveTrustedRedirectOrigin(request: Request, redirectURL: string): string | null {
    return (
      resolveTrustedCallbackOrigin(configuredAuthOrigin, trustedOrigins, redirectURL) ??
      resolveTrustedBrowserOrigin(request, trustedOrigins)
    )
  }

  return {
    createLoginRedirectUrl,
    resolveCallbackUrl,
    resolveFrontendOrigin,
    resolveRedirectPath,
    resolveSocialLoginErrorCode,
    resolveTrustedLoginOrigin,
    resolveTrustedRedirectOrigin,
  }
}
