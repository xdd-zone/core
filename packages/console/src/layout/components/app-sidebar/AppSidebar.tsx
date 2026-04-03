import { useSettingStore } from '@console/stores'

import { SidebarContent } from './SidebarContent'
import { SidebarFooter } from './SidebarFooter'

/**
 * 应用侧边栏组件
 * 包含导航内容和侧边栏操作区
 */
export function AppSidebar() {
  const { isSidebarCollapsed } = useSettingStore()

  return (
    <aside
      className={`guide-sidebar hidden flex-col transition-all duration-300 md:flex ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <SidebarContent />
      <SidebarFooter />
    </aside>
  )
}
