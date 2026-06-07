import i18n from './index'

/**
 * 导出 i18n 实例的访问器
 * 用于在需要动态访问 i18n 的地方使用，避免循环依赖
 */
export const getI18nInstance = () => i18n
