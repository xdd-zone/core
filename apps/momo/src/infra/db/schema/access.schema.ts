import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { user } from './auth.schema'

export const applications = pgTable(
  'applications',
  {
    /** 应用主键。 */
    id: text('id').primaryKey(),
    /** 应用代码，用来区分 fifa、bobo 这类入口。 */
    code: text('code').notNull(),
    /** 应用显示名称。 */
    name: text('name').notNull(),
    /** 应用状态，active 表示允许继续登录和授权检查。 */
    status: text('status').notNull().default('active'),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间。 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('applications_code_unique').on(table.code)],
)

export const applicationAuthMethods = pgTable(
  'application_auth_methods',
  {
    /** 登录方式主键。 */
    id: text('id').primaryKey(),
    /** 所属应用 id。 */
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    /** 登录方式代码，比如 password、github、google。 */
    provider: text('provider').notNull(),
    /** 登录方式状态，active 表示该应用允许使用这个登录方式。 */
    status: text('status').notNull().default('active'),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间。 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('application_auth_methods_app_provider_unique').on(table.applicationId, table.provider)],
)

export const roles = pgTable(
  'roles',
  {
    /** 角色主键。 */
    id: text('id').primaryKey(),
    /** 所属应用 id。 */
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    /** 角色代码，比如 owner、visitor。 */
    code: text('code').notNull(),
    /** 角色显示名称。 */
    name: text('name').notNull(),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间。 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('roles_app_code_unique').on(table.applicationId, table.code)],
)

export const userRoleBindings = pgTable(
  'user_role_bindings',
  {
    /** 用户角色绑定主键。 */
    id: text('id').primaryKey(),
    /** better-auth 的用户 id。 */
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** 角色 id。 */
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    /** 绑定状态，active 表示当前用户拥有这个角色。 */
    status: text('status').notNull().default('active'),
    /** 创建时间。 */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** 更新时间。 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('user_role_bindings_user_role_unique').on(table.userId, table.roleId)],
)

export const applicationsRelations = relations(applications, ({ many }) => ({
  authMethods: many(applicationAuthMethods),
  roles: many(roles),
}))
