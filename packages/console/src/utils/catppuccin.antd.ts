import type { ThemeConfig } from 'antd'

import theme from 'antd/es/theme'

import { hexToRgba } from './theme'

/**
 * Catppuccin 主题配置 for Ant Design
 * 参考 Catppuccin 官方色彩规范: https://github.com/catppuccin/catppuccin
 * Ant Design 主题定制: https://ant.design/docs/react/customize-theme-cn
 */

const LIGHT_SURFACE_ALPHA = {
  container: 0.84,
  elevated: 0.92,
  field: 0.74,
  layout: 0.9,
  tableContainer: 0.62,
  tableHeader: 0.5,
  table: 0.78,
  tableActive: 0.62,
  tableChrome: 0.72,
}

const DARK_SURFACE_ALPHA = {
  container: 0.86,
  elevated: 0.94,
  field: 0.8,
  layout: 0.9,
  tableContainer: 0.56,
  tableHeader: 0.46,
  table: 0.8,
  tableActive: 0.58,
  tableChrome: 0.74,
}

// ============ Latte (亮色主题) ============
const LATTE_TOKENS = {
  colorBgBase: '#eff1f5',
  // 背景色
  colorBgContainer: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.container),

  colorBgElevated: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.elevated),
  colorBgLayout: '#eff1f5',
  // 边框颜色
  colorBorder: '#dce0e8',
  colorBorderSecondary: '#e6e9ef',
  // 错误 - Red
  colorError: '#d20f39',
  colorErrorBg: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.container),
  // 信息 - Teal
  colorInfo: '#179299',
  colorInfoBg: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.container),
  // 主色 - Blue
  colorPrimary: '#1e66f5',

  colorPrimaryActive: '#1e66f5',
  colorPrimaryBg: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.container),

  colorPrimaryBgHover: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.table),
  colorPrimaryBorder: '#dce0e8',

  colorPrimaryBorderHover: '#1e66f5',
  colorPrimaryHover: '#1e66f5',

  colorPrimaryText: '#1e66f5',
  colorPrimaryTextHover: '#1e66f5',

  // 成功 - Green
  colorSuccess: '#40a02b',
  colorSuccessBg: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.container),
  // 文字颜色层级 (Catppuccin 规范)
  colorText: '#4c4f69', // Text

  // Seed Token - 基础色基准
  colorTextBase: '#4c4f69',
  colorTextQuaternary: '#9399b2', // 最浅文字

  colorTextSecondary: '#8c8fa1', // Text Muted
  colorTextTertiary: '#6c6f85', // Text Subtle
  // 警告 - Yellow
  colorWarning: '#df8e1d',
  colorWarningBg: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.container),
}

const LATTE_COMPONENTS = {
  Button: {
    colorPrimary: '#1e66f5',
  },
  Card: {
    colorBgContainer: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.container),
    colorBorder: '#dce0e8',
  },
  Dropdown: {
    colorBgContainer: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.elevated),
  },
  Input: {
    colorBgContainer: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.field),
    colorBorder: '#dce0e8',
    colorBorderHover: '#1e66f5',
    colorPrimaryHover: '#1e66f5',
  },
  Layout: {
    colorBgBody: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.container),
    colorBgHeader: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.layout),
  },
  Menu: {
    itemSelectedBg: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.table),
    subMenuItemBg: 'transparent',
  },
  Modal: {
    colorBgContainer: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.elevated),
    colorBorder: '#dce0e8',
  },
  Select: {
    colorBgContainer: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.field),
    colorBorder: '#dce0e8',
    colorPrimaryHover: '#1e66f5',
  },
  Table: {
    colorBgContainer: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.tableContainer),
    colorBorder: '#dce0e8',
    colorBorderSecondary: '#e6e9ef',
    headerBg: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.tableHeader),
    headerSortActiveBg: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.tableActive),
    headerSortHoverBg: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.tableActive),
    bodySortBg: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.table),
    expandIconBg: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.tableChrome),
    filterDropdownBg: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.elevated),
    filterDropdownMenuBg: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.elevated),
    fixedHeaderSortActiveBg: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.tableActive),
    footerBg: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.table),
    headerFilterHoverBg: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.tableChrome),
    headerSplitColor: hexToRgba('#dce0e8', LIGHT_SURFACE_ALPHA.tableChrome),
    rowHoverBg: hexToRgba('#e6e9ef', LIGHT_SURFACE_ALPHA.field),
    rowExpandedBg: hexToRgba('#eff1f5', LIGHT_SURFACE_ALPHA.table),
    rowSelectedBg: hexToRgba('#1e66f5', 0.1),
    rowSelectedHoverBg: hexToRgba('#1e66f5', 0.14),
    stickyScrollBarBg: hexToRgba('#949aad', 0.28),
  },
  Tabs: {
    colorPrimary: '#1e66f5',
    inkBarColor: '#1e66f5',
  },
}

