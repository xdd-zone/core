import type { UpdateFifaProfileRequest, UpdatePublicProfileRequest } from '@xdd-zone/contracts'
import { authQueryKeys } from '@fifa/api/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getFifaProfile,
  getPublicProfile,
  linkFifaProfileSocial,
  updateFifaProfile,
  updatePublicProfile,
  uploadFifaProfileAvatar,
} from './profile.api'

export const profileQueryKeys = {
  all: ['profile'] as const,
  detail: () => [...profileQueryKeys.all, 'detail'] as const,
  public: () => [...profileQueryKeys.all, 'public'] as const,
}

export function useFifaProfileQuery() {
  return useQuery({
    queryKey: profileQueryKeys.detail(),
    queryFn: getFifaProfile,
  })
}

export function useUpdateFifaProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateFifaProfileRequest) => updateFifaProfile(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.detail() }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.me() }),
      ])
    },
  })
}

export function useUploadFifaProfileAvatarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadFifaProfileAvatar,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.detail() }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.me() }),
      ])
    },
  })
}

export function useLinkFifaProfileSocialMutation() {
  return useMutation({
    mutationFn: (input: { callbackURL: string; provider: 'github' | 'google' }) =>
      linkFifaProfileSocial(input.provider, input.callbackURL),
  })
}

export function usePublicProfileQuery() {
  return useQuery({
    queryKey: profileQueryKeys.public(),
    queryFn: getPublicProfile,
  })
}

export function useUpdatePublicProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdatePublicProfileRequest) => updatePublicProfile(payload),
    onSuccess: async (response) => {
      if (response.ok) {
        await queryClient.setQueryData(profileQueryKeys.public(), response)
      }

      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.public() })
    },
  })
}
