import type {
  CreatePostRequest,
  ImageAssetResponse,
  MdxComponentsResponse,
  PostDetailResponse,
  PostListResponse,
  PreviewTokenResponse,
  SavePostDraftRequest,
} from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

export function listContentPosts() {
  return readMomoJson<PostListResponse>(momoClient.rpc.content.posts.$get())
}

export function createContentPost(payload: CreatePostRequest) {
  return readMomoJson<PostDetailResponse>(
    momoClient.rpc.content.posts.$post({
      json: payload,
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
  return readMomoJson<PostDetailResponse>(
    momoClient.rpc.content.posts[':id'].publish.$post({
      param: {
        id,
      },
    }),
  )
}

export function listMdxComponents() {
  return readMomoJson<MdxComponentsResponse>(momoClient.rpc.content['mdx-components'].$get())
}

export function uploadContentImage(file: File) {
  return readMomoJson<ImageAssetResponse>(
    momoClient.rpc.content.assets.images.$post({
      form: {
        file,
      },
    }),
  )
}
