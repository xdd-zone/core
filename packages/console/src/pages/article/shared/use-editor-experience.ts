import type { NavigationBlocker } from '@tanstack/history'

import { useRouter } from '@tanstack/react-router'
import { Modal } from 'antd'
import { useEffect, useEffectEvent } from 'react'

interface EditorNavigationBlockerOptions {
  cancelText: string
  enabled: boolean
  message: string
  okText: string
}

interface EditorSaveShortcutOptions {
  enabled?: boolean
  onSave: () => void
}

/**
 * 在编辑页存在未保存内容时拦截路由离开。
 */
export function useEditorNavigationBlocker({ cancelText, enabled, message, okText }: EditorNavigationBlockerOptions) {
  const router = useRouter()

  useEffect(() => {
    const history = router.history as typeof router.history & {
      getBlockers?: () => NavigationBlocker[]
      setBlockers?: (blockers: NavigationBlocker[]) => void
    }

    if (!history.getBlockers || !history.setBlockers) {
      return
    }

    const blocker: NavigationBlocker = {
      blockerFn: async () => {
        if (!enabled) {
          return false
        }

        return await new Promise<boolean>((resolve) => {
          Modal.confirm({
            cancelText,
            content: message,
            okText,
            onCancel: () => resolve(true),
            onOk: () => resolve(false),
          })
        })
      },
      enableBeforeUnload: () => enabled,
    }

    const nextBlockers = [...(history.getBlockers?.() ?? []), blocker]
    history.setBlockers?.(nextBlockers)

    return () => {
      const blockers = history.getBlockers?.() ?? []
      history.setBlockers?.(blockers.filter((item) => item !== blocker))
    }
  }, [cancelText, enabled, message, okText, router])
}

/**
 * 为编辑页注册 Cmd/Ctrl + S 快捷保存。
 */
export function useEditorSaveShortcut({ enabled = true, onSave }: EditorSaveShortcutOptions) {
  const handleSave = useEffectEvent(() => {
    if (!enabled) {
      return
    }

    onSave()
  })

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') {
        return
      }

      event.preventDefault()
      handleSave()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled])
}
