import { index, integer, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const eventOutboxStatusEnum = pgEnum('event_outbox_status', ['pending', 'processing', 'done', 'failed'])

export const eventOutbox = pgTable(
  'event_outbox',
  {
    /** 任务主键。 */
    id: text('id').primaryKey(),
    /** 事件类型，比如 content.post.published。 */
    eventType: text('event_type').notNull(),
    /** 事件载荷。 */
    payload: jsonb('payload').notNull(),
    /** 当前处理状态。 */
    status: eventOutboxStatusEnum('status').notNull().default('pending'),
    /** 失败原因。 */
    errorMessage: text('error_message'),
    /** 已尝试处理的次数。 */
    attempts: integer('attempts').notNull().default(0),
    /** 下次处理时间。 */
    nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull().defaultNow(),
    /** 最后一次处理时间。 */
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间。 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('event_outbox_status_next_run_idx').on(table.status, table.nextRunAt),
    index('event_outbox_event_type_idx').on(table.eventType),
  ],
)
