import { buildNavigationMenuItems } from '@console/app/navigation/navigation'

import { useSettingStore } from '@console/stores'
import { useTranslation } from 'react-i18next'

import { NavigationMenu } from '../menu/NavigationMenu'

/**
 * 侧边栏内容组件
 * 包含导航菜单
 */
export function SidebarContent() {
  const { t } = useTranslation()
  const { isSidebarCollapsed } = useSettingStore()

  const menuItems = buildNavigationMenuItems(t)

  return (
    <nav className="flex-1 overflow-auto">
      <NavigationMenu inlineCollapsed={isSidebarCollapsed} items={menuItems} />
    </nav>
  )
}
