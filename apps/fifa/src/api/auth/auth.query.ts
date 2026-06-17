import { useMutation } from '@tanstack/react-query'

import { getFifaAuthMe } from './me.api'
import { signInEmail } from './sign-in.api'

export function useSignInEmailMutation() {
  return useMutation({
    mutationFn: signInEmail,
  })
}

export function useFifaAuthMeMutation() {
  return useMutation({
    mutationFn: getFifaAuthMe,
  })
}
