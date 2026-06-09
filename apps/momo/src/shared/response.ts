import type { ApiError, ApiFailure, ApiMeta, ApiSuccess } from '@xdd-zone/contracts'
import { buildFailure, buildSuccess } from '@xdd-zone/contracts'

import { createMeta } from './meta'

export function createSuccessResponse<T>(data: T, meta: ApiMeta = createMeta()): ApiSuccess<T> {
  return buildSuccess(data, meta)
}

export function createFailureResponse<E = unknown>(error: ApiError<E>, meta: ApiMeta = createMeta()): ApiFailure<E> {
  return buildFailure(error, meta)
}
