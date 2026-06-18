import type { TextSelection } from '@fifa/features/content/utils/editor'
import type { ReactCodeMirrorRef, ViewUpdate } from '@uiw/react-codemirror'

import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { useSettingStore } from '@fifa/stores'
import CodeMirror from '@uiw/react-codemirror'
import { clsx } from 'clsx'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'

import { createFifaCodeMirrorTheme, createFifaFoldGutter } from './fifaCodeMirrorTheme'

export interface MdxSourceEditorHandle {
  focusAt: (position: number) => void
}

export interface MdxSourceEditorProps {
  className?: string
  onChange?: (value: string) => void
  onSelectionChange?: (selection: TextSelection) => void
  placeholder?: string
  readOnly?: boolean
  value?: string
}

function getSelection(update: ViewUpdate): TextSelection {
  const selection = update.state.selection.main

  return {
    end: selection.to,
    start: selection.from,
  }
}

/**
 * MDX 源码编辑器。
 * 这里只编辑字符串，不改写 MDX 里的 JSX 组件和表达式。
 */
export const MdxSourceEditor = forwardRef<MdxSourceEditorHandle, MdxSourceEditorProps>(
  ({ className, onChange, onSelectionChange, placeholder = '输入 MDX 源码', readOnly = false, value = '' }, ref) => {
    const editorRef = useRef<ReactCodeMirrorRef>(null)
    const { isDark } = useSettingStore()

    const extensions = useMemo(
      () => [markdown(), EditorView.lineWrapping, createFifaFoldGutter(), ...createFifaCodeMirrorTheme(isDark)],
      [isDark],
    )

    useImperativeHandle(
      ref,
      () => ({
        focusAt(position) {
          requestAnimationFrame(() => {
            const view = editorRef.current?.view
            if (!view) return

            const docLength = view.state.doc.length
            const safePosition = Math.min(position, docLength)

            view.focus()
            view.dispatch({
              selection: { anchor: safePosition },
              scrollIntoView: true,
            })
          })
        },
      }),
      [],
    )

    return (
      <div
        className={clsx(
          'flex h-full flex-col overflow-hidden',
          '[&_.cm-theme]:flex-1 [&_.cm-theme]:min-h-0 [&_.cm-theme]:overflow-hidden',
          '[&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-editor.cm-focused]:outline-none',
          '[&_.cm-scroller]:overflow-y-auto [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-sm [&_.cm-scroller]:leading-6',
          '[&_.cm-content]:min-h-full [&_.cm-content]:px-4 [&_.cm-content]:py-4',
          className,
        )}
      >
        <CodeMirror
          className="flex flex-1 flex-col overflow-hidden"
          ref={editorRef}
          basicSetup={{
            bracketMatching: true,
            closeBrackets: true,
            defaultKeymap: true,
            drawSelection: true,
            dropCursor: true,
            foldGutter: false,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            highlightSelectionMatches: true,
            lineNumbers: true,
            searchKeymap: true,
          }}
          editable={!readOnly}
          extensions={extensions}
          height="100%"
          onChange={onChange}
          onUpdate={(update) => {
            if (!update.docChanged && !update.selectionSet) {
              return
            }

            onSelectionChange?.(getSelection(update))
          }}
          placeholder={placeholder}
          theme="none"
          value={value}
        />
      </div>
    )
  },
)
