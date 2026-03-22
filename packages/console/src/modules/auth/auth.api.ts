import type { SessionPayload, SignInEmailBody } from './auth.types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class AuthRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'AuthRequestError'
  }
}

function buildUrl(path: string) {
  return `${API_BASE_URL}${path}`
}

async function parseError(response: Response): Promise<AuthRequestError> {
  try {
    const payload = (await response.json()) as { message?: string }
    return new AuthRequestError(payload.message || '请求失败', response.status)
  } catch {
    return new AuthRequestError(response.statusText || '请求失败', response.status)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

/**
 * 认证 API。
 */
export const authApi = {
  async getSession() {
    return await request<SessionPayload>('/auth/get-session', {
      method: 'GET',
    })
  },

  async signIn(body: SignInEmailBody) {
    return await request('/auth/sign-in/email', {
      body: JSON.stringify(body),
      method: 'POST',
    })
  },

  async signOut() {
    return await request<void>('/auth/sign-out', {
      method: 'POST',
    })
  },
}
