import { POST_STATUS_VALUES } from '@xdd-zone/contracts'
import { relations } from 'drizzle-orm'
import { index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { user } from './auth.schema'

export const contentPostStatusEnum = pgEnum('content_post_status', POST_STATUS_VALUES)

export const contentAssets = pgTable('content_assets', {
  /** 素材主键。 */
  id: text('id').primaryKey(),
  /** 上传后的文件名。 */
  fileName: text('file_name').notNull(),
  /** 存储驱动里的文件路径。 */
  storagePath: text('storage_path').notNull(),
  /** 可公开访问的 URL。COS 存外部地址，本地存读取接口的相对路径。 */
  url: text('url'),
  /** 文件 MIME 类型。 */
  mimeType: text('mime_type').notNull(),
  /** 文件大小，单位字节。 */
  size: integer('size').notNull(),
  /** 图片替代文本。 */
  alt: text('alt'),
  /** 上传人 id。 */
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  /** 创建时间。 */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  /** 更新时间。 */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

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
    /** URL 使用的文章标识。 */
    slug: text('slug').notNull(),
    /** 文章标题。 */
    title: text('title').notNull(),
    /** 文章摘要。 */
    excerpt: text('excerpt'),
    /** 文章状态，draft、published 或 archived。 */
    status: contentPostStatusEnum('status').notNull().default('draft'),
    /** 所属分类 id，删除分类时置空。 */
    categoryId: text('category_id').references(() => contentCategories.id, { onDelete: 'set null' }),
    /** 封面素材 id。 */
    coverAssetId: text('cover_asset_id').references(() => contentAssets.id, { onDelete: 'set null' }),
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
    uniqueIndex('content_posts_slug_unique').on(table.slug),
    index('content_posts_status_idx').on(table.status),
    index('content_posts_category_idx').on(table.categoryId),
  ],
)

export const contentPostTags = pgTable(
  'content_post_tags',
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
  (table) => [primaryKey({ columns: [table.postId, table.tagId] }), index('content_post_tags_tag_idx').on(table.tagId)],
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
    /** 预览文章 id。 */
    postId: text('post_id')
      .notNull()
      .references(() => contentPosts.id, { onDelete: 'cascade' }),
    /** 预览版本 id。 */
    revisionId: text('revision_id')
      .notNull()
      .references(() => contentPostRevisions.id, { onDelete: 'cascade' }),
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
    index('content_preview_tokens_post_idx').on(table.postId),
    index('content_preview_tokens_expires_at_idx').on(table.expiresAt),
  ],
)

export const contentCategoriesRelations = relations(contentCategories, ({ many }) => ({
  posts: many(contentPosts),
}))

export const contentTagsRelations = relations(contentTags, ({ many }) => ({
  postTags: many(contentPostTags),
}))

export const contentPostsRelations = relations(contentPosts, ({ one, many }) => ({
  category: one(contentCategories, {
    fields: [contentPosts.categoryId],
    references: [contentCategories.id],
  }),
  coverAsset: one(contentAssets, {
    fields: [contentPosts.coverAssetId],
    references: [contentAssets.id],
  }),
  postTags: many(contentPostTags),
  revisions: many(contentPostRevisions),
}))

export const contentPostTagsRelations = relations(contentPostTags, ({ one }) => ({
  post: one(contentPosts, {
    fields: [contentPostTags.postId],
    references: [contentPosts.id],
  }),
  tag: one(contentTags, {
    fields: [contentPostTags.tagId],
    references: [contentTags.id],
  }),
}))

export const contentPostRevisionsRelations = relations(contentPostRevisions, ({ one }) => ({
  post: one(contentPosts, {
    fields: [contentPostRevisions.postId],
    references: [contentPosts.id],
  }),
}))
