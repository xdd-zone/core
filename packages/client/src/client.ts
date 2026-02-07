/**
 * XDD Zone HTTP Client SDK
 */

import type { ClientOptions, RequestOptions, XDDResponse } from './core/types'
import { RequestInterceptorChain, ResponseInterceptorChain } from './core/interceptors'
import { createAuthAccessor, type AuthAccessors } from './modules/auth'
import { createUserAccessor, type UserAccessors } from './modules/user'
import { createRbacAccessor, type RbacAccessors } from './modules/rbac'
import type { SignInEmailBody, SignUpEmailBody, GetSessionResponse, SignOutResponse, AuthResponse } from './types/auth'
import type { RequestInterceptor, ResponseInterceptor } from './interceptors/types'

/**
 * XDD Zone HTTP 客户端
 */
export class XDDClient {
  readonly baseURL: string
  readonly headers: Record<string, string>
  readonly timeout: number
  readonly cookies: Map<string, string>

  readonly requestInterceptors: RequestInterceptorChain
  readonly responseInterceptors: ResponseInterceptorChain

  readonly auth: AuthAccessors
  readonly user: UserAccessors
  readonly rbac: RbacAccessors

  constructor(options: ClientOptions) {
    this.baseURL = options.baseURL.replace(/\/$/, '')
    this.headers = options.headers ?? {}
    this.timeout = options.timeout ?? 30000
    this.cookies = new Map()

    this.requestInterceptors = new RequestInterceptorChain()
    this.responseInterceptors = new ResponseInterceptorChain()

    this.auth = createAuthAccessor(this.baseURL, this.cookies)
    this.user = createUserAccessor(this.baseURL, this.cookies)
    this.rbac = createRbacAccessor({ baseURL: this.baseURL, cookieStore: this.cookies })
  }

  setCookie(header: string | null): void {
    if (!header) return
    const cookieParts = header.split(';')
    const cookieNameValue = cookieParts[0].trim()
    const equalsIndex = cookieNameValue.indexOf('=')
    if (equalsIndex > 0) {
      const name = cookieNameValue.substring(0, equalsIndex)
      const value = cookieNameValue.substring(equalsIndex + 1)
      this.cookies.set(name, value)
    }
  }

  getCookies(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  clearCookies(): void {
    this.cookies.clear()
  }

  async getSession(): Promise<XDDResponse<GetSessionResponse>> {
    return this.auth.getSession.get()
  }

  async signIn(body: SignInEmailBody): Promise<XDDResponse<AuthResponse>> {
    return this.auth.signIn.post(body) as Promise<XDDResponse<AuthResponse>>
  }

  async signUp(body: SignUpEmailBody): Promise<XDDResponse<AuthResponse>> {
    return this.auth.signUp.post(body) as Promise<XDDResponse<AuthResponse>>
  }

  async signOut(): Promise<XDDResponse<SignOutResponse>> {
    return this.auth.signOut.post() as Promise<XDDResponse<SignOutResponse>>
  }

  onRequest(
    interceptor:
      | RequestInterceptor
      | ((method: string, path: string, options: RequestOptions) => RequestOptions | void),
  ): this {
    this.requestInterceptors.use(interceptor as never)
    return this
  }

  onResponse<T>(interceptor: ResponseInterceptor<T> | ((data: T, status: number, headers: Headers) => T | void)): this {
    this.responseInterceptors.use(interceptor as never)
    return this
  }
}

export function createClient(options: ClientOptions): XDDClient {
  return new XDDClient(options)
}

export default createClient