// ============ Frappe (暗色主题) ============
const FRAPPE_TOKENS = {
  colorBgBase: '#303446',
  colorBgContainer: hexToRgba('#303446', DARK_SURFACE_ALPHA.container),

  colorBgElevated: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.elevated),
  colorBgLayout: '#303446',
  colorBorder: '#232634',
  colorBorderSecondary: '#414559',
  colorError: '#e78284',
  colorErrorBg: hexToRgba('#303446', DARK_SURFACE_ALPHA.container),
  colorInfo: '#81c8be',
  colorInfoBg: hexToRgba('#303446', DARK_SURFACE_ALPHA.container),
  colorPrimary: '#8caaee',

  colorPrimaryActive: '#85c1dc',
  colorPrimaryBg: hexToRgba('#303446', DARK_SURFACE_ALPHA.container),

  colorPrimaryBgHover: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.table),
  colorPrimaryBorder: '#232634',

  colorPrimaryBorderHover: '#8caaee',
  colorPrimaryHover: '#8caaee',

  colorPrimaryText: '#8caaee',
  colorPrimaryTextHover: '#8caaee',

  colorSuccess: '#a6d189',
  colorSuccessBg: hexToRgba('#303446', DARK_SURFACE_ALPHA.container),
  colorText: '#c6d0f5', // Text

  colorTextBase: '#c6d0f5',
  colorTextQuaternary: '#6c7a9b', // 最浅文字

  colorTextSecondary: '#a5adce', // Text Muted
  colorTextTertiary: '#8389a7', // Text Subtle
  colorWarning: '#e5c890',
  colorWarningBg: hexToRgba('#303446', DARK_SURFACE_ALPHA.container),
}

const FRAPPE_COMPONENTS = {
  Button: {
    colorPrimary: '#8caaee',
  },
  Card: {
    colorBgContainer: hexToRgba('#303446', DARK_SURFACE_ALPHA.container),
    colorBorder: '#232634',
  },
  Dropdown: {
    colorBgContainer: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.elevated),
  },
  Input: {
    colorBgContainer: hexToRgba('#303446', DARK_SURFACE_ALPHA.field),
    colorBorder: '#232634',
    colorBorderHover: '#8caaee',
    colorPrimaryHover: '#8caaee',
  },
  Layout: {
    colorBgBody: hexToRgba('#303446', DARK_SURFACE_ALPHA.container),
    colorBgHeader: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.layout),
  },
  Menu: {
    itemSelectedBg: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.table),
    subMenuItemBg: 'transparent',
  },
  Modal: {
    colorBgContainer: hexToRgba('#303446', DARK_SURFACE_ALPHA.elevated),
    colorBorder: '#232634',
  },
  Select: {
    colorBgContainer: hexToRgba('#303446', DARK_SURFACE_ALPHA.field),
    colorBorder: '#232634',
    colorPrimaryHover: '#8caaee',
  },
  Table: {
    colorBgContainer: hexToRgba('#303446', DARK_SURFACE_ALPHA.tableContainer),
    colorBorder: '#232634',
    colorBorderSecondary: '#414559',
    headerBg: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.tableHeader),
    headerSortActiveBg: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.tableActive),
    headerSortHoverBg: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.tableActive),
    bodySortBg: hexToRgba('#303446', DARK_SURFACE_ALPHA.table),
    expandIconBg: hexToRgba('#303446', DARK_SURFACE_ALPHA.tableChrome),
    filterDropdownBg: hexToRgba('#303446', DARK_SURFACE_ALPHA.elevated),
    filterDropdownMenuBg: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.elevated),
    fixedHeaderSortActiveBg: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.tableActive),
    footerBg: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.table),
    headerFilterHoverBg: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.tableChrome),
    headerSplitColor: hexToRgba('#414559', DARK_SURFACE_ALPHA.tableChrome),
    rowHoverBg: hexToRgba('#292c3c', DARK_SURFACE_ALPHA.field),
    rowExpandedBg: hexToRgba('#303446', DARK_SURFACE_ALPHA.table),
    rowSelectedBg: hexToRgba('#8caaee', 0.12),
    rowSelectedHoverBg: hexToRgba('#8caaee', 0.16),
    stickyScrollBarBg: hexToRgba('#737894', 0.32),
  },
  Tabs: {
    colorPrimary: '#8caaee',
    inkBarColor: '#8caaee',
  },
}

