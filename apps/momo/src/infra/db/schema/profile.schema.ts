import { relations } from 'drizzle-orm'
import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { assets } from './assets.schema'
import { user } from './auth.schema'

export const userProfiles = pgTable('user_profiles', {
  /** better-auth 的用户 id。 */
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  /** 用户在站点里显示的名字。 */
  displayName: text('display_name').notNull(),
  /** 用户头像地址。 */
  avatarUrl: text('avatar_url'),
  /** 创建时间。 */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  /** 更新时间。 */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(user, {
    fields: [userProfiles.userId],
    references: [user.id],
  }),
}))

export const publicProfiles = pgTable('public_profiles', {
  /** 公开资料主键，当前固定为 bobo。 */
  id: text('id').primaryKey(),
  /** 公开显示名。 */
  displayName: text('display_name').notNull(),
  /** 公开头像素材 id。 */
  avatarAssetId: text('avatar_asset_id').references(() => assets.id, { onDelete: 'set null' }),
  /** 公开简介。 */
  bio: text('bio'),
  /** 公开联系邮箱。 */
  contactEmail: text('contact_email'),
  /** 公开所在地。 */
  location: text('location'),
  /** 是否展示可接新项目状态。 */
  availableForWork: boolean('available_for_work').notNull().default(false),
  /** 社交链接 JSON。 */
  socialLinks: jsonb('social_links').notNull().default([]),
  /** 创建时间。 */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  /** 更新时间。 */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
