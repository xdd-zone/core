import type { ApiError } from '@xdd-zone/contracts'
import { BizCode } from '@xdd-zone/contracts'
import { z } from 'zod'

type FlattenableZodError = Parameters<typeof z.flattenError>[0]

export function createValidationFailure(
  error: FlattenableZodError,
): ApiError<ReturnType<typeof z.flattenError>> {
  return {
    code: BizCode.COMMON_INVALID_REQUEST,
    message: '请求参数不正确',
    details: z.flattenError(error),
  }
}
