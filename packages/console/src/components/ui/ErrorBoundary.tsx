import type { ErrorComponentProps } from '@tanstack/react-router'

import { Button } from 'antd'
import { AlertTriangle, House, RefreshCw } from 'lucide-react'

import { ErrorStatePage } from './ErrorStatePage'

/**
 * 错误边界组件，用于捕获并处理子组件抛出的错误。
 */
export function ErrorBoundary({ error, info, reset }: ErrorComponentProps) {
  const errorMessage = error instanceof Error && error.message.trim() ? error.message : '当前页面出现了未预期的错误'
  const errorName = error instanceof Error && error.name.trim() ? error.name : 'ApplicationError'

  const handleRetry = () => {
    reset()
  }

  const handleGoHome = () => {
    window.location.assign('/')
  }

  return (
    <ErrorStatePage
      eyebrow="Error State"
      icon={<AlertTriangle className="size-5" />}
      title="当前页面暂时无法显示"
      description="页面加载时出了点问题。重试当前页面，或返回首页继续其他操作。"
      note="如果问题持续出现，可以再查看下方错误信息。"
      actions={
        <>
          <Button type="primary" icon={<RefreshCw className="size-4" />} onClick={handleRetry}>
            重试
          </Button>
          <Button icon={<House className="size-4" />} onClick={handleGoHome}>
            首页
          </Button>
        </>
      }
      detailDescription="需要排查时，可以参考下面的错误信息。"
      detailItems={[
        {
          label: '错误名称',
          content: <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6">{errorName}</pre>,
        },
        {
          label: '错误消息',
          content: (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6">{errorMessage}</pre>
          ),
        },
        ...(info?.componentStack
          ? [
              {
                label: '组件堆栈',
                content: (
                  <pre className="text-fg-muted max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-6">
                    {info.componentStack}
                  </pre>
                ),
              },
            ]
          : []),
      ]}
    />
  )
}
