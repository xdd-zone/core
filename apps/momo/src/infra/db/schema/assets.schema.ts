import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { user } from './auth.schema'

export const assets = pgTable('assets', {
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
