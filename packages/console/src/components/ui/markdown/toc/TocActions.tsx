import type { FC, ReactElement } from 'react'

import { Bell, MessageSquare, Share2, ThumbsUp } from 'lucide-react'

export const TocActions: FC = (): ReactElement => {
  return (
    <div className="mt-6 flex flex-col items-start gap-6">
      <button type="button" className="text-fg-muted hover:text-primary cursor-pointer" aria-label="点赞">
        <ThumbsUp size={20} />
      </button>
      <button type="button" className="text-fg-muted hover:text-primary cursor-pointer" aria-label="转发">
        <Share2 size={20} />
      </button>
      <button type="button" className="text-fg-muted hover:text-primary cursor-pointer" aria-label="订阅">
        <Bell size={20} />
      </button>
      <button type="button" className="text-fg-muted hover:text-primary cursor-pointer" aria-label="评论">
        <MessageSquare size={20} />
      </button>
    </div>
  )
}
