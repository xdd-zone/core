import { ResponsiveTooltip } from '@console/components/ui'
import { driver } from 'driver.js'
import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import 'driver.js/dist/driver.css'

interface GuideButtonProps {
  className?: string
}

/**
 * 指南按钮原子组件
 */
export function GuideButton({ className }: GuideButtonProps) {
  const { t } = useTranslation()

  const handleStartGuide = () => {
    const driverObj = driver({
      nextBtnText: t('guide.nextBtn'),
      prevBtnText: t('guide.prevBtn'),
      showProgress: true,
      steps: [
        {
          element: '.guide-search',
          popover: {
            align: 'start',
            description: t('layout.searchDescription'),
            side: 'bottom',
            title: t('layout.search'),
          },
        },
        {
          element: '.guide-fullscreen',
          popover: {
            align: 'start',
            description: t('layout.fullscreenDescription'),
            side: 'bottom',
            title: t('layout.fullscreen'),
          },
        },
        {
          element: '.guide-notification',
          popover: {
            align: 'start',
            description: t('layout.notificationDescription'),
            side: 'bottom',
            title: t('layout.notification'),
          },
        },
        {
          element: '.guide-language',
          popover: {
            align: 'start',
            description: t('layout.languageDescription'),
            side: 'bottom',
            title: t('layout.language'),
          },
        },
        {
          element: '.guide-dark-mode',
          popover: {
            align: 'start',
            description: t('layout.darkModeDescription'),
            side: 'bottom',
            title: t('layout.darkMode'),
          },
        },
        {
          element: '.guide-setting',
          popover: {
            align: 'start',
            description: t('layout.settingDescription'),
            side: 'bottom',
            title: t('layout.setting'),
          },
        },
        {
          element: '.guide-avatar',
          popover: {
            align: 'start',
            description: t('layout.avatarDescription'),
            side: 'bottom',
            title: t('layout.avatar'),
          },
        },
        {
          element: '.guide-menu',
          popover: {
            align: 'start',
            description: t('layout.menuDescription'),
            side: 'bottom',
            title: t('layout.menu'),
          },
        },
        {
          element: '.guide-tab-bar',
          popover: {
            align: 'start',
            description: t('layout.tabBarDescription'),
            side: 'bottom',
            title: t('layout.tabBar'),
          },
        },
      ],
    })
    driverObj.drive()
  }

  return (
    <ResponsiveTooltip title={t('tooltip.guide')}>
      <div
        onClick={handleStartGuide}
        className={`hover:text-primary cursor-pointer transition-colors ${className || ''}`}
      >
        <Compass size={20} />
      </div>
    </ResponsiveTooltip>
  )
}
