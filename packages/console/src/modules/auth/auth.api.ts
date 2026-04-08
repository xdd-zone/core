import type { AuthMethod } from './auth.types'
import { ConsoleApiError, resolveApiUrl } from '@console/shared/api'

export { ConsoleApiError as AuthRequestError }

/**
 * 构造 OAuth 登录地址。
 */
export function getOauthSignInUrl(entryPath: string, callbackURL: string): string {
  const url = new URL(resolveApiUrl(entryPath))
  url.searchParams.set('callbackURL', callbackURL)
  return url.toString()
}

/**
 * 解析社交登录动作。
 */
export function resolveAuthMethodAction(method: AuthMethod | undefined, callbackURL: string) {
  if (!method || !method.enabled || !method.implemented || !method.entryPath || method.kind !== 'oauth') {
    return null
  }

  return {
    methodId: method.id,
    url: getOauthSignInUrl(method.entryPath, callbackURL),
  }
}
