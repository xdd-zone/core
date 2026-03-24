import { Breadcrumb } from '@console/components/common'
import { CollapseButton, MobileMenuButton } from '@console/layout/atoms'

import { Brand, Logo } from '../../atoms'

interface HeaderLeftProps {
  showBrand?: boolean
  showBreadcrumb?: boolean
  variant: 'leftRight' | 'topBottom'
}

/**
 * 头部左侧区域组件
 * 根据不同的布局模式显示不同的内容
 */
export function HeaderLeft({ showBrand = false, showBreadcrumb = false, variant }: HeaderLeftProps) {
  return (
    <div className="flex items-center gap-x-3">
      {/* 移动端菜单按钮 */}
      <div className="md:hidden">
        <MobileMenuButton />
      </div>

      {/* 桌面端内容 */}
      <div className="hidden items-center gap-x-3 md:flex">
        {variant === 'leftRight' && <CollapseButton />}

        {showBrand && (
          <>
            <Logo />
            <Brand />
          </>
        )}

        {showBreadcrumb && <Breadcrumb />}
      </div>
    </div>
  )
}
