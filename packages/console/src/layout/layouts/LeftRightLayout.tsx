import { AppContent } from '../components/app-content/AppContent'
import { AppHeader } from '../components/app-header/AppHeader'
import { AppSidebar } from '../components/app-sidebar/AppSidebar'
import { TabBar } from '../components/tab-bar/TabBar'

/**
 * 左右布局模式
 * 左侧：Logo + 菜单
 * 右侧：头部 + 标签栏 + 内容区
 */
export function LeftRightLayout() {
  return (
    <div className="flex h-screen">
      {/* 左侧边栏 */}
      <AppSidebar />

      {/* 右侧内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 头部 */}
        <AppHeader variant="leftRight" showBreadcrumb />

        {/* 标签栏 */}
        <TabBar />

        {/* 内容区 */}
        <AppContent />
      </div>
    </div>
  )
}
