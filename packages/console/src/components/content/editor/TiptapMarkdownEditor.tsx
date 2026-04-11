import type { Editor } from '@tiptap/react'

import { Markdown } from '@tiptap/markdown'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button, Tooltip } from 'antd'
import { clsx } from 'clsx'
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
} from 'lucide-react'
import { useEffect } from 'react'

import { useTranslation } from 'react-i18next'

export interface TiptapMarkdownEditorProps {
  className?: string
  onChange?: (value: string) => void
  value: string
}

interface ToolbarAction {
  active?: (editor: Editor) => boolean
  command: (editor: Editor) => void
  disabled?: (editor: Editor) => boolean
  icon: typeof Bold
  labelKey: string
}

const toolbarActions: ToolbarAction[] = [
  {
    active: (editor) => editor.isActive('paragraph'),
    command: (editor) => {
      editor.chain().focus().setParagraph().run()
    },
    icon: Pilcrow,
    labelKey: 'tiptapExample.toolbar.paragraph',
  },
  {
    active: (editor) => editor.isActive('heading', { level: 1 }),
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
    icon: Heading1,
    labelKey: 'tiptapExample.toolbar.heading1',
  },
  {
    active: (editor) => editor.isActive('heading', { level: 2 }),
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    icon: Heading2,
    labelKey: 'tiptapExample.toolbar.heading2',
  },
  {
    active: (editor) => editor.isActive('heading', { level: 3 }),
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    icon: Heading3,
    labelKey: 'tiptapExample.toolbar.heading3',
  },
  {
    active: (editor) => editor.isActive('bold'),
    command: (editor) => {
      editor.chain().focus().toggleBold().run()
    },
    disabled: (editor) => !editor.can().chain().focus().toggleBold().run(),
    icon: Bold,
    labelKey: 'tiptapExample.toolbar.bold',
  },
  {
    active: (editor) => editor.isActive('italic'),
    command: (editor) => {
      editor.chain().focus().toggleItalic().run()
    },
    disabled: (editor) => !editor.can().chain().focus().toggleItalic().run(),
    icon: Italic,
    labelKey: 'tiptapExample.toolbar.italic',
  },
  {
    active: (editor) => editor.isActive('bulletList'),
    command: (editor) => {
      editor.chain().focus().toggleBulletList().run()
    },
    disabled: (editor) => !editor.can().chain().focus().toggleBulletList().run(),
    icon: List,
    labelKey: 'tiptapExample.toolbar.bulletList',
  },
  {
    active: (editor) => editor.isActive('orderedList'),
    command: (editor) => {
      editor.chain().focus().toggleOrderedList().run()
    },
    disabled: (editor) => !editor.can().chain().focus().toggleOrderedList().run(),
    icon: ListOrdered,
    labelKey: 'tiptapExample.toolbar.orderedList',
  },
  {
    active: (editor) => editor.isActive('blockquote'),
    command: (editor) => {
      editor.chain().focus().toggleBlockquote().run()
    },
    disabled: (editor) => !editor.can().chain().focus().toggleBlockquote().run(),
    icon: Quote,
    labelKey: 'tiptapExample.toolbar.blockquote',
  },
  {
    active: (editor) => editor.isActive('codeBlock'),
    command: (editor) => {
      editor.chain().focus().toggleCodeBlock().run()
    },
    disabled: (editor) => !editor.can().chain().focus().toggleCodeBlock().run(),
    icon: Code2,
    labelKey: 'tiptapExample.toolbar.codeBlock',
  },
  {
    command: (editor) => {
      editor.chain().focus().setHorizontalRule().run()
    },
    icon: Minus,
    labelKey: 'tiptapExample.toolbar.horizontalRule',
  },
] as const

/**
 * Tiptap Markdown 编辑器。
 * 用于在 Console 里提供基础富文本编辑，并把结果实时回传为 Markdown 字符串。
 */
export function TiptapMarkdownEditor({ className, onChange, value }: TiptapMarkdownEditorProps) {
  const { t } = useTranslation()

  const editor = useEditor({
    content: value,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        class: clsx(
          'min-h-[360px] px-5 py-4 text-sm leading-7 text-fg outline-none',
          '[&_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_p.is-editor-empty:first-child::before]:float-left',
          '[&_p.is-editor-empty:first-child::before]:h-0',
          '[&_p.is-editor-empty:first-child::before]:text-fg-muted/75',
          '[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_h1]:mt-6 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight',
          '[&_h2]:mt-5 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight',
          '[&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold',
          '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/35 [&_blockquote]:pl-4',
          '[&_blockquote]:text-fg-muted',
          '[&_code]:rounded-md [&_code]:bg-overlay-0/70 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono',
          '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-surface-muted [&_pre]:p-4',
          '[&_hr]:my-6 [&_hr]:border-border-subtle',
          '[&_li]:my-1',
          '[&_ul]:list-disc [&_ul]:pl-5',
          '[&_ol]:list-decimal [&_ol]:pl-5',
        ),
        'data-placeholder': t('tiptapExample.editorPlaceholder'),
      },
    },
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Markdown.configure({
        markedOptions: {
          gfm: true,
        },
      }),
    ],
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      onChange?.(editor.getMarkdown())
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getMarkdown())
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    if (editor.getMarkdown() === value) {
      return
    }

    editor.commands.setContent(value, {
      contentType: 'markdown',
    })
  }, [editor, value])

  return (
    <div className={clsx('overflow-hidden rounded-2xl border border-border-subtle bg-surface/85 shadow-sm', className)}>
      <div className="flex flex-wrap gap-2 border-b border-border-subtle bg-surface-muted/65 px-4 py-3">
        {toolbarActions.map((action) => {
          const Icon = action.icon
          const isActive = editor ? (action.active?.(editor) ?? false) : false
          const disabled = editor ? (action.disabled?.(editor) ?? false) : true

          return (
            <Tooltip key={action.labelKey} title={t(action.labelKey)}>
              <Button
                type={isActive ? 'primary' : 'default'}
                shape="circle"
                disabled={disabled}
                icon={<Icon className="size-4" />}
                onClick={() => {
                  if (!editor) {
                    return
                  }

                  action.command(editor)
                }}
              />
            </Tooltip>
          )
        })}
      </div>

      <div className="bg-surface/90">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
