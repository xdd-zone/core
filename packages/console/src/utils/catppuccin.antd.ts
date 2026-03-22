import type { ThemeConfig } from 'antd'

import theme from 'antd/es/theme'

/**
 * Catppuccin 主题配置 for Ant Design
 * 参考 Catppuccin 官方色彩规范: https://github.com/catppuccin/catppuccin
 * Ant Design 主题定制: https://ant.design/docs/react/customize-theme-cn
 */

// ============ Latte (亮色主题) ============
const LATTE_TOKENS = {
  colorBgBase: '#eff1f5',
  // 背景色
  colorBgContainer: '#eff1f5',

  colorBgElevated: '#e6e9ef',
  colorBgLayout: '#eff1f5',
  // 边框颜色
  colorBorder: '#dce0e8',
  colorBorderSecondary: '#e6e9ef',
  // 错误 - Red
  colorError: '#d20f39',
  colorErrorBg: '#eff1f5',
  // 信息 - Teal
  colorInfo: '#179299',
  colorInfoBg: '#eff1f5',
  // 主色 - Blue
  colorPrimary: '#1e66f5',

  colorPrimaryActive: '#1e66f5',
  colorPrimaryBg: '#eff1f5',

  colorPrimaryBgHover: '#e6e9ef',
  colorPrimaryBorder: '#dce0e8',

  colorPrimaryBorderHover: '#1e66f5',
  colorPrimaryHover: '#1e66f5',

  colorPrimaryText: '#1e66f5',
  colorPrimaryTextHover: '#1e66f5',

  // 成功 - Green
  colorSuccess: '#40a02b',
  colorSuccessBg: '#eff1f5',
  // 文字颜色层级 (Catppuccin 规范)
  colorText: '#4c4f69', // Text

  // Seed Token - 基础色基准
  colorTextBase: '#4c4f69',
  colorTextQuaternary: '#9399b2', // 最浅文字

  colorTextSecondary: '#8c8fa1', // Text Muted
  colorTextTertiary: '#6c6f85', // Text Subtle
  // 警告 - Yellow
  colorWarning: '#df8e1d',
  colorWarningBg: '#eff1f5',
}

const LATTE_COMPONENTS = {
  Button: {
    colorPrimary: '#1e66f5',
  },
  Card: {
    colorBgContainer: '#eff1f5',
    colorBorder: '#dce0e8',
  },
  Dropdown: {
    colorBgContainer: '#e6e9ef',
  },
  Input: {
    colorBgContainer: '#eff1f5',
    colorBorder: '#dce0e8',
    colorBorderHover: '#1e66f5',
    colorPrimaryHover: '#1e66f5',
  },
  Layout: {
    colorBgBody: '#eff1f5',
    colorBgHeader: '#e6e9ef',
  },
  Menu: {
    itemSelectedBg: '#e6e9ef',
    subMenuItemBg: '#eff1f5',
  },
  Modal: {
    colorBgContainer: '#eff1f5',
    colorBorder: '#dce0e8',
  },
  Select: {
    colorBgContainer: '#eff1f5',
    colorBorder: '#dce0e8',
    colorPrimaryHover: '#1e66f5',
  },
  Table: {
    colorBorder: '#dce0e8',
    colorBorderSecondary: '#e6e9ef',
    headerBg: '#e6e9ef',
    rowHoverBg: '#e6e9ef',
  },
  Tabs: {
    colorPrimary: '#1e66f5',
    inkBarColor: '#1e66f5',
  },
}

// ============ Frappe (暗色主题) ============
const FRAPPE_TOKENS = {
  colorBgBase: '#303446',
  colorBgContainer: '#303446',

  colorBgElevated: '#292c3c',
  colorBgLayout: '#303446',
  colorBorder: '#232634',
  colorBorderSecondary: '#414559',
  colorError: '#e78284',
  colorErrorBg: '#303446',
  colorInfo: '#81c8be',
  colorInfoBg: '#303446',
  colorPrimary: '#8caaee',

  colorPrimaryActive: '#85c1dc',
  colorPrimaryBg: '#303446',

  colorPrimaryBgHover: '#292c3c',
  colorPrimaryBorder: '#232634',

  colorPrimaryBorderHover: '#8caaee',
  colorPrimaryHover: '#8caaee',

  colorPrimaryText: '#8caaee',
  colorPrimaryTextHover: '#8caaee',

  colorSuccess: '#a6d189',
  colorSuccessBg: '#303446',
  colorText: '#c6d0f5', // Text

  colorTextBase: '#c6d0f5',
  colorTextQuaternary: '#6c7a9b', // 最浅文字

  colorTextSecondary: '#a5adce', // Text Muted
  colorTextTertiary: '#8389a7', // Text Subtle
  colorWarning: '#e5c890',
  colorWarningBg: '#303446',
}

