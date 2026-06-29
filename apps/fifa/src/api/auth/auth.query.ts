import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getFifaAuthMe } from './me.api'
import { signInEmail } from './sign-in.api'
import { signOut } from './sign-out.api'

export const authQueryKeys = {
  all: ['auth'] as const,
  me: () => [...authQueryKeys.all, 'me'] as const,
}

export function useSignInEmailMutation() {
  return useMutation({
    mutationFn: signInEmail,
  })
}

export function useFifaAuthMeQuery() {
  return useQuery({
    queryKey: authQueryKeys.me(),
    queryFn: getFifaAuthMe,
  })
}

export function useFifaAuthMeMutation() {
  return useMutation({
    mutationFn: getFifaAuthMe,
  })
}

export function useSignOutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
