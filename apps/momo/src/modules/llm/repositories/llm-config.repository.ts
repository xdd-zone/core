import type { LlmUseCase } from '@xdd-zone/contracts'
import type { DbClient } from '#momo/infra/db/client'
import type { LlmUseCaseConfigRecord, UpsertLlmUseCaseConfigInput } from '../types/config.types'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { llmUseCaseConfigs } from '#momo/infra/db/schema/index'

export function createLlmConfigRepository(db: DbClient) {
  async function listConfigs(): Promise<LlmUseCaseConfigRecord[]> {
    return db.select().from(llmUseCaseConfigs).orderBy(llmUseCaseConfigs.useCase)
  }

  async function findConfigByUseCase(useCase: LlmUseCase): Promise<LlmUseCaseConfigRecord | null> {
    const rows = await db.select().from(llmUseCaseConfigs).where(eq(llmUseCaseConfigs.useCase, useCase)).limit(1)

    return rows[0] ?? null
  }

  async function upsertConfig(input: UpsertLlmUseCaseConfigInput): Promise<LlmUseCaseConfigRecord> {
    const rows = await db
      .insert(llmUseCaseConfigs)
      .values({
        apiFormat: input.apiFormat,
        baseUrl: input.baseUrl,
        enabled: input.enabled ? 1 : 0,
        id: randomUUID(),
        maxOutputTokens: input.maxOutputTokens,
        model: input.model,
        provider: input.provider,
        temperature: input.temperature === null ? null : input.temperature.toFixed(2),
        timeoutMs: input.timeoutMs,
        useCase: input.useCase,
      })
      .onConflictDoUpdate({
        target: llmUseCaseConfigs.useCase,
        set: {
          apiFormat: input.apiFormat,
          baseUrl: input.baseUrl,
          enabled: input.enabled ? 1 : 0,
          maxOutputTokens: input.maxOutputTokens,
          model: input.model,
          provider: input.provider,
          temperature: input.temperature === null ? null : input.temperature.toFixed(2),
          timeoutMs: input.timeoutMs,
          updatedAt: new Date(),
        },
      })
      .returning()

    return rows[0]!
  }

  return {
    findConfigByUseCase,
    listConfigs,
    upsertConfig,
  }
}

export type LlmConfigRepository = ReturnType<typeof createLlmConfigRepository>