const FRAPPE_COMPONENTS = {
  Button: {
    colorPrimary: '#8caaee',
  },
  Card: {
    colorBgContainer: '#303446',
    colorBorder: '#232634',
  },
  Dropdown: {
    colorBgContainer: '#292c3c',
  },
  Input: {
    colorBgContainer: '#303446',
    colorBorder: '#232634',
    colorBorderHover: '#8caaee',
    colorPrimaryHover: '#8caaee',
  },
  Layout: {
    colorBgBody: '#303446',
    colorBgHeader: '#292c3c',
  },
  Menu: {
    itemSelectedBg: '#292c3c',
    subMenuItemBg: '#303446',
  },
  Modal: {
    colorBgContainer: '#303446',
    colorBorder: '#232634',
  },
  Select: {
    colorBgContainer: '#303446',
    colorBorder: '#232634',
    colorPrimaryHover: '#8caaee',
  },
  Table: {
    colorBorder: '#232634',
    colorBorderSecondary: '#414559',
    headerBg: '#292c3c',
    rowHoverBg: '#292c3c',
  },
  Tabs: {
    colorPrimary: '#8caaee',
    inkBarColor: '#8caaee',
  },
}

// ============ Macchiato (暗色主题) ============
const MACCHIATO_TOKENS = {
  colorBgBase: '#24273a',
  colorBgContainer: '#24273a',

  colorBgElevated: '#1e2030',
  colorBgLayout: '#24273a',
  colorBorder: '#181926',
  colorBorderSecondary: '#363a4f',
  colorError: '#ed8796',
  colorErrorBg: '#24273a',
  colorInfo: '#8bd5ca',
  colorInfoBg: '#24273a',
  colorPrimary: '#8aadf4',

  colorPrimaryActive: '#7dc4e4',
  colorPrimaryBg: '#24273a',

  colorPrimaryBgHover: '#1e2030',
  colorPrimaryBorder: '#181926',

  colorPrimaryBorderHover: '#8aadf4',
  colorPrimaryHover: '#8aadf4',

  colorPrimaryText: '#8aadf4',
  colorPrimaryTextHover: '#8aadf4',

  colorSuccess: '#a6da95',
  colorSuccessBg: '#24273a',
  colorText: '#cad3f5', // Text

  colorTextBase: '#cad3f5',
  colorTextQuaternary: '#7b8aab', // 最浅文字

  colorTextSecondary: '#a5adcb', // Text Muted
  colorTextTertiary: '#8a91b4', // Text Subtle
  colorWarning: '#eed49f',
  colorWarningBg: '#24273a',
}

const MACCHIATO_COMPONENTS = {
  Button: {
    colorPrimary: '#8aadf4',
  },
  Card: {
    colorBgContainer: '#24273a',
    colorBorder: '#181926',
  },
  Dropdown: {
    colorBgContainer: '#1e2030',
  },
  Input: {
    colorBgContainer: '#24273a',
    colorBorder: '#181926',
    colorBorderHover: '#8aadf4',
    colorPrimaryHover: '#8aadf4',
  },
  Layout: {
    colorBgBody: '#24273a',
    colorBgHeader: '#1e2030',
  },
  Menu: {
    itemSelectedBg: '#1e2030',
    subMenuItemBg: '#24273a',
  },
  Modal: {
    colorBgContainer: '#24273a',
    colorBorder: '#181926',
  },
  Select: {
    colorBgContainer: '#24273a',
    colorBorder: '#181926',
    colorPrimaryHover: '#8aadf4',
  },
  Table: {
    colorBorder: '#181926',
    colorBorderSecondary: '#363a4f',
    headerBg: '#1e2030',
    rowHoverBg: '#1e2030',
  },
  Tabs: {
    colorPrimary: '#8aadf4',
    inkBarColor: '#8aadf4',
  },
}

