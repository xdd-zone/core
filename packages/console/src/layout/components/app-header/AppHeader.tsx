import { HeaderActions } from './HeaderActions'
import { HeaderLeft } from './HeaderLeft'

interface AppHeaderProps {
  showBrand?: boolean
  showBreadcrumb?: boolean
  variant: 'leftRight' | 'topBottom'
}

/**
 * 应用头部组件
 * 统一的头部组件，支持不同的布局模式
 */
export function AppHeader({ showBrand = false, showBreadcrumb = false, variant }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-500 p-2 md:p-4">
      <HeaderLeft variant={variant} showBrand={showBrand} showBreadcrumb={showBreadcrumb} />
      <HeaderActions />
    </header>
  )
}
