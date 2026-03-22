import { CollapseButton } from '@/layout/atoms'
import { useSettingStore } from '@/stores'

/**
 * 侧边栏底部组件
 * 在上下布局模式下显示折叠按钮
 */
export function SidebarFooter() {
  const { layoutMode } = useSettingStore()

  // 只在上下布局模式下显示折叠按钮
  if (layoutMode !== 'topBottom') {
    return null
  }

  return (
    <div className="mb-2 flex w-full justify-center">
      <CollapseButton />
    </div>
  )
}
