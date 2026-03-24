import { ResponsiveTooltip } from '@console/components/ui'
import { catppuccinThemes } from '@console/config/catppuccin'
import { useSettingStore } from '@console/stores/modules/setting'

import { Drawer, Space, Typography } from 'antd'
import { Layout, Lightbulb, Monitor, Moon, Palette, PanelLeft, PanelTop, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const { Text, Title } = Typography

interface SettingDrawerProps {
  onClose: () => void
  open: boolean
}

/**
 * 设置抽屉组件
 * 包含布局切换等系统设置功能
 */
export function SettingDrawer({ onClose, open }: SettingDrawerProps) {
  const { t } = useTranslation()
  const { catppuccinTheme, layoutMode, setCatppuccinTheme, setLayoutMode, setThemeMode, themeMode } = useSettingStore()

  const handleLayoutChange = (mode: 'leftRight' | 'topBottom') => {
    setLayoutMode(mode)
  }

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode)
  }

  const handleThemeSelect = (themeId: typeof catppuccinTheme) => {
    setCatppuccinTheme(themeId)
  }

  return (
    <Drawer
      title={t('setting.systemSettings')}
      placement="right"
      onClose={onClose}
      open={open}
      size="default"
      classNames={{
        body: 'bg-surface',
        footer: 'bg-surface-muted border-border',
        header: 'bg-surface-muted border-border text-fg',
        wrapper: 'text-fg',
      }}
      styles={{
        body: {
          color: 'var(--color-fg)',
        },
        header: {
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-fg)',
        },
        mask: {
          backgroundColor: 'color-mix(in oklab, var(--color-surface-subtle) 52%, transparent)',
        },
      }}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        {/* 主题模式设置 */}
        <div>
          <Title level={5}>
            <div className="text-fg">
              <Lightbulb className="mr-2" />
              {t('setting.themeMode')}
            </div>
          </Title>
          <Text className="text-fg-muted" type="secondary">
            {t('setting.themeModeDescription')}
          </Text>
          <div style={{ marginTop: 12 }}>
            <Space orientation="horizontal" style={{ width: '100%' }}>
              <ResponsiveTooltip title={t('theme.lightMode')}>
                <div
                  className={`hover:text-primary cursor-pointer text-center text-2xl transition-colors ${themeMode === 'light' ? 'text-primary' : 'text-fg-muted'}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <Sun />
                </div>
              </ResponsiveTooltip>
              <ResponsiveTooltip title={t('theme.darkMode')}>
                <div
                  className={`hover:text-primary cursor-pointer text-center text-2xl transition-colors ${themeMode === 'dark' ? 'text-primary' : 'text-fg-muted'}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <Moon />
                </div>
              </ResponsiveTooltip>
              <ResponsiveTooltip title={t('theme.followSystem')}>
                <div
                  className={`hover:text-primary cursor-pointer text-center text-2xl transition-colors ${themeMode === 'system' ? 'text-primary' : 'text-fg-muted'}`}
                  onClick={() => handleThemeChange('system')}
                >
                  <Monitor />
                </div>
              </ResponsiveTooltip>
            </Space>
          </div>
        </div>

        {/* Catppuccin 主题设置 */}
        <div>
          <Title level={5}>
            <div className="text-fg">
              <Palette className="mr-2" />
              {t('setting.catppuccinTheme')}
            </div>
          </Title>
          <Text className="text-fg-muted" type="secondary">
            {t('setting.catppuccinThemeDescription')}
          </Text>
          <div style={{ marginTop: 12 }}>
            <div className="grid grid-cols-2 gap-3">
              {catppuccinThemes.map((theme) => {
                const isSelected = catppuccinTheme === theme.id
                return (
                  <div
                    key={theme.id}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 ${
                      isSelected ? 'border-primary' : 'border-border-subtle hover:border-border'
                    }`}
                    onClick={() => handleThemeSelect(theme.id)}
                  >
                    <div className="text-fg mb-2 text-sm font-medium">{t(`catppuccin.${theme.id}`)}</div>
                    <div className="flex flex-wrap gap-0.5">
                      {theme.colors.map((color) => (
                        <div
                          key={color.name}
                          className="h-4 w-4 rounded-sm shadow-sm"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 布局设置 */}
        <div>
          <Title level={5}>
            <div className="text-fg">
              <Layout className="mr-2" />
              {t('setting.layoutMode')}
            </div>
          </Title>
          <Text className="text-fg-muted" type="secondary">
            {t('setting.layoutModeDescription')}
          </Text>
          <div style={{ marginTop: 12 }}>
            <Space orientation="horizontal" style={{ width: '100%' }}>
              {/* 左右布局图标 */}
              <ResponsiveTooltip title={t('setting.leftRightLayout')}>
                <div
                  className={`hover:text-primary cursor-pointer text-center text-2xl transition-colors ${layoutMode === 'leftRight' ? 'text-primary' : 'text-fg-muted'}`}
                  onClick={() => handleLayoutChange('leftRight')}
                >
                  <PanelLeft />
                </div>
              </ResponsiveTooltip>
              {/* 上下布局图标 */}
              <ResponsiveTooltip title={t('setting.topBottomLayout')}>
                <div
                  className={`hover:text-primary cursor-pointer text-center text-2xl transition-colors ${layoutMode === 'topBottom' ? 'text-primary' : 'text-fg-muted'}`}
                  onClick={() => handleLayoutChange('topBottom')}
                >
                  <PanelTop />
                </div>
              </ResponsiveTooltip>
            </Space>
          </div>
        </div>
      </Space>
    </Drawer>
  )
}