// ============ Mocha (暗色主题 - 默认) ============
const MOCHA_TOKENS = {
  colorBgBase: '#1e1e2e',
  colorBgContainer: '#1e1e2e',

  colorBgElevated: '#181825',
  colorBgLayout: '#1e1e2e',
  colorBorder: '#45475a',
  colorBorderSecondary: '#313244',
  colorError: '#f38ba8',
  colorErrorBg: '#1e1e2e',
  colorInfo: '#94e2d5',
  colorInfoBg: '#1e1e2e',
  colorPrimary: '#89b4fa',

  colorPrimaryActive: '#74c7ec',
  colorPrimaryBg: '#1e1e2e',

  colorPrimaryBgHover: '#181825',
  colorPrimaryBorder: '#45475a',

  colorPrimaryBorderHover: '#89b4fa',
  colorPrimaryHover: '#89b4fa',

  colorPrimaryText: '#89b4fa',
  colorPrimaryTextHover: '#89b4fa',

  colorSuccess: '#a6e3a1',
  colorSuccessBg: '#1e1e2e',
  colorText: '#cdd6f4', // Text

  colorTextBase: '#cdd6f4',
  colorTextQuaternary: '#7f849c', // 最浅文字

  colorTextSecondary: '#a6adc8', // Text Muted
  colorTextTertiary: '#9399b2', // Text Subtle
  colorWarning: '#f9e2af',
  colorWarningBg: '#1e1e2e',
}

const MOCHA_COMPONENTS = {
  Button: {
    colorPrimary: '#89b4fa',
  },
  Card: {
    colorBgContainer: '#1e1e2e',
    colorBorder: '#45475a',
  },
  Dropdown: {
    colorBgContainer: '#181825',
  },
  Input: {
    colorBgContainer: '#1e1e2e',
    colorBorder: '#45475a',
    colorBorderHover: '#89b4fa',
    colorPrimaryHover: '#89b4fa',
  },
  Layout: {
    colorBgBody: '#1e1e2e',
    colorBgHeader: '#181825',
  },
  Menu: {
    itemSelectedBg: '#181825',
    subMenuItemBg: '#1e1e2e',
  },
  Modal: {
    colorBgContainer: '#1e1e2e',
    colorBorder: '#45475a',
  },
  Select: {
    colorBgContainer: '#1e1e2e',
    colorBorder: '#45475a',
    colorPrimaryHover: '#89b4fa',
  },
  Table: {
    colorBorder: '#45475a',
    colorBorderSecondary: '#313244',
    headerBg: '#181825',
    rowHoverBg: '#181825',
  },
  Tabs: {
    colorPrimary: '#89b4fa',
    inkBarColor: '#89b4fa',
  },
}

/**
 * 获取 Catppuccin 主题的 Ant Design 配置
 * @param themeId - 主题 ID (latte | frappe | macchiato | mocha)
 * @returns Ant Design ThemeConfig
 */
export function getAntdThemeConfig (themeId: string): ThemeConfig {
  const baseConfig = {
    components: {},
    token: {
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  }

  switch (themeId) {
    case 'latte':
      return {
        ...baseConfig,
        algorithm: theme.defaultAlgorithm,
        components: { ...LATTE_COMPONENTS },
        token: { ...baseConfig.token, ...LATTE_TOKENS },
      }

    case 'frappe':
      return {
        ...baseConfig,
        algorithm: theme.darkAlgorithm,
        components: { ...FRAPPE_COMPONENTS },
        token: { ...baseConfig.token, ...FRAPPE_TOKENS },
      }

    case 'macchiato':
      return {
        ...baseConfig,
        algorithm: theme.darkAlgorithm,
        components: { ...MACCHIATO_COMPONENTS },
        token: { ...baseConfig.token, ...MACCHIATO_TOKENS },
      }

    case 'mocha':
    default:
      return {
        ...baseConfig,
        algorithm: theme.darkAlgorithm,
        components: { ...MOCHA_COMPONENTS },
        token: { ...baseConfig.token, ...MOCHA_TOKENS },
      }
  }
}
