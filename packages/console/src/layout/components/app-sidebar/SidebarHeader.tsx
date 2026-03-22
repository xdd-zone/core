import { useSettingStore } from '@/stores'

import { Brand, Logo } from '../../atoms'

/**
 * 侧边栏头部组件
 * 包含 Logo 和标题
 */
export function SidebarHeader() {
  const { isSidebarCollapsed, layoutMode } = useSettingStore()

  // 只在左右布局模式下显示
  if (layoutMode !== 'leftRight') {
    return null
  }

  return (
    <div className="border-b border-gray-500 p-4">
      <div className="flex items-center">
        <Logo />
        {!isSidebarCollapsed && <Brand />}
      </div>
    </div>
  )
}
