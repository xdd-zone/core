import { AppContent } from '../components/app-content/AppContent'
import { AppHeader } from '../components/app-header/AppHeader'
import { AppSidebar } from '../components/app-sidebar/AppSidebar'
import { TabBar } from '../components/tab-bar/TabBar'

/**
 * 上下布局模式
 * 上部：Logo + 标题 + 搜索 + 操作按钮
 * 下部：左侧菜单 + 右侧（标签栏 + 内容区）
 */
export function TopBottomLayout() {
  return (
    <div className="flex h-screen flex-col">
      {/* 顶部头部 */}
      <AppHeader variant="topBottom" showBrand />

      {/* 下部左右布局 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧菜单 */}
        <AppSidebar />

        {/* 右侧内容区 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 标签栏 */}
          <TabBar />

          {/* 内容区 */}
          <AppContent />
        </div>
      </div>
    </div>
  )
}
