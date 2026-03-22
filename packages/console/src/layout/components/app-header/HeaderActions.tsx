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

/**
 * 头部右侧操作区组件
 * 包含搜索、全屏、通知、设置按钮和用户头像
 */
export function HeaderActions() {
  return (
    <div className="text-fg-muted flex items-center gap-x-4">
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

      {/* 打开设置抽屉 */}
      <SettingButton />

      {/* 用户头像 */}
      <UserAvatar />
    </div>
  )
}
