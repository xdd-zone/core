import { resolveMomoHttpUrl } from '@fifa/api/momo-url'

export interface SignInEmailInput {
  email: string
  password: string
}

interface BetterAuthErrorBody {
  message?: unknown
}

export class SignInEmailError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SignInEmailError'
  }
}

export async function signInEmail(input: SignInEmailInput): Promise<void> {
  let response: Response

  try {
    response = await fetch(resolveMomoHttpUrl('/api/auth/sign-in/email'), {
      body: JSON.stringify(input),
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
  } catch {
    throw new SignInEmailError('Momo 登录请求失败')
  }

  if (response.ok) {
    return
  }

  throw new SignInEmailError(await resolveSignInErrorMessage(response))
}

async function resolveSignInErrorMessage(response: Response): Promise<string> {
  const body = await readBetterAuthErrorBody(response)

  if (typeof body?.message === 'string' && body.message.trim() !== '') {
    return body.message
  }

  if (response.status === 401 || response.status === 403) {
    return '邮箱或密码不正确'
  }

  if (response.status === 429) {
    return '登录请求太频繁，稍后再试'
  }

  return `登录失败: ${response.status}`
}

async function readBetterAuthErrorBody(response: Response): Promise<BetterAuthErrorBody | null> {
  try {
    return (await response.json()) as BetterAuthErrorBody
  } catch {
    return null
  }
}
