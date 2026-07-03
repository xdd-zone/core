import { POST_STATUS_VALUES, PREVIEW_TARGET_TYPE_VALUES } from '@xdd-zone/contracts'
import { relations } from 'drizzle-orm'
import { index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { assets } from './assets.schema'
import { user } from './auth.schema'

export const contentPostStatusEnum = pgEnum('content_post_status', POST_STATUS_VALUES)
export const previewTargetTypeEnum = pgEnum('preview_target_type', PREVIEW_TARGET_TYPE_VALUES)

export const contentCategories = pgTable(
  'content_categories',
  {
    /** 分类主键。 */
    id: text('id').primaryKey(),
    /** URL 使用的分类标识，全局唯一。 */
    slug: text('slug').notNull(),
    /** 分类名称。 */
    name: text('name').notNull(),
    /** 分类说明。 */
    description: text('description'),
    /** 创建人 id。 */
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间。 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('content_categories_slug_unique').on(table.slug)],
)

export const contentTags = pgTable(
  'content_tags',
  {
    /** 标签主键。 */
    id: text('id').primaryKey(),
    /** URL 使用的标签标识，全局唯一。 */
    slug: text('slug').notNull(),
    /** 标签名称。 */
    name: text('name').notNull(),
    /** 创建人 id。 */
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间。 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('content_tags_slug_unique').on(table.slug)],
)

export const contentPosts = pgTable(
  'content_posts',
  {
    /** 文章主键。 */
    id: text('id').primaryKey(),
    /** 草稿 URL 标识，Fifa 保存草稿时更新。 */
    draftSlug: text('draft_slug').notNull(),
    /** 已发布 URL 标识，发布时从草稿写入。 */
    publishedSlug: text('published_slug'),
    /** 草稿标题，Fifa 保存草稿时更新。 */
    draftTitle: text('draft_title').notNull(),
    /** 已发布标题，发布时从草稿写入。 */
    publishedTitle: text('published_title'),
    /** 草稿摘要，Fifa 保存草稿时更新。 */
    draftExcerpt: text('draft_excerpt'),
    /** 已发布摘要，发布时从草稿写入。 */
    publishedExcerpt: text('published_excerpt'),
    /** 文章状态，draft、published 或 archived。 */
    status: contentPostStatusEnum('status').notNull().default('draft'),
    /** 草稿所属分类 id，删除分类时置空。 */
    draftCategoryId: text('draft_category_id').references(() => contentCategories.id, { onDelete: 'set null' }),
    /** 已发布所属分类 id，删除分类时置空。 */
    publishedCategoryId: text('published_category_id').references(() => contentCategories.id, { onDelete: 'set null' }),
    /** 草稿封面素材 id。 */
    draftCoverAssetId: text('draft_cover_asset_id').references(() => assets.id, { onDelete: 'set null' }),
    /** 已发布封面素材 id。 */
    publishedCoverAssetId: text('published_cover_asset_id').references(() => assets.id, {
      onDelete: 'set null',
    }),
    /** 当前草稿版本 id。 */
    draftRevisionId: text('draft_revision_id'),
    /** 当前发布版本 id。 */
    publishedRevisionId: text('published_revision_id'),
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
    uniqueIndex('content_posts_draft_slug_unique').on(table.draftSlug),
    uniqueIndex('content_posts_published_slug_unique').on(table.publishedSlug),
    index('content_posts_status_idx').on(table.status),
    index('content_posts_draft_category_idx').on(table.draftCategoryId),
    index('content_posts_published_category_idx').on(table.publishedCategoryId),
  ],
)

export const contentPostDraftTags = pgTable(
  'content_post_draft_tags',
  {
    /** 所属文章 id。 */
    postId: text('post_id')
      .notNull()
      .references(() => contentPosts.id, { onDelete: 'cascade' }),
    /** 关联标签 id。 */
    tagId: text('tag_id')
      .notNull()
      .references(() => contentTags.id, { onDelete: 'cascade' }),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index('content_post_draft_tags_tag_idx').on(table.tagId),
  ],
)

export const contentPostPublishedTags = pgTable(
  'content_post_published_tags',
  {
    /** 所属文章 id。 */
    postId: text('post_id')
      .notNull()
      .references(() => contentPosts.id, { onDelete: 'cascade' }),
    /** 关联标签 id。 */
    tagId: text('tag_id')
      .notNull()
      .references(() => contentTags.id, { onDelete: 'cascade' }),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index('content_post_published_tags_tag_idx').on(table.tagId),
  ],
)

export const contentPostRevisions = pgTable(
  'content_post_revisions',
  {
    /** 版本主键。 */
    id: text('id').primaryKey(),
    /** 所属文章 id。 */
    postId: text('post_id')
      .notNull()
      .references(() => contentPosts.id, { onDelete: 'cascade' }),
    /** 文章内递增版本号。 */
    revisionNo: integer('revision_no').notNull(),
    /** 版本里的标题快照。 */
    title: text('title').notNull(),
    /** 版本里的摘要快照。 */
    excerpt: text('excerpt'),
    /** MDX 源码。 */
    source: text('source').notNull(),
    /** 创建人 id。 */
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('content_post_revisions_post_revision_unique').on(table.postId, table.revisionNo),
    index('content_post_revisions_post_idx').on(table.postId),
  ],
)

export const contentPreviewTokens = pgTable(
  'content_preview_tokens',
  {
    /** 预览 token 主键。 */
    id: text('id').primaryKey(),
    /** token 的 SHA-256 hash，不保存明文 token。 */
    tokenHash: text('token_hash').notNull(),
    /** 预览目标类型，当前文章使用 post。 */
    targetType: previewTargetTypeEnum('target_type').notNull().default('post'),
    /** 预览目标 id。 */
    targetId: text('target_id'),
    /** 过期时间。 */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    /** 使用时间。第一版不限制使用次数，只记录最后一次读取。 */
    usedAt: timestamp('used_at', { withTimezone: true }),
    /** 创建人 id。 */
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('content_preview_tokens_token_hash_unique').on(table.tokenHash),
    index('content_preview_tokens_target_idx').on(table.targetType, table.targetId),
    index('content_preview_tokens_expires_at_idx').on(table.expiresAt),
  ],
)

export const contentCategoriesRelations = relations(contentCategories, ({ many }) => ({
  draftPosts: many(contentPosts, { relationName: 'draftCategory' }),
  publishedPosts: many(contentPosts, { relationName: 'publishedCategory' }),
}))

export const contentTagsRelations = relations(contentTags, ({ many }) => ({
  draftPostTags: many(contentPostDraftTags),
  publishedPostTags: many(contentPostPublishedTags),
}))

export const contentPostsRelations = relations(contentPosts, ({ one, many }) => ({
  draftCategory: one(contentCategories, {
    fields: [contentPosts.draftCategoryId],
    references: [contentCategories.id],
    relationName: 'draftCategory',
  }),
  publishedCategory: one(contentCategories, {
    fields: [contentPosts.publishedCategoryId],
    references: [contentCategories.id],
    relationName: 'publishedCategory',
  }),
  draftCoverAsset: one(assets, {
    fields: [contentPosts.draftCoverAssetId],
    references: [assets.id],
  }),
  publishedCoverAsset: one(assets, {
    fields: [contentPosts.publishedCoverAssetId],
    references: [assets.id],
  }),
  draftPostTags: many(contentPostDraftTags),
  publishedPostTags: many(contentPostPublishedTags),
  revisions: many(contentPostRevisions),
}))

export const contentPostDraftTagsRelations = relations(contentPostDraftTags, ({ one }) => ({
  post: one(contentPosts, {
    fields: [contentPostDraftTags.postId],
    references: [contentPosts.id],
  }),
  tag: one(contentTags, {
    fields: [contentPostDraftTags.tagId],
    references: [contentTags.id],
  }),
}))

export const contentPostPublishedTagsRelations = relations(contentPostPublishedTags, ({ one }) => ({
  post: one(contentPosts, {
    fields: [contentPostPublishedTags.postId],
    references: [contentPosts.id],
  }),
  tag: one(contentTags, {
    fields: [contentPostPublishedTags.tagId],
    references: [contentTags.id],
  }),
}))

export const contentPostRevisionsRelations = relations(contentPostRevisions, ({ one }) => ({
  post: one(contentPosts, {
    fields: [contentPostRevisions.postId],
    references: [contentPosts.id],
  }),
}))
