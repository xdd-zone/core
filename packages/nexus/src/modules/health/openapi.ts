import { apiDetail } from '@nexus/shared'

import { HealthSchema } from './model'

export const HealthOpenApi = {
  check: apiDetail({
    summary: '健康检查',
    description: '返回服务当前可用状态与数据库依赖状态。',
    response: HealthSchema,
  }),
}
