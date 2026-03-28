import { ResponsiveTooltip } from '@console/components/ui'
import { clsx } from 'clsx'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  FullscreenButton,
  GuideButton,
  LanguageButton,
  NotificationButton,
  SearchButton,
  SettingButton,
  ThemeToggle,
} from '../../atoms'
import { UserAvatar } from './UserAvatar'

function getDefaultActionsExpanded() {
  if (typeof window === 'undefined') {
    return true
  }

  return window.innerWidth >= 1280
}

/**
 * 头部右侧操作区组件
 * 包含可收起的快捷操作、设置入口和用户头像
 */
export function HeaderActions() {
  const { t } = useTranslation()
  const [isActionsExpanded, setIsActionsExpanded] = useState(getDefaultActionsExpanded)

  const toggleActionsExpanded = () => {
    setIsActionsExpanded((current) => !current)
  }

  return (
    <div className="text-fg-muted flex items-center gap-x-2 md:gap-x-4">
      <div
        className={clsx(
          'flex items-center overflow-hidden transition-[max-width,opacity] duration-300 ease-out',
          isActionsExpanded ? 'max-w-80 opacity-100 xl:max-w-none' : 'pointer-events-none max-w-0 opacity-0',
        )}
      >
        <div className="flex items-center gap-x-2 pr-1 md:gap-x-4">
          {/* 打开搜索框 */}
          <SearchButton />

          {/* 全屏展示 */}
          <FullscreenButton />

          {/* 打开通知中心 */}
          <NotificationButton />

          {/* 打开指南 */}
          <GuideButton />

          {/* 语言切换 */}
          <LanguageButton />

          {/* 暗黑模式切换 */}
          <ThemeToggle />
        </div>
      </div>

      <ResponsiveTooltip title={isActionsExpanded ? t('tooltip.collapseHeaderActions') : t('tooltip.expandHeaderActions')}>
        <button
          type="button"
          aria-label={isActionsExpanded ? t('tooltip.collapseHeaderActions') : t('tooltip.expandHeaderActions')}
          onClick={toggleActionsExpanded}
          className="hover:text-primary flex h-8 w-8 cursor-pointer items-center justify-center rounded transition-colors"
        >
          {isActionsExpanded ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
        </button>
      </ResponsiveTooltip>

      {/* 打开设置抽屉 */}
      <SettingButton />

      {/* 用户头像 */}
      <UserAvatar />
    </div>
  )
}
