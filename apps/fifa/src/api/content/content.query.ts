import type { CreatePostRequest, SavePostDraftRequest } from '@xdd-zone/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createContentPost,
  createContentPreviewToken,
  getContentPost,
  listContentPosts,
  listMdxComponents,
  publishContentPost,
  saveContentPostDraft,
  uploadContentImage,
} from './posts.api'

export const contentQueryKeys = {
  all: ['content'] as const,
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

export function useContentPostQuery(id: string) {
  return useQuery({
    enabled: id.length > 0,
    queryKey: contentQueryKeys.post(id),
    queryFn: () => getContentPost(id),
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
  return useMutation({
    mutationFn: (file: File) => uploadContentImage(file),
  })
}
