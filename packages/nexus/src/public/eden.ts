import type { createApp } from '../app'

/**
 * 提供给前端和联调层消费的 Eden 应用类型。
 */
export type EdenApp = ReturnType<typeof createApp>
