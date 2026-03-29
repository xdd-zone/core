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
    <header className="guide-header flex items-center justify-between border-b">
      <HeaderLeft variant={variant} showBrand={showBrand} showBreadcrumb={showBreadcrumb} />
      <HeaderActions />
    </header>
  )
}
