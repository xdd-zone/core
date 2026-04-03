import { ConsoleApiError, resolveApiUrl } from '@console/shared/api'

export { ConsoleApiError as AuthRequestError }

/**
 * 构造 GitHub 登录地址。
 */
export function getGithubSignInUrl(callbackURL: string): string {
  const url = new URL(resolveApiUrl('/auth/sign-in/github'))
  url.searchParams.set('callbackURL', callbackURL)
  return url.toString()
}
