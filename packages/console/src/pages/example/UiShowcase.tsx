import {
  Alert,
  Button,
  Card,
  DatePicker,
  Input,
  Progress,
  Select,
  Slider,
  Switch,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd'
import { useEffect, useState } from 'react'

import { Loading } from '@/components/ui/Loading'

const { Paragraph, Text, Title } = Typography
const { RangePicker } = DatePicker

interface ShowcaseStats {
  message: string
  stats: {
    orders: number
    revenue: number
    users: number
  }
  timestamp: string
}

const tableColumns = [
  {
    dataIndex: 'name',
    key: 'name',
    title: 'Name',
  },
  {
    dataIndex: 'age',
    key: 'age',
    title: 'Age',
  },
  {
    dataIndex: 'address',
    key: 'address',
    title: 'Address',
  },
  {
    key: 'status',
    render: (_: unknown, record: { status: string }) => {
      const colors: Record<string, string> = {
        Active: 'green',
        Banned: 'red',
        Pending: 'gold',
      }

      return <Tag color={colors[record.status]}>{record.status}</Tag>
    },
    title: 'Status',
  },
]

const tableData = [
  { address: 'New York No. 1 Lake Park', age: 32, key: '1', name: 'John Brown', status: 'Active' },
  { address: 'London No. 1 Lake Park', age: 42, key: '2', name: 'Jim Green', status: 'Pending' },
  { address: 'Sidney No. 1 Lake Park', age: 32, key: '3', name: 'Joe Black', status: 'Banned' },
]

/**
 * 加载示例页模拟数据。
 */
async function loadShowcaseData(): Promise<ShowcaseStats> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    message: 'UI Showcase loaded successfully!',
    stats: {
      orders: 567,
      revenue: 89012,
      users: 1234,
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Ant Design 与 Catppuccin 展示页。
 */
export function UiShowcase() {
  const [data, setData] = useState<ShowcaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sliderValue, setSliderValue] = useState(30)
  const [switchValue, setSwitchValue] = useState(true)

  useEffect(() => {
    loadShowcaseData()
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch((error) => {
        console.error('加载示例数据失败:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <Loading />
  }

  if (!data) {
    return (
      <div className="bg-surface-elevated m-4 rounded-lg p-4 backdrop-blur-sm">
        <Alert type="error" description="无法加载示例数据" showIcon />
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-lg p-6 space-y-12">
      {/* 页面引言 */}
      <div className="pb-8 border-b border-border-subtle">
        <Title level={2} className="mb-3">组件与主题</Title>
        <Paragraph className="text-fg-muted mb-0 text-base">
          这里集中展示 Ant Design 在当前项目主题下的基础表现，以及 Catppuccin 语义色和标准色板的落地效果。
        </Paragraph>
      </div>

      {/* 第一组：基础组件 */}
      <section className="space-y-6">
        <Title level={4} className="text-fg-muted">基础组件</Title>

        <div className="grid gap-6">
          {/* 按钮 */}
          <Card>
            <div className="space-y-3">
              <Text className="text-fg-muted text-sm">Button 按钮</Text>
              <div className="flex flex-wrap gap-3">
                <Button type="primary">Primary</Button>
                <Button>Default</Button>
                <Button type="dashed">Dashed</Button>
                <Button type="text">Text</Button>
                <Button type="link">Link</Button>
              </div>
            </div>
          </Card>

          {/* 标签 + 进度条 并排 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">Tag 标签</Text>
                <div className="flex flex-wrap gap-2">
                  <Tag color="magenta">magenta</Tag>
                  <Tag color="red">red</Tag>
                  <Tag color="volcano">volcano</Tag>
                  <Tag color="orange">orange</Tag>
                  <Tag color="gold">gold</Tag>
                  <Tag color="green">green</Tag>
                  <Tag color="cyan">cyan</Tag>
                  <Tag color="blue">blue</Tag>
                  <Tag color="purple">purple</Tag>
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">Progress 进度条</Text>
                <div className="space-y-3">
                  <Progress percent={30} />
                  <Progress percent={70} status="active" />
                  <Progress percent={100} />
                  <Progress percent={50} status="exception" />
                </div>
              </div>
            </Card>
          </div>

          {/* 滑块 + 开关 并排 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">Slider 滑块</Text>
                <Slider value={sliderValue} onChange={setSliderValue} />
                <Text className="text-fg-muted text-sm">当前值: {sliderValue}</Text>
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">Switch 开关</Text>
                <div className="flex items-center gap-4">
                  <Switch checked={switchValue} onChange={setSwitchValue} />
                  <Text className="text-fg">{switchValue ? '开启' : '关闭'}</Text>
                </div>
              </div>
            </Card>
          </div>

          {/* 输入类 */}
          <Card>
            <div className="space-y-3">
              <Text className="text-fg-muted text-sm">Input 输入框</Text>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                }}
              >
                <div className="flex flex-wrap gap-4">
                  <Input placeholder="Basic usage" style={{ width: 180 }} autoComplete="off" />
                  <Input.Password placeholder="Password" style={{ width: 180 }} autoComplete="current-password" />
                </div>
                <Input.TextArea placeholder="TextArea" style={{ width: 300 }} rows={2} autoComplete="off" />
              </form>
            </div>
          </Card>

          {/* 选择器 + 日期选择器 并排 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">Select 选择器</Text>
                <Select
                  defaultValue="lucy"
                  style={{ width: 140 }}
                  allowClear
                  options={[
                    { value: 'jack', label: 'Jack' },
                    { value: 'lucy', label: 'Lucy' },
                    { value: 'disabled', label: 'Disabled', disabled: true },
                  ]}
                />
                <Select
                  defaultValue="lucy"
                  disabled
                  style={{ width: 140 }}
                  options={[{ value: 'lucy', label: 'Lucy' }]}
                />
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">DatePicker 日期选择器</Text>
                <DatePicker />
                <RangePicker />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 第二组：复合组件 */}
      <section className="space-y-6">
        <Title level={4} className="text-fg-muted">复合组件</Title>

        <div className="grid gap-6">
          <Card>
            <div className="space-y-3">
              <Text className="text-fg-muted text-sm">Table 表格</Text>
              <Table columns={tableColumns} dataSource={tableData} pagination={false} />
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <Text className="text-fg-muted text-sm">Card 卡片</Text>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card title="Default Card" extra={<Button type="link" size="small">More</Button>}>
                  <Paragraph className="text-fg-muted mb-0">卡片内容区域，展示一般性描述文字。</Paragraph>
                </Card>
                <Card title="Hover Card" hoverable extra={<Button type="link" size="small">More</Button>}>
                  <Paragraph className="text-fg-muted mb-0">可悬停的卡片，交互效果更丰富。</Paragraph>
                </Card>
                <Card actions={[<Button key="1">Action</Button>, <Button key="2">Action</Button>]}>
                  <Card.Meta title="Action Card" description="底部带有操作按钮的卡片" />
                </Card>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <Text className="text-fg-muted text-sm">Tabs 标签页</Text>
              <Tabs
                defaultActiveKey="1"
                items={[
                  {
                    children: <Paragraph className="text-fg mb-0">标签页内容 1 - 这里是第一个标签的内容</Paragraph>,
                    key: '1',
                    label: 'Tab 1',
                  },
                  {
                    children: <Paragraph className="text-fg mb-0">标签页内容 2 - 这里是第二个标签的内容</Paragraph>,
                    key: '2',
                    label: 'Tab 2',
                  },
                  {
                    children: <Paragraph className="text-fg mb-0">标签页内容 3 - 这里是第三个标签的内容</Paragraph>,
                    key: '3',
                    label: 'Tab 3',
                  },
                ]}
              />
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">Timeline 时间轴</Text>
                <Timeline
                  items={[
                    { color: 'green', content: 'Create a services site 2025-01-01' },
                    { color: 'gold', content: 'Solve initial network problems 2025-01-02' },
                    { color: 'blue', content: 'Technical testing 2025-01-03' },
                    { color: 'red', content: 'Network problems being solved 2025-01-04' },
                  ]}
                />
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">Alert 警告提示</Text>
                <div className="space-y-3">
                  <Alert type="success" description="Success Text" showIcon />
                  <Alert type="info" description="Info Text" showIcon />
                  <Alert type="warning" description="Warning Text" showIcon />
                  <Alert type="error" description="Error Text" showIcon />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 第三组：数据统计 */}
      <section className="space-y-6">
        <Title level={4} className="text-fg-muted">数据统计</Title>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <div className="text-center py-2">
              <Text className="text-primary text-4xl font-bold">{data.stats.users}</Text>
              <Paragraph className="text-fg-muted mt-2 mb-0">用户数</Paragraph>
            </div>
          </Card>
          <Card>
            <div className="text-center py-2">
              <Text className="text-success text-4xl font-bold">{data.stats.orders}</Text>
              <Paragraph className="text-fg-muted mt-2 mb-0">订单数</Paragraph>
            </div>
          </Card>
          <Card>
            <div className="text-center py-2">
              <Text className="text-warning text-4xl font-bold">¥{data.stats.revenue.toLocaleString()}</Text>
              <Paragraph className="text-fg-muted mt-2 mb-0">收入</Paragraph>
            </div>
          </Card>
        </div>
      </section>

      {/* 第四组：设计令牌 */}
      <section className="space-y-6">
        <Title level={4} className="text-fg-muted">设计令牌</Title>

        <div className="grid gap-6">
          {/* Catppuccin 标准色 - 渐进式布局 */}
          <Card>
            <div className="space-y-4">
              <Text className="text-fg-muted text-sm">Catppuccin 标准颜色</Text>
              <div className="space-y-4">
                {/* 第一行：暖色系 */}
                <div className="flex gap-2">
                  <div className="bg-rosewater flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">rosewater</div>
                  <div className="bg-flamingo flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">flamingo</div>
                  <div className="bg-pink flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">pink</div>
                  <div className="bg-mauve flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">mauve</div>
                </div>
                {/* 第二行：红橙黄 */}
                <div className="flex gap-2">
                  <div className="bg-red flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">red</div>
                  <div className="bg-maroon flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">maroon</div>
                  <div className="bg-peach flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">peach</div>
                  <div className="bg-yellow flex-1 rounded-lg p-4 text-center text-sm font-medium">yellow</div>
                </div>
                {/* 第三行：绿青蓝 */}
                <div className="flex gap-2">
                  <div className="bg-green flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">green</div>
                  <div className="bg-teal flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">teal</div>
                  <div className="bg-sky flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">sky</div>
                  <div className="bg-blue flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">blue</div>
                </div>
                {/* 第四行：蓝紫 */}
                <div className="flex gap-2">
                  <div className="bg-sapphire flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">sapphire</div>
                  <div className="bg-lavender flex-1 rounded-lg p-4 text-center text-white font-medium text-sm">lavender</div>
                  <div className="flex-1" />
                  <div className="flex-1" />
                </div>
              </div>
            </div>
          </Card>

          {/* 文字 + 背景 + 边框 三列布局 */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">文字颜色层级</Text>
                <div className="bg-surface-muted rounded-lg p-4 space-y-2">
                  <p className="text-fg text-base mb-0">主要文字</p>
                  <p className="text-fg-muted text-sm mb-0">次要文字</p>
                  <p className="text-fg-subtle text-xs mb-0">提示文字</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">背景颜色层级</Text>
                <div className="space-y-2">
                  <div className="bg-surface rounded-lg p-3">
                    <Text className="font-medium text-sm">surface</Text>
                  </div>
                  <div className="bg-surface-muted rounded-lg p-3">
                    <Text className="font-medium text-sm">surface-muted</Text>
                  </div>
                  <div className="bg-surface-1 rounded-lg p-3">
                    <Text className="font-medium text-sm">surface-1</Text>
                  </div>
                  <div className="bg-surface-elevated rounded-lg p-3">
                    <Text className="font-medium text-sm">elevated</Text>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <Text className="text-fg-muted text-sm">边框颜色</Text>
                <div className="space-y-2">
                  <div className="rounded-lg border border-border p-3">
                    <Text className="font-medium text-sm">border</Text>
                  </div>
                  <div className="rounded-lg border border-border-subtle p-3">
                    <Text className="font-medium text-sm">border-subtle</Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
