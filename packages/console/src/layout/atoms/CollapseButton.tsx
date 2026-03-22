import { PanelLeftClose } from 'lucide-react'

import { useSettingStore } from '@/stores'

/**
 * 折叠按钮组件
 * 用于控制侧边栏的折叠和展开
 */
export function CollapseButton() {
  const { isSidebarCollapsed, toggleSidebarCollapsed } = useSettingStore()

  return (
    <button
      onClick={toggleSidebarCollapsed}
      className={`hover:text-primary text-fg flex h-8 w-8 cursor-pointer items-center justify-center rounded transition-colors ${
        isSidebarCollapsed ? '' : 'rotate-180'
      }`}
    >
      <PanelLeftClose size={20} />
    </button>
  )
}
