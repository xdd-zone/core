import type { LlmUseCase } from '@xdd-zone/contracts'
import type { DbClient } from '#momo/infra/db/client'
import type {
  CreateLlmCallLogInput,
  CreateLlmProviderInput,
  ListLlmCallLogsInput,
  LlmProviderRecord,
  LlmUseCaseConfigRecord,
  LlmUseCaseConfigWithProvider,
  UpdateLlmProviderInput,
  UpsertLlmUseCaseConfigInput,
} from '../types/config.types'
import { randomUUID } from 'node:crypto'
import { and, count, desc, eq, gte, lt, lte } from 'drizzle-orm'
import { llmCallLogs, llmProviders, llmUseCaseConfigs } from '#momo/infra/db/schema/index'

export function createLlmConfigRepository(db: DbClient) {
  async function listProviders(): Promise<LlmProviderRecord[]> {
    return db.select().from(llmProviders).orderBy(llmProviders.createdAt)
  }

  async function findProviderById(providerId: string): Promise<LlmProviderRecord | null> {
    const rows = await db.select().from(llmProviders).where(eq(llmProviders.id, providerId)).limit(1)

    return rows[0] ?? null
  }

  async function createProvider(input: CreateLlmProviderInput): Promise<LlmProviderRecord> {
    const rows = await db
      .insert(llmProviders)
      .values({
        apiFormat: input.apiFormat,
        apiKeyCiphertext: input.apiKeyCiphertext,
        apiKeyHint: input.apiKeyHint,
        baseUrl: input.baseUrl,
        defaultModel: input.defaultModel,
        enabled: input.enabled ? 1 : 0,
        id: randomUUID(),
        name: input.name,
        providerType: input.providerType,
        timeoutMs: input.timeoutMs,
      })
      .returning()

    return rows[0]!
  }

  async function updateProvider(providerId: string, input: UpdateLlmProviderInput): Promise<LlmProviderRecord | null> {
    const values: Partial<typeof llmProviders.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.apiFormat !== undefined) values.apiFormat = input.apiFormat
    if (input.apiKeyCiphertext !== undefined) values.apiKeyCiphertext = input.apiKeyCiphertext
    if (input.apiKeyHint !== undefined) values.apiKeyHint = input.apiKeyHint
    if (input.baseUrl !== undefined) values.baseUrl = input.baseUrl
    if (input.defaultModel !== undefined) values.defaultModel = input.defaultModel
    if (input.enabled !== undefined) values.enabled = input.enabled ? 1 : 0
    if (input.name !== undefined) values.name = input.name
    if (input.timeoutMs !== undefined) values.timeoutMs = input.timeoutMs

    const rows = await db.update(llmProviders).set(values).where(eq(llmProviders.id, providerId)).returning()

    return rows[0] ?? null
  }

  async function clearProviderApiKey(providerId: string): Promise<LlmProviderRecord | null> {
    const rows = await db
      .update(llmProviders)
      .set({ apiKeyCiphertext: null, apiKeyHint: null, updatedAt: new Date() })
      .where(eq(llmProviders.id, providerId))
      .returning()

    return rows[0] ?? null
  }

  async function listConfigs(): Promise<LlmUseCaseConfigWithProvider[]> {
    const rows = await db
      .select({ config: llmUseCaseConfigs, provider: llmProviders })
      .from(llmUseCaseConfigs)
      .leftJoin(llmProviders, eq(llmUseCaseConfigs.providerId, llmProviders.id))
      .orderBy(llmUseCaseConfigs.useCase)

    return rows
  }

  async function findConfigByUseCase(useCase: LlmUseCase): Promise<LlmUseCaseConfigWithProvider | null> {
    const rows = await db
      .select({ config: llmUseCaseConfigs, provider: llmProviders })
      .from(llmUseCaseConfigs)
      .leftJoin(llmProviders, eq(llmUseCaseConfigs.providerId, llmProviders.id))
      .where(eq(llmUseCaseConfigs.useCase, useCase))
      .limit(1)

    return rows[0] ?? null
  }

  async function upsertConfig(input: UpsertLlmUseCaseConfigInput): Promise<LlmUseCaseConfigRecord> {
    const rows = await db
      .insert(llmUseCaseConfigs)
      .values({
        enabled: input.enabled ? 1 : 0,
        id: randomUUID(),
        maxOutputTokens: input.maxOutputTokens,
        model: input.model,
        providerId: input.providerId,
        temperature: input.temperature === null ? null : input.temperature.toFixed(2),
        useCase: input.useCase,
      })
      .onConflictDoUpdate({
        target: llmUseCaseConfigs.useCase,
        set: {
          enabled: input.enabled ? 1 : 0,
          maxOutputTokens: input.maxOutputTokens,
          model: input.model,
          providerId: input.providerId,
          temperature: input.temperature === null ? null : input.temperature.toFixed(2),
          updatedAt: new Date(),
        },
      })
      .returning()

    return rows[0]!
  }

  async function createCallLog(input: CreateLlmCallLogInput) {
    const rows = await db
      .insert(llmCallLogs)
      .values({
        actorId: input.actorId,
        durationMs: input.durationMs,
        endedAt: input.endedAt,
        errorCode: input.errorCode,
        errorDetails: input.errorDetails,
        errorMessage: input.errorMessage,
        errorStatus: input.errorStatus,
        errorType: input.errorType,
        expiresAt: input.expiresAt,
        id: randomUUID(),
        inputTokens: input.inputTokens,
        model: input.model,
        operation: input.operation,
        outputTokens: input.outputTokens,
        providerApiFormat: input.providerApiFormat,
        providerBaseUrl: input.providerBaseUrl,
        providerId: input.providerId,
        providerName: input.providerName,
        providerType: input.providerType,
        requestId: input.requestId,
        sourceId: input.sourceId,
        sourceType: input.sourceType,
        startedAt: input.startedAt,
        status: input.status,
        totalTokens: input.totalTokens,
        useCase: input.useCase,
      })
      .returning()

    return rows[0]!
  }

  async function listCallLogs(input: ListLlmCallLogsInput) {
    const filters = buildCallLogFilters(input)
    const offset = (input.page - 1) * input.pageSize
    const where = filters.length > 0 ? and(...filters) : undefined
    const [{ total }] = await db.select({ total: count() }).from(llmCallLogs).where(where)
    const logs = await db
      .select({ log: llmCallLogs, provider: llmProviders })
      .from(llmCallLogs)
      .leftJoin(llmProviders, eq(llmCallLogs.providerId, llmProviders.id))
      .where(where)
      .orderBy(desc(llmCallLogs.startedAt))
      .limit(input.pageSize)
      .offset(offset)

    return { logs, total }
  }

  async function findCallLogById(logId: string) {
    const rows = await db
      .select({ log: llmCallLogs, provider: llmProviders })
      .from(llmCallLogs)
      .leftJoin(llmProviders, eq(llmCallLogs.providerId, llmProviders.id))
      .where(eq(llmCallLogs.id, logId))
      .limit(1)

    return rows[0] ?? null
  }

  async function deleteExpiredCallLogs(now = new Date()): Promise<number> {
    const rows = await db.delete(llmCallLogs).where(lt(llmCallLogs.expiresAt, now)).returning({ id: llmCallLogs.id })

    return rows.length
  }

  return {
    clearProviderApiKey,
    createCallLog,
    createProvider,
    deleteExpiredCallLogs,
    findCallLogById,
    findConfigByUseCase,
    findProviderById,
    listCallLogs,
    listConfigs,
    listProviders,
    updateProvider,
    upsertConfig,
  }
}

function buildCallLogFilters(input: ListLlmCallLogsInput) {
  const filters = []

  if (input.status) filters.push(eq(llmCallLogs.status, input.status))
  if (input.useCase) filters.push(eq(llmCallLogs.useCase, input.useCase))
  if (input.providerId) filters.push(eq(llmCallLogs.providerId, input.providerId))
  if (input.model) filters.push(eq(llmCallLogs.model, input.model))
  if (input.requestId) filters.push(eq(llmCallLogs.requestId, input.requestId))
  if (input.startedAtFrom) filters.push(gte(llmCallLogs.startedAt, new Date(input.startedAtFrom)))
  if (input.startedAtTo) filters.push(lte(llmCallLogs.startedAt, new Date(input.startedAtTo)))

  return filters
}

export type LlmConfigRepository = ReturnType<typeof createLlmConfigRepository>
