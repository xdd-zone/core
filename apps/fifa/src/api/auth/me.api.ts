import { momoClient } from '@fifa/api/client'
import { readMomoJson } from '@fifa/api/rpc'

export interface FifaAuthUser {
  avatarUrl: string | null
  displayName: string
  id: string
}

export interface FifaAuthMeResponse {
  user: FifaAuthUser
}

export class FifaAuthMeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FifaAuthMeError'
  }
}

export async function getFifaAuthMe(): Promise<FifaAuthMeResponse> {
  const response = await readMomoJson<FifaAuthMeResponse>(momoClient.rpc.fifa.auth.me.$get())

  if (!response.ok) {
    throw new FifaAuthMeError(response.error.message)
  }

  return response.data
}