// ============ Macchiato (暗色主题) ============
const MACCHIATO_TOKENS = {
  colorBgBase: '#24273a',
  colorBgContainer: hexToRgba('#24273a', DARK_SURFACE_ALPHA.container),

  colorBgElevated: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.elevated),
  colorBgLayout: '#24273a',
  colorBorder: '#181926',
  colorBorderSecondary: '#363a4f',
  colorError: '#ed8796',
  colorErrorBg: hexToRgba('#24273a', DARK_SURFACE_ALPHA.container),
  colorInfo: '#8bd5ca',
  colorInfoBg: hexToRgba('#24273a', DARK_SURFACE_ALPHA.container),
  colorPrimary: '#8aadf4',

  colorPrimaryActive: '#7dc4e4',
  colorPrimaryBg: hexToRgba('#24273a', DARK_SURFACE_ALPHA.container),

  colorPrimaryBgHover: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.table),
  colorPrimaryBorder: '#181926',

  colorPrimaryBorderHover: '#8aadf4',
  colorPrimaryHover: '#8aadf4',

  colorPrimaryText: '#8aadf4',
  colorPrimaryTextHover: '#8aadf4',

  colorSuccess: '#a6da95',
  colorSuccessBg: hexToRgba('#24273a', DARK_SURFACE_ALPHA.container),
  colorText: '#cad3f5', // Text

  colorTextBase: '#cad3f5',
  colorTextQuaternary: '#7b8aab', // 最浅文字

  colorTextSecondary: '#a5adcb', // Text Muted
  colorTextTertiary: '#8a91b4', // Text Subtle
  colorWarning: '#eed49f',
  colorWarningBg: hexToRgba('#24273a', DARK_SURFACE_ALPHA.container),
}

const MACCHIATO_COMPONENTS = {
  Button: {
    colorPrimary: '#8aadf4',
  },
  Card: {
    colorBgContainer: hexToRgba('#24273a', DARK_SURFACE_ALPHA.container),
    colorBorder: '#181926',
  },
  Dropdown: {
    colorBgContainer: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.elevated),
  },
  Input: {
    colorBgContainer: hexToRgba('#24273a', DARK_SURFACE_ALPHA.field),
    colorBorder: '#181926',
    colorBorderHover: '#8aadf4',
    colorPrimaryHover: '#8aadf4',
  },
  Layout: {
    colorBgBody: hexToRgba('#24273a', DARK_SURFACE_ALPHA.container),
    colorBgHeader: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.layout),
  },
  Menu: {
    itemSelectedBg: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.table),
    subMenuItemBg: 'transparent',
  },
  Modal: {
    colorBgContainer: hexToRgba('#24273a', DARK_SURFACE_ALPHA.elevated),
    colorBorder: '#181926',
  },
  Select: {
    colorBgContainer: hexToRgba('#24273a', DARK_SURFACE_ALPHA.field),
    colorBorder: '#181926',
    colorPrimaryHover: '#8aadf4',
  },
  Table: {
    colorBgContainer: hexToRgba('#24273a', DARK_SURFACE_ALPHA.tableContainer),
    colorBorder: '#181926',
    colorBorderSecondary: '#363a4f',
    headerBg: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.tableHeader),
    headerSortActiveBg: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.tableActive),
    headerSortHoverBg: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.tableActive),
    bodySortBg: hexToRgba('#24273a', DARK_SURFACE_ALPHA.table),
    expandIconBg: hexToRgba('#24273a', DARK_SURFACE_ALPHA.tableChrome),
    filterDropdownBg: hexToRgba('#24273a', DARK_SURFACE_ALPHA.elevated),
    filterDropdownMenuBg: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.elevated),
    fixedHeaderSortActiveBg: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.tableActive),
    footerBg: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.table),
    headerFilterHoverBg: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.tableChrome),
    headerSplitColor: hexToRgba('#363a4f', DARK_SURFACE_ALPHA.tableChrome),
    rowHoverBg: hexToRgba('#1e2030', DARK_SURFACE_ALPHA.field),
    rowExpandedBg: hexToRgba('#24273a', DARK_SURFACE_ALPHA.table),
    rowSelectedBg: hexToRgba('#8aadf4', 0.12),
    rowSelectedHoverBg: hexToRgba('#8aadf4', 0.16),
    stickyScrollBarBg: hexToRgba('#6e738d', 0.32),
  },
  Tabs: {
    colorPrimary: '#8aadf4',
    inkBarColor: '#8aadf4',
  },
}

