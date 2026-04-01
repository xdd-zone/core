import type { DocumentDecoration } from 'elysia'
import type { ZodTypeAny } from 'zod'
import { ApiErrorSchema } from '@nexus/shared/schema'

const JSON_CONTENT_TYPE = 'application/json'

const ERROR_RESPONSE_DESCRIPTIONS = {
  400: '请求参数错误',
  401: '未授权访问',
  403: '无权访问此资源',
  404: '请求的资源不存在',
  409: '资源冲突',
  500: '服务器内部错误',
} as const

type ErrorStatusCode = keyof typeof ERROR_RESPONSE_DESCRIPTIONS

function jsonResponse(schema: ZodTypeAny, description: string) {
  return {
    description,
    content: {
      [JSON_CONTENT_TYPE]: {
        schema,
      },
    },
  }
}

function createErrorResponses(errors: ErrorStatusCode[]) {
  return Object.fromEntries(
    errors.map((status) => [status, jsonResponse(ApiErrorSchema, ERROR_RESPONSE_DESCRIPTIONS[status])]),
  )
}

/**
 * 构建统一的 OpenAPI detail 描述。
 */
export function apiDetail(options: {
  summary: string
  description?: string
  response?: ZodTypeAny
  successStatus?: 200 | 201 | 204 | 302
  responseDescription?: string
  errors?: ErrorStatusCode[]
}): DocumentDecoration {
  const { summary, description, response, successStatus = 200, responseDescription = '请求成功', errors = [] } = options
  const responses = {
    ...(successStatus === 204 || successStatus === 302
      ? { [successStatus]: { description: responseDescription } }
      : response
        ? { [successStatus]: jsonResponse(response, responseDescription) }
        : {}),
    ...createErrorResponses(errors),
  }

  return {
    summary,
    ...(description ? { description } : {}),
    ...(Object.keys(responses).length > 0 ? { responses } : {}),
  } as unknown as DocumentDecoration
}
