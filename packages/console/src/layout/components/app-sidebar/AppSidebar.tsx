import { useSettingStore } from '@/stores'

import { SidebarContent } from './SidebarContent'
import { SidebarFooter } from './SidebarFooter'
import { SidebarHeader } from './SidebarHeader'

/**
 * 应用侧边栏组件
 * 包含头部、内容和底部区域
 */
export function AppSidebar() {
  const { isSidebarCollapsed } = useSettingStore()

  return (
    <aside
      className={`hidden flex-col border-r border-gray-500 transition-all duration-300 md:flex ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <SidebarHeader />
      <SidebarContent />
      <SidebarFooter />
    </aside>
  )
}
