import { AppContent } from '../components/app-content/AppContent'
import { AppHeader } from '../components/app-header/AppHeader'
import { AppSidebar } from '../components/app-sidebar/AppSidebar'
import { TabBar } from '../components/tab-bar/TabBar'

/**
 * 后台主布局
 * 上部放品牌和操作区，下部放菜单、标签栏和页面内容
 */
export function TopBottomLayout() {
  return (
    <div className="guide-shell flex h-screen flex-col">
      {/* 顶部头部 */}
      <AppHeader showBrand />

      {/* 下部内容区 */}
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
