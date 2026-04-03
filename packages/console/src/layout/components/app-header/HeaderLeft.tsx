import { Breadcrumb } from '@console/components/common'
import { MobileMenuButton } from '@console/layout/atoms'

import { Brand, Logo } from '../../atoms'

interface HeaderLeftProps {
  showBrand?: boolean
  showBreadcrumb?: boolean
}

/**
 * 头部左侧区域组件
 * 负责显示品牌和面包屑入口
 */
export function HeaderLeft({ showBrand = false, showBreadcrumb = false }: HeaderLeftProps) {
  return (
    <div className="flex items-center gap-x-3">
      {/* 移动端菜单按钮 */}
      <div className="md:hidden">
        <MobileMenuButton />
      </div>

      {/* 桌面端内容 */}
      <div className="hidden items-center gap-x-3 md:flex">
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
