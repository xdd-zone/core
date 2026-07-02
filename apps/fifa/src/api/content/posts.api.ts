import type {
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryRequest,
  CreatePostRequest,
  CreateTagRequest,
  DeleteCategoryResponse,
  DeleteTagResponse,
  GeneratePostMetaRequest,
  GeneratePostMetaResponse,
  LlmUseCaseStatusResponse,
  MdxComponentsResponse,
  PostDetailResponse,
  PostListResponse,
  PreviewTokenResponse,
  SavePostDraftRequest,
  TagListResponse,
  TagResponse,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { resolveMomoHttpUrl } from '../momo-url'
import { readMomoFetchJson, readMomoJson } from '../rpc'

export type PublishContentPostWarning = NonNullable<PostDetailResponse['warnings']>[number]
export type PublishContentPostResponse = PostDetailResponse

export function listContentPosts() {
  return readMomoJson<PostListResponse>(momoClient.rpc.content.posts.$get())
}

export function listContentCategories() {
  return readMomoJson<CategoryListResponse>(momoClient.rpc.content.categories.$get())
}

export function createContentCategory(payload: CreateCategoryRequest) {
  return readMomoJson<CategoryResponse>(
    momoClient.rpc.content.categories.$post({
      json: payload,
    }),
  )
}

export function updateContentCategory(id: string, payload: UpdateCategoryRequest) {
  return readMomoJson<CategoryResponse>(
    momoClient.rpc.content.categories[':id'].$patch({
      json: payload,
      param: {
        id,
      },
    }),
  )
}

export function deleteContentCategory(id: string) {
  return readMomoJson<DeleteCategoryResponse>(
    momoClient.rpc.content.categories[':id'].$delete({
      param: {
        id,
      },
    }),
  )
}

export function listContentTags() {
  return readMomoJson<TagListResponse>(momoClient.rpc.content.tags.$get())
}

export function createContentTag(payload: CreateTagRequest) {
  return readMomoJson<TagResponse>(
    momoClient.rpc.content.tags.$post({
      json: payload,
    }),
  )
}

export function updateContentTag(id: string, payload: UpdateTagRequest) {
  return readMomoJson<TagResponse>(
    momoClient.rpc.content.tags[':id'].$patch({
      json: payload,
      param: {
        id,
      },
    }),
  )
}

export function deleteContentTag(id: string) {
  return readMomoJson<DeleteTagResponse>(
    momoClient.rpc.content.tags[':id'].$delete({
      param: {
        id,
      },
    }),
  )
}

export function createContentPost(payload: CreatePostRequest) {
  return readMomoJson<PostDetailResponse>(
    momoClient.rpc.content.posts.$post({
      json: payload,
    }),
  )
}

export function generateContentPostMetaSuggestion(payload: GeneratePostMetaRequest) {
  return readMomoJson<GeneratePostMetaResponse>(
    momoClient.rpc.content.posts['meta-suggestion'].$post({
      json: payload,
    }),
  )
}

export function getContentPostMetaSuggestionStatus() {
  return readMomoFetchJson<LlmUseCaseStatusResponse>(
    fetch(resolveMomoHttpUrl('/rpc/llm/use-cases/content.post.meta/status'), {
      credentials: 'include',
    }),
  )
}

export function getContentPost(id: string) {
  return readMomoJson<PostDetailResponse>(
    momoClient.rpc.content.posts[':id'].$get({
      param: {
        id,
      },
    }),
  )
}

export function saveContentPostDraft(id: string, payload: SavePostDraftRequest) {
  return readMomoJson<PostDetailResponse>(
    momoClient.rpc.content.posts[':id'].draft.$patch({
      json: payload,
      param: {
        id,
      },
    }),
  )
}

export function createContentPreviewToken(id: string) {
  return readMomoJson<PreviewTokenResponse>(
    momoClient.rpc.content.posts[':id']['preview-token'].$post({
      param: {
        id,
      },
    }),
  )
}

export function publishContentPost(id: string) {
  return readMomoJson<PublishContentPostResponse>(
    momoClient.rpc.content.posts[':id'].publish.$post({
      param: {
        id,
      },
    }),
  )
}

export function archiveContentPost(id: string) {
  return readMomoFetchJson<PostDetailResponse>(
    fetch(resolveMomoHttpUrl(`/rpc/content/posts/${encodeURIComponent(id)}/archive`), {
      credentials: 'include',
      method: 'POST',
    }),
  )
}

export function listMdxComponents() {
  return readMomoJson<MdxComponentsResponse>(momoClient.rpc.content['mdx-components'].$get())
}
