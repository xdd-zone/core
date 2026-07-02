import type { AssetListQuery, UpdateAssetRequest } from '@xdd-zone/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteAsset, getAsset, listAssets, updateAsset, uploadAssetImage } from './assets.api'

export const assetQueryKeys = {
  all: ['assets'] as const,
  asset: (id: string) => [...assetQueryKeys.assets(), id] as const,
  assets: () => [...assetQueryKeys.all, 'list'] as const,
}

export function useAssetsQuery(query: AssetListQuery, options?: { enabled?: boolean }) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: [...assetQueryKeys.assets(), query] as const,
    queryFn: () => listAssets(query),
  })
}

export function useAssetQuery(id: string) {
  return useQuery({
    enabled: id.length > 0,
    queryKey: assetQueryKeys.asset(id),
    queryFn: () => getAsset(id),
  })
}

export function useUpdateAssetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; payload: UpdateAssetRequest }) => updateAsset(input.id, input.payload),
    onSuccess: async (response, input) => {
      if (response.ok) {
        await queryClient.setQueryData(assetQueryKeys.asset(input.id), response)
      }

      await queryClient.invalidateQueries({ queryKey: assetQueryKeys.assets() })
    },
  })
}

export function useDeleteAssetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: async (_response, id) => {
      await queryClient.invalidateQueries({ queryKey: assetQueryKeys.asset(id) })
      await queryClient.invalidateQueries({ queryKey: assetQueryKeys.assets() })
    },
  })
}

export function useUploadAssetImageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadAssetImage(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: assetQueryKeys.assets() })
    },
  })
}
