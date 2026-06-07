import { CollapseButton } from '@console/layout/atoms'

/**
 * 侧边栏底部组件
 * 用于控制侧边栏折叠状态
 */
export function SidebarFooter() {
  return (
    <div className="mb-2 flex w-full justify-center">
      <CollapseButton />
    </div>
  )
}
