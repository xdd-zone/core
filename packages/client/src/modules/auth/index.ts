import type { SignInEmailBody, SignUpEmailBody, GetSessionResponse, SignOutResponse, AuthResponse } from './types'
import type { XDDResponse, RequestOptions } from '../../core/types'

interface EndpointAccessor<T = unknown> {
  get(): Promise<XDDResponse<T>>
  post(body?: unknown): Promise<XDDResponse<T>>
  put(body?: unknown): Promise<XDDResponse<T>>
  patch(body?: unknown): Promise<XDDResponse<T>>
  delete(): Promise<XDDResponse<T>>
}

interface LocalRequestOptions extends RequestOptions {
  body?: string
  params?: Record<string, unknown>
  timeout?: number
  headers?: Record<string, string>
}

async function request<T>(
  baseURL: string,
  method: string,
  path: string,
  options: LocalRequestOptions | undefined,
  cookieStore: Map<string, string>,
): Promise<XDDResponse<T>> {
  const base = baseURL.replace(/\/$/, '')
  const fullPath = path.startsWith('/') ? path.slice(1) : path
  const url = new URL(`${base}/${fullPath}`)

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const cookieHeader = Array.from(cookieStore.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')

  let originHeader = ''
  try {
    originHeader = new URL(base).origin
  } catch {}

  const controller = new AbortController()
  const timeout = typeof options?.timeout === 'number' ? options.timeout : 30000
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(originHeader ? { Origin: originHeader } : {}),
        Cookie: cookieHeader,
        ...(options?.headers as Record<string, string>),
      },
      body: options?.body,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      const cookieParts = setCookieHeader.split(';')
      const cookieNameValue = cookieParts[0].trim()
      const equalsIndex = cookieNameValue.indexOf('=')
      if (equalsIndex > 0) {
        const name = cookieNameValue.substring(0, equalsIndex)
        const value = cookieNameValue.substring(equalsIndex + 1)
        cookieStore.set(name, value)
      }
    }

    let data: T
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = (await response.json()) as T
    } else {
      data = (await response.text()) as T
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`请求超时: ${method} ${path}`)
    }
    throw error
  }
}

export interface AuthSignIn {
  post(body: SignInEmailBody): Promise<XDDResponse<AuthResponse>>
}

export interface AuthSignUp {
  post(body: SignUpEmailBody): Promise<XDDResponse<AuthResponse>>
}

export interface AuthAccessors {
  signIn: AuthSignIn
  signUp: AuthSignUp
  getSession: EndpointAccessor<GetSessionResponse>
  signOut: EndpointAccessor<SignOutResponse>
  me: EndpointAccessor<GetSessionResponse>
}

export function createAuthAccessor(baseURL: string, cookieStore: Map<string, string>): AuthAccessors {
  return {
    signIn: {
      post: (body: SignInEmailBody) =>
        request<AuthResponse>(baseURL, 'POST', 'auth/sign-in/email', { body: JSON.stringify(body) }, cookieStore),
    },
    signUp: {
      post: (body: SignUpEmailBody) =>
        request<AuthResponse>(baseURL, 'POST', 'auth/sign-up/email', { body: JSON.stringify(body) }, cookieStore),
    },
    getSession: {
      get: () => request<GetSessionResponse>(baseURL, 'GET', 'auth/get-session', undefined, cookieStore),
      post: () => request<GetSessionResponse>(baseURL, 'POST', 'auth/get-session', undefined, cookieStore),
      put: () => request<GetSessionResponse>(baseURL, 'PUT', 'auth/get-session', undefined, cookieStore),
      patch: () => request<GetSessionResponse>(baseURL, 'PATCH', 'auth/get-session', undefined, cookieStore),
      delete: () => request<GetSessionResponse>(baseURL, 'DELETE', 'auth/get-session', undefined, cookieStore),
    },
    signOut: {
      post: () => request<SignOutResponse>(baseURL, 'POST', 'auth/sign-out', undefined, cookieStore),
      get: () => request<SignOutResponse>(baseURL, 'GET', 'auth/sign-out', undefined, cookieStore),
      delete: () => request<SignOutResponse>(baseURL, 'DELETE', 'auth/sign-out', undefined, cookieStore),
      put: () => request<SignOutResponse>(baseURL, 'PUT', 'auth/sign-out', undefined, cookieStore),
      patch: () => request<SignOutResponse>(baseURL, 'PATCH', 'auth/sign-out', undefined, cookieStore),
    },
    me: {
      get: () => request<GetSessionResponse>(baseURL, 'GET', 'auth/me', undefined, cookieStore),
      post: () => request<GetSessionResponse>(baseURL, 'POST', 'auth/me', undefined, cookieStore),
      put: () => request<GetSessionResponse>(baseURL, 'PUT', 'auth/me', undefined, cookieStore),
      patch: () => request<GetSessionResponse>(baseURL, 'PATCH', 'auth/me', undefined, cookieStore),
      delete: () => request<GetSessionResponse>(baseURL, 'DELETE', 'auth/me', undefined, cookieStore),
    },
  }
}
