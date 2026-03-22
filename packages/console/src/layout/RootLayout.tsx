import { Pattern } from '@/components/ui'
import { useRouteListener } from '@/hooks/useRouteListener'
import { useSettingStore } from '@/stores/modules/setting'

import { MobileDrawer } from './components/mobile-drawer/MobileDrawer'
import { SettingDrawer } from './components/SettingDrawer'
import { LeftRightLayout } from './layouts/LeftRightLayout'
import { TopBottomLayout } from './layouts/TopBottomLayout'

/**
 * 根布局组件
 *
 * 提供应用的基本布局结构，包括背景模式和内容渲染区域
 */
export function RootLayout() {
  const { isSettingDrawerOpen, layoutMode, setSettingDrawerOpen } = useSettingStore()

  // 启用路由监听，自动记录访问的页面到TabBar
  useRouteListener()

  const handleCloseSettingDrawer = () => {
    setSettingDrawerOpen(false)
  }

  return (
    <div className="relative h-full w-full">
      {/* 背景 Pattern */}
      <div className="fixed inset-0 z-0">
        <Pattern />
      </div>

      <div className="relative h-full w-full">
        {layoutMode === 'leftRight' ? <LeftRightLayout /> : <TopBottomLayout />}
      </div>

      {/* 设置抽屉 */}
      <SettingDrawer open={isSettingDrawerOpen} onClose={handleCloseSettingDrawer} />
      {/* 移动端菜单抽屉 */}
      <MobileDrawer />
    </div>
  )
}
