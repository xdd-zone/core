import { NotificationTabPanel } from './NotificationTabPanel'

const messageData = [
  {
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    datetime: '2021-2-26 23:50',
    id: '1',
    title: '池不胖 关注了你',
  },
  {
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    datetime: '2021-2-21 8:05',
    id: '2',
    title: '唐不苦 关注了你',
  },
  {
    avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
    datetime: '2020-1-17 21:12',
    id: '3',
    title: '中小鱼 关注了你',
  },
  {
    avatar: 'https://i.pravatar.cc/150?u=a048581f4e29026701d',
    datetime: '2021-01-14 0:20',
    id: '4',
    title: '何小荷 关注了你',
  },
  {
    avatar: 'https://i.pravatar.cc/150?u=a092581f4e29026701d',
    datetime: '2020-12-20 0:15',
    id: '5',
    title: '許許渝 关注了你',
  },
]

export function MessageList() {
  return <NotificationTabPanel items={messageData} />
}
