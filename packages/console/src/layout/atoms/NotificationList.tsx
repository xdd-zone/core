import { Bell, Heart, Mail, MessageSquare, UserPlus } from 'lucide-react'

import { NotificationTabPanel } from './NotificationTabPanel'

const notificationData = [
  {
    datetime: '2024-6-13 0:10',
    icon: <Bell size={24} className="text-blue" />,
    id: '1',
    title: '新增国际化',
  },
  {
    datetime: '2024-4-21 8:05',
    icon: <MessageSquare size={24} className="text-green" />,
    id: '2',
    title: '喜东东给你发了一条消息',
  },
  {
    datetime: '2020-3-17 21:12',
    icon: <Heart size={24} className="text-red" />,
    id: '3',
    title: '大东烟关注了你',
  },
  {
    datetime: '2024-02-14 0:20',
    icon: <UserPlus size={24} className="text-blue" />,
    id: '4',
    title: '新增使用文档',
  },
  {
    datetime: '2024-1-20 0:15',
    icon: <Mail size={24} className="text-yellow" />,
    id: '5',
    title: '夜莲给你发了一封邮件',
  },
]

export function NotificationList() {
  return <NotificationTabPanel items={notificationData} />
}
