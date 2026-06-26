import type { AssetListQuery, CreatePostRequest, SavePostDraftRequest, UpdateAssetRequest } from '@xdd-zone/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createContentPost,
  createContentPreviewToken,
  deleteContentAsset,
  getContentAsset,
  getContentPost,
  listContentAssets,
  listContentPosts,
  listMdxComponents,
  publishContentPost,
  saveContentPostDraft,
  updateContentAsset,
  uploadContentImage,
} from './posts.api'

export const contentQueryKeys = {
  all: ['content'] as const,
  asset: (id: string) => [...contentQueryKeys.assets(), id] as const,
  assets: () => [...contentQueryKeys.all, 'assets'] as const,
  mdxComponents: () => [...contentQueryKeys.all, 'mdx-components'] as const,
  post: (id: string) => [...contentQueryKeys.posts(), id] as const,
  posts: () => [...contentQueryKeys.all, 'posts'] as const,
}

export function useContentPostsQuery() {
  return useQuery({
    queryKey: contentQueryKeys.posts(),
    queryFn: listContentPosts,
  })
}

export function useContentAssetsQuery(query: AssetListQuery, options?: { enabled?: boolean }) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: [...contentQueryKeys.assets(), query] as const,
    queryFn: () => listContentAssets(query),
  })
}

export function useContentPostQuery(id: string) {
  return useQuery({
    enabled: id.length > 0,
    queryKey: contentQueryKeys.post(id),
    queryFn: () => getContentPost(id),
  })
}

export function useContentAssetQuery(id: string) {
  return useQuery({
    enabled: id.length > 0,
    queryKey: contentQueryKeys.asset(id),
    queryFn: () => getContentAsset(id),
  })
}

export function useMdxComponentsQuery() {
  return useQuery({
    queryKey: contentQueryKeys.mdxComponents(),
    queryFn: listMdxComponents,
  })
}

export function useCreateContentPostMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePostRequest) => createContentPost(payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: contentQueryKeys.posts(),
      })

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: contentQueryKeys.post(response.data.post.id),
        })
      }
    },
  })
}

export function useSaveContentPostDraftMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SavePostDraftRequest) => saveContentPostDraft(id, payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: contentQueryKeys.posts(),
      })

      if (response.ok) {
        await queryClient.setQueryData(contentQueryKeys.post(id), response)
      }
    },
  })
}

export function useCreateContentPreviewTokenMutation(id: string) {
  return useMutation({
    mutationFn: () => createContentPreviewToken(id),
  })
}

export function useUpdateContentAssetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; payload: UpdateAssetRequest }) => updateContentAsset(input.id, input.payload),
    onSuccess: async (response, input) => {
      if (response.ok) {
        await queryClient.setQueryData(contentQueryKeys.asset(input.id), response)
      }
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.assets() })
    },
  })
}

export function useDeleteContentAssetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteContentAsset(id),
    onSuccess: async (_response, id) => {
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.asset(id) })
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.assets() })
    },
  })
}

export function usePublishContentPostMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => publishContentPost(id),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: contentQueryKeys.posts(),
      })

      if (response.ok) {
        await queryClient.setQueryData(contentQueryKeys.post(id), response)
      }
    },
  })
}

export function useUploadContentImageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadContentImage(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.assets() })
    },
  })
}
