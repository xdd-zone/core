import type { ResolvedConfig } from '@nexus/core/config'
import type { Health } from './model'
import { prisma } from '@nexus/infra/database'

/**
 * 生成健康检查结果。
 */
export class HealthService {
  constructor(private readonly config: Pick<ResolvedConfig, 'app' | 'openapi'>) {}

  async getHealth(): Promise<Health> {
    const databaseStatus = await this.getDatabaseStatus()

    return {
      status: databaseStatus === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: this.config.app.name,
      version: this.config.openapi.version,
      uptime: process.uptime(),
      database: {
        status: databaseStatus,
      },
    }
  }

  private async getDatabaseStatus(): Promise<'up' | 'down'> {
    try {
      await prisma.$queryRaw`SELECT 1`
      return 'up'
    } catch {
      return 'down'
    }
  }
}
