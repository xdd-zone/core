import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en'
import zh from './locales/zh'

// 获取浏览器语言或从localStorage获取保存的语言
function getInitialLanguage(): string {
  if (typeof window !== 'undefined') {
    // 首先尝试从localStorage获取
    const savedLanguage = localStorage.getItem('i18n-language')
    if (savedLanguage && ['zh', 'en'].includes(savedLanguage)) {
      return savedLanguage
    }

    // 如果没有保存的语言，则根据浏览器语言判断
    const browserLanguage = navigator.language.toLowerCase()
    if (browserLanguage.startsWith('zh')) {
      return 'zh'
    }
  }

  // 默认返回英文
  return 'en'
}

i18n
  .use(initReactI18next) // 传递 i18n 实例给 react-i18next
  .init({
    debug: import.meta.env.DEV, // 调试模式（生产环境建议关闭）
    fallbackLng: 'en', // 回退语言
    interpolation: {
      escapeValue: false, // React 已经安全处理了 XSS
    },
    lng: getInitialLanguage(), // 设置初始语言
    resources: {
      en: {
        translation: en,
      },
      zh: {
        translation: zh,
      },
    },
  })

// 监听语言变化并保存到localStorage
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('i18n-language', lng)
  }
})

export default i18n
