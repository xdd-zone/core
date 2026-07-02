import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const siteConfigs = pgTable('site_configs', {
  /** 站点标识，当前只使用 bobo。 */
  siteKey: text('site_key').primaryKey(),
  /** 导航配置 JSON。 */
  navigation: jsonb('navigation').notNull(),
  /** 首页模块配置 JSON。 */
  homeSections: jsonb('home_sections').notNull(),
  /** SEO 默认值 JSON。 */
  seo: jsonb('seo').notNull(),
  /** 创建时间。 */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  /** 更新时间。 */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
