import type { DbClient } from '#momo/infra/db/client'
import type { EventOutboxRecord } from './types'
import { and, asc, eq, inArray, lte, sql } from 'drizzle-orm'
import { eventOutbox } from '#momo/infra/db/schema/index'

export function createEventsRepository(db: DbClient) {
  async function listPending(limit = 20): Promise<EventOutboxRecord[]> {
    return db
      .select()
      .from(eventOutbox)
      .where(and(inArray(eventOutbox.status, ['pending', 'failed']), lte(eventOutbox.nextRunAt, new Date())))
      .orderBy(asc(eventOutbox.nextRunAt))
      .limit(limit)
  }

  async function markDone(id: string): Promise<void> {
    await db
      .update(eventOutbox)
      .set({
        errorMessage: null,
        lastRunAt: new Date(),
        status: 'done',
        updatedAt: new Date(),
      })
      .where(eq(eventOutbox.id, id))
  }

  async function markFailed(id: string, errorMessage: string): Promise<void> {
    const now = new Date()
    await db
      .update(eventOutbox)
      .set({
        attempts: sql`${eventOutbox.attempts} + 1`,
        errorMessage,
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + 60_000),
        status: 'failed',
        updatedAt: now,
      })
      .where(eq(eventOutbox.id, id))
  }

  async function markPending(id: string): Promise<void> {
    await db
      .update(eventOutbox)
      .set({
        errorMessage: null,
        nextRunAt: new Date(),
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(eventOutbox.id, id))
  }

  return {
    listPending,
    markDone,
    markFailed,
    markPending,
  }
}

export type EventsRepository = ReturnType<typeof createEventsRepository>
