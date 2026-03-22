import type { ErrorInfo, ReactNode } from 'react'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Component } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
  hasError: boolean
}

const defaultFallback = (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <AlertTriangle className="mb-3 h-10 w-10 text-amber-500" />
    <h3 className="text-fg mb-2 text-lg font-semibold">Markdown 渲染出错</h3>
    <p className="text-fg-muted mb-4 text-sm">该内容无法正确渲染，请检查 Markdown 语法</p>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="flex items-center gap-2 rounded-md bg-black/70 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80"
    >
      <RefreshCw size={14} />
      刷新页面
    </button>
  </div>
)

/**
 * MarkdownErrorBoundary：捕获 Markdown 渲染过程中的错误
 * - 防止异常 Markdown 内容导致整个组件崩溃
 * - 显示友好的错误提示 UI
 */
export class MarkdownErrorBoundary extends Component<Props, State> {
  public state: State = {
    error: null,
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { error, hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Markdown 渲染错误:', error, errorInfo)
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? defaultFallback
    }
    return this.props.children
  }
}
