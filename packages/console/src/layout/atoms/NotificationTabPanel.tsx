import { Avatar, Button, Empty } from 'antd'
import React from 'react'

export interface NotificationItem {
  avatar?: string
  datetime: string
  extra?: React.ReactNode
  icon?: React.ReactNode
  id: string
  title: React.ReactNode
}

interface NotificationTabPanelProps {
  emptyDescription?: string
  items: NotificationItem[]
  showViewAll?: boolean
}

export function NotificationTabPanel({
  emptyDescription = '暂无数据',
  items,
  showViewAll = true,
}: NotificationTabPanelProps) {
  const content =
    items.length === 0 ? (
      <div className="py-8">
        <Empty description={emptyDescription} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    ) : (
      <div className="grow">
        {items.map((item) => (
          <div key={item.id} className="hover:bg-primary/10 flex cursor-pointer items-center rounded p-3">
            <div className="mr-4">{item.avatar ? <Avatar src={item.avatar} /> : item.icon}</div>
            <div className="flex flex-col">
              <div className="text-fg text-sm">{item.title}</div>
              <div className="text-fg-muted mt-1 text-xs">{item.datetime}</div>
            </div>
            {item.extra && <div className="ml-auto">{item.extra}</div>}
          </div>
        ))}
      </div>
    )

  return (
    <div className="flex h-75 w-75 flex-col">
      <div className="grow overflow-auto">{content}</div>
      {showViewAll && (
        <div className="p-2">
          <Button type={items.length > 0 ? 'primary' : 'default'} block>
            查看全部
          </Button>
        </div>
      )}
    </div>
  )
}
