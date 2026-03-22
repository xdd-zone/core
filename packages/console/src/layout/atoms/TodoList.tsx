import type { NotificationItem } from './NotificationTabPanel'

import { NotificationTabPanel } from './NotificationTabPanel'

const todoData: NotificationItem[] = []

export function TodoList() {
  return <NotificationTabPanel items={todoData} emptyDescription="暂无待办事项" />
}
