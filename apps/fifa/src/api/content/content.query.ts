import type {
  CreateCategoryRequest,
  CreatePostRequest,
  CreateTagRequest,
  GeneratePostMetaRequest,
  SavePostDraftRequest,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from '@xdd-zone/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveContentPost,
  createContentCategory,
  createContentPost,
  createContentPreviewToken,
  createContentTag,
  deleteContentCategory,
  deleteContentTag,
  generateContentPostMetaSuggestion,
  getContentPost,
  getContentPostMetaSuggestionStatus,
  listContentCategories,
  listContentPosts,
  listContentTags,
  listMdxComponents,
  publishContentPost,
  saveContentPostDraft,
  updateContentCategory,
  updateContentTag,
} from './posts.api'

export const contentQueryKeys = {
  all: ['content'] as const,
  categories: () => [...contentQueryKeys.all, 'categories'] as const,
  mdxComponents: () => [...contentQueryKeys.all, 'mdx-components'] as const,
  post: (id: string) => [...contentQueryKeys.posts(), id] as const,
  postMetaSuggestionStatus: () => [...contentQueryKeys.posts(), 'meta-suggestion', 'status'] as const,
  posts: () => [...contentQueryKeys.all, 'posts'] as const,
  tags: () => [...contentQueryKeys.all, 'tags'] as const,
}

export function useContentPostsQuery() {
  return useQuery({
    queryKey: contentQueryKeys.posts(),
    queryFn: listContentPosts,
  })
}

export function useContentCategoriesQuery() {
  return useQuery({
    queryKey: contentQueryKeys.categories(),
    queryFn: listContentCategories,
  })
}

export function useContentTagsQuery() {
  return useQuery({
    queryKey: contentQueryKeys.tags(),
    queryFn: listContentTags,
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

export function useGenerateContentPostMetaSuggestionMutation() {
  return useMutation({
    mutationFn: (payload: GeneratePostMetaRequest) => generateContentPostMetaSuggestion(payload),
  })
}

export function useContentPostMetaSuggestionStatusQuery() {
  return useQuery({
    queryKey: contentQueryKeys.postMetaSuggestionStatus(),
    queryFn: getContentPostMetaSuggestionStatus,
  })
}

export function useCreateContentCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => createContentCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.categories() })
    },
  })
}

export function useUpdateContentCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; payload: UpdateCategoryRequest }) =>
      updateContentCategory(input.id, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.categories() })
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.posts() })
    },
  })
}

export function useDeleteContentCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteContentCategory(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.categories() })
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.posts() })
    },
  })
}

export function useCreateContentTagMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTagRequest) => createContentTag(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.tags() })
    },
  })
}

export function useUpdateContentTagMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; payload: UpdateTagRequest }) => updateContentTag(input.id, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.tags() })
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.posts() })
    },
  })
}

export function useDeleteContentTagMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteContentTag(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.tags() })
      await queryClient.invalidateQueries({ queryKey: contentQueryKeys.posts() })
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

export function useArchiveContentPostMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => archiveContentPost(id),
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
