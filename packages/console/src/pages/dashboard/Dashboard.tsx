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

// 定义数据类型
interface DashboardStats {
  message: string
  stats: {
    orders: number
    revenue: number
    users: number
  }
  timestamp: string
}

// 模拟异步数据加载
async function loadDashboardData(): Promise<DashboardStats> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    message: 'Dashboard loaded successfully!',
    stats: {
      orders: 567,
      revenue: 89012,
      users: 1234,
    },
    timestamp: new Date().toISOString(),
  }
}

// 表格数据
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

export function Dashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sliderValue, setSliderValue] = useState(30)
  const [switchValue, setSwitchValue] = useState(true)

  useEffect(() => {
    loadDashboardData()
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch((error) => {
        console.error('加载数据失败:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <Loading />
  }

  if (!data) {
    return (
      <div className="bg-surface-elevated m-4 rounded-lg p-4 backdrop-blur-sm">
        <Alert type="error" description="无法加载 Dashboard 数据" showIcon />
      </div>
    )
  }

  return (
    <div className="bg-surface gap-y-8 rounded-lg p-6">
      <Title level={2}>Catppuccin 主题测试面板</Title>

      {/* ========== 1. 按钮组件 ========== */}
      <section>
        <Title level={4}>Button 按钮</Title>
        <div className="flex flex-wrap gap-4">
          <Button type="primary">Primary</Button>
          <Button>Default</Button>
          <Button type="dashed">Dashed</Button>
          <Button type="text">Text</Button>
          <Button type="link">Link</Button>
        </div>
      </section>

      {/* ========== 2. 标签组件 ========== */}
      <section>
        <Title level={4}>Tag 标签</Title>
        <div className="flex flex-wrap gap-2">
          <Tag color="magenta">magenta</Tag>
          <Tag color="red">red</Tag>
          <Tag color="volcano">volcano</Tag>
          <Tag color="orange">orange</Tag>
          <Tag color="gold">gold</Tag>
          <Tag color="lime">lime</Tag>
          <Tag color="green">green</Tag>
          <Tag color="cyan">cyan</Tag>
          <Tag color="blue">blue</Tag>
          <Tag color="geekblue">geekblue</Tag>
          <Tag color="purple">purple</Tag>
        </div>
      </section>

      {/* ========== 3. 进度条 ========== */}
      <section>
        <Title level={4}>Progress 进度条</Title>
        <div className="gap-y-4">
          <Progress percent={30} />
          <Progress percent={70} status="active" />
          <Progress percent={100} />
          <Progress percent={50} status="exception" />
        </div>
      </section>

      {/* ========== 4. 滑块 ========== */}
      <section>
        <Title level={4}>Slider 滑块</Title>
        <div className="w-64">
          <Slider value={sliderValue} onChange={setSliderValue} />
          <Text className="text-fg-muted">值: {sliderValue}</Text>
        </div>
      </section>

      {/* ========== 5. 开关 ========== */}
      <section>
        <Title level={4}>Switch 开关</Title>
        <div className="flex items-center gap-4">
          <Switch checked={switchValue} onChange={setSwitchValue} />
          <Text className="text-fg">{switchValue ? '开启' : '关闭'}</Text>
        </div>
      </section>

      {/* ========== 6. 输入框 ========== */}
      <section>
        <Title level={4}>Input 输入框</Title>
        <div className="flex flex-wrap gap-4">
          <Input placeholder="Basic usage" style={{ width: 200 }} />
          <Input.Password placeholder="Password input" style={{ width: 200 }} />
          <Input.TextArea placeholder="TextArea" style={{ width: 300 }} rows={2} />
        </div>
      </section>

      {/* ========== 7. 选择器 ========== */}
      <section>
        <Title level={4}>Select 选择器</Title>
        <div className="flex flex-wrap gap-4">
          <Select defaultValue="lucy" style={{ width: 120 }} allowClear>
            <Select.Option value="jack">Jack</Select.Option>
            <Select.Option value="lucy">Lucy</Select.Option>
            <Select.Option value="disabled">Disabled</Select.Option>
            <Select.Option value="yiminghe">yiminghe</Select.Option>
          </Select>
          <Select defaultValue="lucy" disabled style={{ width: 120 }}>
            <Select.Option value="lucy">Lucy</Select.Option>
          </Select>
        </div>
      </section>

      {/* ========== 8. 日期选择器 ========== */}
      <section>
        <Title level={4}>DatePicker 日期选择器</Title>
        <div className="flex flex-wrap gap-4">
          <DatePicker />
          <RangePicker />
        </div>
      </section>

      {/* ========== 9. 表格 ========== */}
      <section>
        <Title level={4}>Table 表格</Title>
        <Table columns={tableColumns} dataSource={tableData} pagination={false} />
      </section>

      {/* ========== 10. 卡片 ========== */}
      <section>
        <Title level={4}>Card 卡片</Title>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card title="Default Card" extra={<Button type="link">More</Button>}>
            <Paragraph className="text-fg-muted">卡片内容区域，展示一般性描述文字。</Paragraph>
          </Card>
          <Card title="Hover Card" hoverable extra={<Button type="link">More</Button>}>
            <Paragraph className="text-fg-muted">可悬停的卡片，交互效果更丰富。</Paragraph>
          </Card>
          <Card actions={[<Button key="1">Action</Button>, <Button key="2">Action</Button>]}>
            <Card.Meta title="Action Card" description="底部带有操作按钮的卡片" />
          </Card>
        </div>
      </section>

      {/* ========== 11. 标签页 ========== */}
      <section>
        <Title level={4}>Tabs 标签页</Title>
        <Card>
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                children: <Paragraph className="text-fg">标签页内容 1 - 这里是第一个标签的内容</Paragraph>,
                key: '1',
                label: 'Tab 1',
              },
              {
                children: <Paragraph className="text-fg">标签页内容 2 - 这里是第二个标签的内容</Paragraph>,
                key: '2',
                label: 'Tab 2',
              },
              {
                children: <Paragraph className="text-fg">标签页内容 3 - 这里是第三个标签的内容</Paragraph>,
                key: '3',
                label: 'Tab 3',
              },
            ]}
          />
        </Card>
      </section>

      {/* ========== 12. 时间轴 ========== */}
      <section>
        <Title level={4}>Timeline 时间轴</Title>
        <Timeline
          items={[
            { color: 'green', content: 'Create a services site 2025-01-01' },
            { color: 'gold', content: 'Solve initial network problems 2025-01-02' },
            { color: 'blue', content: 'Technical testing 2025-01-03' },
            { color: 'red', content: 'Network problems being solved 2025-01-04' },
          ]}
        />
      </section>

      {/* ========== 13. 警告提示 ========== */}
      <section>
        <Title level={4}>Alert 警告提示</Title>
        <div className="flex flex-col gap-2">
          <Alert type="success" description="Success Text" showIcon />
          <Alert type="info" description="Info Text" showIcon />
          <Alert type="warning" description="Warning Text" showIcon />
          <Alert type="error" description="Error Text" showIcon />
        </div>
      </section>

      {/* ========== 14. 统计卡片 ========== */}
      <section>
        <Title level={4}>Dashboard 统计数据</Title>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <div className="text-center">
              <Text className="text-primary text-3xl font-bold">{data.stats.users}</Text>
              <Paragraph className="text-fg-muted mt-2">用户数</Paragraph>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Text className="text-success text-3xl font-bold">{data.stats.orders}</Text>
              <Paragraph className="text-fg-muted mt-2">订单数</Paragraph>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Text className="text-warning text-3xl font-bold">¥{data.stats.revenue.toLocaleString()}</Text>
              <Paragraph className="text-fg-muted mt-2">收入</Paragraph>
            </div>
          </Card>
        </div>
      </section>

      {/* ========== Catppuccin 标准颜色 ========== */}
      <section>
        <Title level={4}>Catppuccin 标准颜色</Title>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <div className="bg-rosewater rounded-lg p-3 text-center text-white shadow-sm">rosewater</div>
          <div className="bg-flamingo rounded-lg p-3 text-center text-white shadow-sm">flamingo</div>
          <div className="bg-pink rounded-lg p-3 text-center text-white shadow-sm">pink</div>
          <div className="bg-mauve rounded-lg p-3 text-center text-white shadow-sm">mauve</div>
          <div className="bg-red rounded-lg p-3 text-center text-white shadow-sm">red</div>
          <div className="bg-maroon rounded-lg p-3 text-center text-white shadow-sm">maroon</div>
          <div className="bg-peach rounded-lg p-3 text-center text-white shadow-sm">peach</div>
          <div className="bg-yellow text-yellow rounded-lg p-3 text-center shadow-sm">yellow</div>
          <div className="bg-green rounded-lg p-3 text-center text-white shadow-sm">green</div>
          <div className="bg-teal rounded-lg p-3 text-center text-white shadow-sm">teal</div>
          <div className="bg-sky rounded-lg p-3 text-center text-white shadow-sm">sky</div>
          <div className="bg-blue rounded-lg p-3 text-center text-white shadow-sm">blue</div>
          <div className="bg-sapphire rounded-lg p-3 text-center text-white shadow-sm">sapphire</div>
          <div className="bg-lavender rounded-lg p-3 text-center text-white shadow-sm">lavender</div>
        </div>
      </section>

      {/* ========== 文字颜色层级 ========== */}
      <section>
        <Title level={4}>文字颜色层级</Title>
        <div className="bg-surface-muted gap-y-3 rounded-lg p-6">
          <p className="text-fg text-lg">主要文字 (text-fg) - 用于正文内容</p>
          <p className="text-fg-muted text-base">次要文字 (text-fg-muted) - 用于辅助说明</p>
          <p className="text-fg-subtle text-sm">提示文字 (text-fg-subtle) - 用于标签和小型提示</p>
        </div>
      </section>

      {/* ========== 背景颜色层级 ========== */}
      <section>
        <Title level={4}>背景颜色层级</Title>
        <div className="gap-y-3">
          <div className="bg-surface rounded-lg p-4">
            <Text className="font-medium">主背景 (bg-surface)</Text>
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <Text className="font-medium">次级背景 (bg-surface-muted)</Text>
          </div>
          <div className="bg-surface-1 rounded-lg p-4">
            <Text className="font-medium">三级背景 (bg-surface-1)</Text>
          </div>
          <div className="bg-surface-elevated rounded-lg p-4">
            <Text className="font-medium">悬浮背景 (bg-surface-elevated)</Text>
          </div>
        </div>
      </section>

      {/* ========== 边框颜色 ========== */}
      <section>
        <Title level={4}>边框颜色</Title>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <Text className="font-medium">默认边框 (border)</Text>
          </div>
          <div className="border-subtle rounded-lg border p-4">
            <Text className="font-medium">细边框 (border-subtle)</Text>
          </div>
        </div>
      </section>
    </div>
  )
}
