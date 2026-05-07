import type { ResolvedConfig } from '@nexus/core/config'
import type { AuthApiSession, SignInEmailPayload, SignUpEmailPayload } from './auth-api.types'
import type { AuthMethodsService } from './auth-methods.service'
import type { BetterAuthAdapter } from './better-auth.adapter'
import type { AuthMutableHeaders } from './cookie.service'
import { UnauthorizedError } from '@nexus/core/http'
import { createAccountStatusService } from './account-status.service'
import { createOAuthRedirectService } from './oauth-redirect.service'

/**
 * 认证接口动作服务。
 */
export interface AuthApiService {
  callbackGithub: (request: Request, headers: AuthMutableHeaders) => Promise<string>
  signInEmail: (request: Request, body: SignInEmailPayload, headers: AuthMutableHeaders) => Promise<AuthApiSession>
  signInGithub: (request: Request, headers: AuthMutableHeaders) => Promise<string>
  signOut: (request: Request, headers: AuthMutableHeaders) => Promise<void>
  signUpEmail: (request: Request, body: SignUpEmailPayload, headers: AuthMutableHeaders) => Promise<AuthApiSession>
}

export function createAuthApiService(
  config: Pick<ResolvedConfig, 'auth' | 'betterAuth'>,
  authMethodsService: AuthMethodsService,
  betterAuthAdapter: BetterAuthAdapter,
): AuthApiService {
  const accountStatusService = createAccountStatusService(betterAuthAdapter)
  const oauthRedirectService = createOAuthRedirectService({
    configuredAuthOrigin: config.betterAuth.url,
    trustedOrigins: config.auth.trustedOrigins,
  })

  return {
    async signInGithub(request: Request, headers: AuthMutableHeaders): Promise<string> {
      const requestUrl = new URL(request.url)
      const requestedCallbackURL = requestUrl.searchParams.get('callbackURL')
      const frontendOrigin = oauthRedirectService.resolveFrontendOrigin(request, requestedCallbackURL)
      let redirectPath = '/dashboard'

      try {
        authMethodsService.assertMethodEnabled('github')

        const callbackURL = oauthRedirectService.resolveCallbackUrl(frontendOrigin, requestedCallbackURL)
        redirectPath = oauthRedirectService.resolveRedirectPath(callbackURL, frontendOrigin)
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
        const trustedBrowserOrigin = oauthRedirectService.resolveTrustedLoginOrigin(request, requestedCallbackURL)
        if (trustedBrowserOrigin) {
          return oauthRedirectService.createLoginRedirectUrl(
            trustedBrowserOrigin,
            redirectPath,
            oauthRedirectService.resolveSocialLoginErrorCode(error),
            'github',
          )
        }

        throw error
      }
    },

    async callbackGithub(request: Request, headers: AuthMutableHeaders): Promise<string> {
      const redirectURL = await betterAuthAdapter.forwardBetterAuthRedirect(request, headers)
      const userId = await betterAuthAdapter.resolveBetterAuthSessionUserId(request, headers)

      if (!userId) {
        return redirectURL
      }

      try {
        await accountStatusService.assertActiveSignedInUser(userId, headers)
        return redirectURL
      } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
          throw error
        }

        const trustedRedirectOrigin = oauthRedirectService.resolveTrustedRedirectOrigin(request, redirectURL)

        if (trustedRedirectOrigin) {
          return oauthRedirectService.createLoginRedirectUrl(
            trustedRedirectOrigin,
            oauthRedirectService.resolveRedirectPath(redirectURL, trustedRedirectOrigin),
            'inactive_account',
            'github',
          )
        }

        throw error
      }
    },

    async signUpEmail(request: Request, body: SignUpEmailPayload, headers: AuthMutableHeaders): Promise<AuthApiSession> {
      authMethodsService.assertMethodEnabled('emailPassword')
      authMethodsService.assertMethodSignUpAllowed('emailPassword')

      return await betterAuthAdapter.forwardBetterAuthResponse<AuthApiSession>(request, {
        body,
        headers,
      })
    },

    async signInEmail(request: Request, body: SignInEmailPayload, headers: AuthMutableHeaders): Promise<AuthApiSession> {
      authMethodsService.assertMethodEnabled('emailPassword')

      const authSession = await betterAuthAdapter.forwardBetterAuthResponse<AuthApiSession>(request, {
        body,
        headers,
      })
      await accountStatusService.assertActiveSignedInUser(authSession.user.id, headers)

      return authSession
    },

    async signOut(request: Request, headers: AuthMutableHeaders): Promise<void> {
      await betterAuthAdapter.revokeBetterAuthSession(request)
      betterAuthAdapter.clearBetterAuthCookies(headers)
    },
  }
}