// ============ Mocha (暗色主题 - 默认) ============
const MOCHA_TOKENS = {
  colorBgBase: '#1e1e2e',
  colorBgContainer: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.container),

  colorBgElevated: hexToRgba('#181825', DARK_SURFACE_ALPHA.elevated),
  colorBgLayout: '#1e1e2e',
  colorBorder: '#45475a',
  colorBorderSecondary: '#313244',
  colorError: '#f38ba8',
  colorErrorBg: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.container),
  colorInfo: '#94e2d5',
  colorInfoBg: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.container),
  colorPrimary: '#89b4fa',

  colorPrimaryActive: '#74c7ec',
  colorPrimaryBg: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.container),

  colorPrimaryBgHover: hexToRgba('#181825', DARK_SURFACE_ALPHA.table),
  colorPrimaryBorder: '#45475a',

  colorPrimaryBorderHover: '#89b4fa',
  colorPrimaryHover: '#89b4fa',

  colorPrimaryText: '#89b4fa',
  colorPrimaryTextHover: '#89b4fa',

  colorSuccess: '#a6e3a1',
  colorSuccessBg: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.container),
  colorText: '#cdd6f4', // Text

  colorTextBase: '#cdd6f4',
  colorTextQuaternary: '#7f849c', // 最浅文字

  colorTextSecondary: '#a6adc8', // Text Muted
  colorTextTertiary: '#9399b2', // Text Subtle
  colorWarning: '#f9e2af',
  colorWarningBg: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.container),
}

const MOCHA_COMPONENTS = {
  Button: {
    colorPrimary: '#89b4fa',
  },
  Card: {
    colorBgContainer: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.container),
    colorBorder: '#45475a',
  },
  Dropdown: {
    colorBgContainer: hexToRgba('#181825', DARK_SURFACE_ALPHA.elevated),
  },
  Input: {
    colorBgContainer: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.field),
    colorBorder: '#45475a',
    colorBorderHover: '#89b4fa',
    colorPrimaryHover: '#89b4fa',
  },
  Layout: {
    colorBgBody: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.container),
    colorBgHeader: hexToRgba('#181825', DARK_SURFACE_ALPHA.layout),
  },
  Menu: {
    itemSelectedBg: hexToRgba('#181825', DARK_SURFACE_ALPHA.table),
    subMenuItemBg: 'transparent',
  },
  Modal: {
    colorBgContainer: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.elevated),
    colorBorder: '#45475a',
  },
  Select: {
    colorBgContainer: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.field),
    colorBorder: '#45475a',
    colorPrimaryHover: '#89b4fa',
  },
  Table: {
    colorBgContainer: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.tableContainer),
    colorBorder: '#45475a',
    colorBorderSecondary: '#313244',
    headerBg: hexToRgba('#181825', DARK_SURFACE_ALPHA.tableHeader),
    headerSortActiveBg: hexToRgba('#181825', DARK_SURFACE_ALPHA.tableActive),
    headerSortHoverBg: hexToRgba('#181825', DARK_SURFACE_ALPHA.tableActive),
    bodySortBg: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.table),
    expandIconBg: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.tableChrome),
    filterDropdownBg: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.elevated),
    filterDropdownMenuBg: hexToRgba('#181825', DARK_SURFACE_ALPHA.elevated),
    fixedHeaderSortActiveBg: hexToRgba('#181825', DARK_SURFACE_ALPHA.tableActive),
    footerBg: hexToRgba('#181825', DARK_SURFACE_ALPHA.table),
    headerFilterHoverBg: hexToRgba('#181825', DARK_SURFACE_ALPHA.tableChrome),
    headerSplitColor: hexToRgba('#45475a', DARK_SURFACE_ALPHA.tableChrome),
    rowHoverBg: hexToRgba('#181825', DARK_SURFACE_ALPHA.field),
    rowExpandedBg: hexToRgba('#1e1e2e', DARK_SURFACE_ALPHA.table),
    rowSelectedBg: hexToRgba('#89b4fa', 0.12),
    rowSelectedHoverBg: hexToRgba('#89b4fa', 0.16),
    stickyScrollBarBg: hexToRgba('#6c7086', 0.32),
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
export function getAntdThemeConfig(themeId: string): ThemeConfig {
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
