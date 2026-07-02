import type {
  AssetDetailResponse,
  AssetListQuery,
  AssetListResponse,
  DeleteAssetResponse,
  ImageAssetResponse,
  UpdateAssetRequest,
} from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

export function listAssets(query: AssetListQuery) {
  return readMomoJson<AssetListResponse>(
    momoClient.rpc.assets.$get({
      query: {
        keyword: query.keyword,
        mimeType: query.mimeType,
        page: String(query.page),
        pageSize: String(query.pageSize),
      },
    }),
  )
}

export function getAsset(id: string) {
  return readMomoJson<AssetDetailResponse>(
    momoClient.rpc.assets[':id'].$get({
      param: {
        id,
      },
    }),
  )
}

export function updateAsset(id: string, payload: UpdateAssetRequest) {
  return readMomoJson<ImageAssetResponse>(
    momoClient.rpc.assets[':id'].$patch({
      json: payload,
      param: {
        id,
      },
    }),
  )
}

export function deleteAsset(id: string) {
  return readMomoJson<DeleteAssetResponse>(
    momoClient.rpc.assets[':id'].$delete({
      param: {
        id,
      },
    }),
  )
}

export function uploadAssetImage(file: File) {
  return readMomoJson<ImageAssetResponse>(
    momoClient.rpc.assets.images.$post({
      form: {
        file,
      },
    }),
  )
}
