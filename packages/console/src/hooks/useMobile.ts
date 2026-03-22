import { useEffect, useState } from 'react'

/**
 * 检测是否为移动端设备的 Hook
 * @returns {boolean} 是否为移动端设备
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // 检测屏幕宽度
      const screenWidth = window.innerWidth <= 768

      // 检测用户代理字符串
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile']
      const isMobileUA = mobileKeywords.some((keyword) => userAgent.includes(keyword))

      // 检测触摸支持
      const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // 综合判断：屏幕宽度小于768px 或者 是移动设备用户代理 或者 支持触摸且屏幕较小
      const mobile = screenWidth || isMobileUA || (hasTouchSupport && window.innerWidth <= 1024)

      setIsMobile(mobile)
    }

    // 初始检测
    checkMobile()

    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return isMobile
}
