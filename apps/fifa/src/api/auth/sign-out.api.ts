import { resolveMomoHttpUrl } from '@fifa/api/momo-url'

export class SignOutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SignOutError'
  }
}

export async function signOut(): Promise<void> {
  let response: Response

  try {
    response = await fetch(resolveMomoHttpUrl('/api/auth/sign-out'), {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    throw new SignOutError('退出登录失败')
  }

  if (response.ok) {
    return
  }

  throw new SignOutError(`退出登录失败: ${response.status}`)
}
