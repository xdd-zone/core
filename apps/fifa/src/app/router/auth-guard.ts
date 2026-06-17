import {
  FifaAuthMeError,
  getFifaAuthMe,
  isFifaAuthForbiddenError,
  isFifaAuthUnauthenticatedError,
  signOut,
} from '@fifa/api/auth'
import { redirect } from '@tanstack/react-router'

export interface FifaAuthGuardResult {
  status: 'allowed' | 'login' | 'forbidden'
}

export async function resolveFifaRouteAccess(): Promise<FifaAuthGuardResult> {
  try {
    await getFifaAuthMe()
    return { status: 'allowed' }
  } catch (error) {
    if (isFifaAuthUnauthenticatedError(error)) {
      return { status: 'login' }
    }

    if (isFifaAuthForbiddenError(error) || error instanceof FifaAuthMeError) {
      await signOut().catch(() => undefined)
      return { status: 'forbidden' }
    }

    throw error
  }
}

export function throwFifaRouteRedirect(result: FifaAuthGuardResult) {
  if (result.status === 'login') {
    throw redirect({
      to: '/login' as never,
      throw: true,
      replace: true,
    })
  }

  if (result.status === 'forbidden') {
    throw redirect({
      to: '/forbidden-example' as never,
      throw: true,
      replace: true,
    })
  }

  return null
}
