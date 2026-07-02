import { POST_STATUS_VALUES } from '@xdd-zone/contracts'
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { user } from './auth.schema'
import { contentAssets } from './content.schema'

export const projectStatusEnum = pgEnum('project_status', POST_STATUS_VALUES)

export const projects = pgTable(
  'projects',
  {
    /** 项目主键。 */
    id: text('id').primaryKey(),
    /** 草稿 slug。 */
    draftSlug: text('draft_slug').notNull(),
    /** 已发布 slug。 */
    publishedSlug: text('published_slug'),
    /** 草稿标题。 */
    draftTitle: text('draft_title').notNull(),
    /** 已发布标题。 */
    publishedTitle: text('published_title'),
    /** 草稿描述。 */
    draftDescription: text('draft_description'),
    /** 已发布描述。 */
    publishedDescription: text('published_description'),
    /** 草稿封面素材 id。 */
    draftCoverAssetId: text('draft_cover_asset_id').references(() => contentAssets.id, { onDelete: 'set null' }),
    /** 已发布封面素材 id。 */
    publishedCoverAssetId: text('published_cover_asset_id').references(() => contentAssets.id, {
      onDelete: 'set null',
    }),
    /** 草稿链接 JSON。 */
    draftLinks: jsonb('draft_links').notNull().default([]),
    /** 已发布链接 JSON。 */
    publishedLinks: jsonb('published_links').notNull().default([]),
    /** 展示排序。 */
    order: integer('order').notNull().default(0),
    /** 项目状态。 */
    status: projectStatusEnum('status').notNull().default('draft'),
    /** 创建人 id。 */
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    /** 最后更新人 id。 */
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    /** 发布人 id。 */
    publishedBy: text('published_by').references(() => user.id, { onDelete: 'set null' }),
    /** 发布时间。 */
    publishedAt: timestamp('published_at', { withTimezone: true }),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间。 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('projects_draft_slug_unique').on(table.draftSlug),
    uniqueIndex('projects_published_slug_unique').on(table.publishedSlug),
    index('projects_status_idx').on(table.status),
    index('projects_order_idx').on(table.order),
  ],
)
