import type { PreviewMarkdownBody, PreviewMarkdownResponse } from '@console/modules/preview'
import type { TFunction } from 'i18next'

import { usePreviewMarkdownMutation } from '@console/modules/preview'
import dayjs from 'dayjs'
import { useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'

export type ContentPreviewSyncState = 'dirty' | 'failed' | 'idle' | 'synced' | 'syncing'

interface ContentPreviewValues {
  coverImage?: string | null
  excerpt?: string | null
  markdown: string
  title?: string
  type: 'post'
}

interface UseContentPreviewSyncResult {
  deferredMarkdown: string
  previewData: PreviewMarkdownResponse | null
  state: ContentPreviewSyncState
  syncedAt: string | null
}

export function getPreviewSyncStatusText(t: TFunction, state: ContentPreviewSyncState, syncedAt?: string | null) {
  if (state === 'synced' && syncedAt) {
    return t('content.preview.state.syncedAt', {
      time: dayjs(syncedAt).format('HH:mm:ss'),
    })
  }

  return t(`content.preview.state.${state}`)
}

export function useContentPreviewSync(values: ContentPreviewValues): UseContentPreviewSyncResult {
  const { mutateAsync } = usePreviewMarkdownMutation()
  const deferredMarkdown = useDeferredValue(values.markdown)
  const hasContent = Boolean(values.markdown.trim())
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [completedKey, setCompletedKey] = useState<string | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<PreviewMarkdownResponse | null>(null)
  const [syncState, setSyncState] = useState<Exclude<ContentPreviewSyncState, 'dirty'>>('idle')
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const latestPayloadKeyRef = useRef('')

  const payload = useMemo<PreviewMarkdownBody>(
    () => ({
      coverImage: values.coverImage || undefined,
      excerpt: values.excerpt || undefined,
      markdown: values.markdown,
      title: values.title || undefined,
      type: values.type,
    }),
    [values.coverImage, values.excerpt, values.markdown, values.title, values.type],
  )

  const payloadKey = useMemo(() => JSON.stringify(payload), [payload])

  useEffect(() => {
    latestPayloadKeyRef.current = payloadKey
  }, [payloadKey])

  const syncPreview = useEffectEvent(async (nextPayload: PreviewMarkdownBody, nextKey: string) => {
    setActiveKey(nextKey)
    setFailedKey(null)
    setSyncState('syncing')

    try {
      const result = await mutateAsync(nextPayload)

      if (latestPayloadKeyRef.current !== nextKey) {
        return
      }

      setActiveKey((current) => (current === nextKey ? null : current))
      setCompletedKey(nextKey)
      setPreviewData(result)
      setSyncedAt(new Date().toISOString())
      setSyncState('synced')
    } catch {
      if (latestPayloadKeyRef.current !== nextKey) {
        return
      }

      setActiveKey((current) => (current === nextKey ? null : current))
      setFailedKey(nextKey)
      setSyncState('failed')
    }
  })

  useEffect(() => {
    if (!payload.markdown.trim()) {
      return
    }

    if (payloadKey === completedKey || payloadKey === activeKey) {
      return
    }

    const timer = window.setTimeout(() => {
      if (payloadKey === completedKey || payloadKey === activeKey) {
        return
      }

      void syncPreview(payload, payloadKey)
    }, 700)

    return () => window.clearTimeout(timer)
  }, [activeKey, completedKey, payload, payloadKey])

  const state: ContentPreviewSyncState = !hasContent
    ? 'idle'
    : payloadKey === activeKey
      ? 'syncing'
      : payloadKey === failedKey
        ? 'failed'
        : payloadKey !== completedKey
          ? 'dirty'
          : syncState === 'idle'
            ? 'synced'
            : syncState

  return {
    deferredMarkdown,
    previewData: hasContent ? previewData : null,
    state,
    syncedAt: hasContent ? syncedAt : null,
  }
}
