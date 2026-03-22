import { Popover, Tabs } from 'antd'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResponsiveTooltip } from '@/components/ui'
import { useMobile } from '@/hooks/useMobile'

import { MessageList } from './MessageList'
import { NotificationList } from './NotificationList'
import { TodoList } from './TodoList'

interface NotificationButtonProps {
  className?: string
  onClick?: () => void
}

const items = [
  {
    children: <NotificationList />,
    key: '1',
    label: '通知 (6)',
  },
  {
    children: <MessageList />,
    key: '2',
    label: '消息 (6)',
  },
  {
    children: <TodoList />,
    key: '3',
    label: '待办 (0)',
  },
]

/**
 * 通知按钮原子组件
 */
export function NotificationButton({ className, onClick }: NotificationButtonProps) {
  const { t } = useTranslation()
  const isMobile = useMobile()

  const notificationContent = <Tabs defaultActiveKey="1" items={items} />

  const bellIcon = (
    <div
      onClick={onClick}
      className={`guide-notification hover:text-primary cursor-pointer transition-colors ${className || ''}`}
    >
      <Bell size={20} />
    </div>
  )

  return (
    <Popover content={notificationContent} title="通知" trigger="click">
      {isMobile ? bellIcon : <ResponsiveTooltip title={t('tooltip.notification')}>{bellIcon}</ResponsiveTooltip>}
    </Popover>
  )
}
