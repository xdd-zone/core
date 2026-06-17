import { momoClient } from '@fifa/api/client'
import { BizCode } from '@xdd-zone/contracts'

export interface FifaAuthUser {
  avatarUrl: string | null
  displayName: string
  id: string
}

export interface FifaAuthMeResponse {
  user: FifaAuthUser
}

export class FifaAuthMeError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'FifaAuthMeError'
    this.status = status
    this.code = code
  }
}

export async function getFifaAuthMe(): Promise<FifaAuthMeResponse> {
  const response = await momoClient.rpc.fifa.auth.me.$get()
  const body = (await response.json()) as { data?: FifaAuthMeResponse; error?: { code?: string; message?: string } }

  if (response.ok && body.data) {
    return body.data
  }

  throw new FifaAuthMeError(
    response.status,
    body.error?.code ?? BizCode.SYSTEM_INTERNAL_ERROR,
    body.error?.message ?? 'Momo 请求失败',
  )
}

export function isFifaAuthUnauthenticatedError(error: unknown): error is FifaAuthMeError {
  return error instanceof FifaAuthMeError && error.status === 401
}

export function isFifaAuthForbiddenError(error: unknown): error is FifaAuthMeError {
  return error instanceof FifaAuthMeError && error.status === 403
}
