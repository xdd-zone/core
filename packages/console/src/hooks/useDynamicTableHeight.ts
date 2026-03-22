import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 动态计算 Ant Design Table 在 Card 内的高度，以实现响应式固定表头。
 * @param loading - 表格的加载状态，当加载状态改变时会重新计算高度。
 * @returns 返回一个包含 `cardRef` 和 `tableScrollY` 的对象。
 * - `cardRef`：需要附加到 Card 组件的 ref。
 * - `tableScrollY`：计算出的表格 y 轴滚动高度。
 */
export function useDynamicTableHeight(loading: boolean) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tableScrollY, setTableScrollY] = useState(0)

  const calculateTableScrollY = useCallback(() => {
    if (cardRef.current) {
      const cardTop = cardRef.current.getBoundingClientRect().top
      // 页面内容区域的底部内边距
      const pageBottomPadding = 24
      // Card 组件自带的上下内边距
      const cardBodyPadding = 48
      // 按钮容器的高度和外边距
      const buttonContainerHeight = 48
      // 表格头部高度
      const tableHeaderHeight = 55
      // 表格分页器高度
      const tablePaginationHeight = 64

      const availableHeight = window.innerHeight - cardTop - pageBottomPadding
      const scrollY =
        availableHeight - cardBodyPadding - buttonContainerHeight - tableHeaderHeight - tablePaginationHeight

      setTableScrollY(scrollY > 0 ? scrollY : 0)
    }
  }, [])

  useEffect(() => {
    // 使用 requestAnimationFrame 避免同步 setState 导致的级联渲染
    const rafId = requestAnimationFrame(() => {
      calculateTableScrollY()
    })
    window.addEventListener('resize', calculateTableScrollY)
    return () => {
      window.removeEventListener('resize', calculateTableScrollY)
      cancelAnimationFrame(rafId)
    }
  }, [loading, calculateTableScrollY])

  return { cardRef, tableScrollY }
}
