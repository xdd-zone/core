import type { TableProps } from 'antd'
import type { ReactNode } from 'react'

import { Loading } from '@console/components/ui/Loading'
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
} from 'antd'
import { BarChart3, LayoutTemplate, Palette, PanelTop } from 'lucide-react'
import { useEffect, useState } from 'react'

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

interface ShowcaseRow {
  address: string
  age: number
  key: string
  name: string
  status: 'ACTIVE' | 'BANNED' | 'PENDING'
}

interface ShowcasePanelProps {
  description: string
  eyebrow: string
  extra?: ReactNode
  icon: ReactNode
  title: string
  children: ReactNode
}

const tableColumns: TableProps<ShowcaseRow>['columns'] = [
  {
    dataIndex: 'name',
    key: 'name',
    title: '用户',
  },
  {
    dataIndex: 'age',
    key: 'age',
    title: '账号时长',
    render: (value: number) => `${value} 个月`,
  },
  {
    dataIndex: 'address',
    key: 'address',
    title: '来源地区',
  },
  {
    dataIndex: 'status',
    key: 'status',
    title: '状态',
    render: (status: ShowcaseRow['status']) => {
      const config = {
        ACTIVE: { color: 'success', label: '正常' },
        BANNED: { color: 'error', label: '停用' },
        PENDING: { color: 'warning', label: '待处理' },
      }[status]

      return <Tag color={config.color}>{config.label}</Tag>
    },
  },
]

const tableData: ShowcaseRow[] = [
  { address: '上海 · 审核组', age: 32, key: '1', name: '林安', status: 'ACTIVE' },
  { address: '杭州 · 内容组', age: 18, key: '2', name: '周意', status: 'PENDING' },
  { address: '北京 · 运营组', age: 27, key: '3', name: '程野', status: 'BANNED' },
]

const toneSwatches = [
  [
    { className: 'bg-rosewater', label: 'rosewater', textClassName: 'text-white' },
    { className: 'bg-flamingo', label: 'flamingo', textClassName: 'text-white' },
    { className: 'bg-pink', label: 'pink', textClassName: 'text-white' },
    { className: 'bg-mauve', label: 'mauve', textClassName: 'text-white' },
  ],
  [
    { className: 'bg-red', label: 'red', textClassName: 'text-white' },
    { className: 'bg-maroon', label: 'maroon', textClassName: 'text-white' },
    { className: 'bg-peach', label: 'peach', textClassName: 'text-white' },
    { className: 'bg-yellow', label: 'yellow', textClassName: 'text-fg' },
  ],
  [
    { className: 'bg-green', label: 'green', textClassName: 'text-white' },
    { className: 'bg-teal', label: 'teal', textClassName: 'text-white' },
    { className: 'bg-sky', label: 'sky', textClassName: 'text-white' },
    { className: 'bg-blue', label: 'blue', textClassName: 'text-white' },
  ],
  [
    { className: 'bg-sapphire', label: 'sapphire', textClassName: 'text-white' },
    { className: 'bg-lavender', label: 'lavender', textClassName: 'text-white' },
  ],
]

const statusSummary = [
  {
    description: '用于确认当前主题下的信息卡和说明区是否保持轻透层级。',
    title: '表面层级',
    value: '已同步',
  },
  {
    description: '重点检查 Table、Tabs、Alert 这些容易显得厚重的组件。',
    title: '组件状态',
    value: '14 项',
  },
  {
    description: '当前页用于验证 Ant Design 与 Catppuccin 在后台场景里的落地效果。',
    title: '用途',
    value: '示例页',
  },
]

function ShowcasePanel({ children, description, eyebrow, extra, icon, title }: ShowcasePanelProps) {
  return (
    <Card
      className="rounded-[28px] border border-border-subtle shadow-sm backdrop-blur-xs"
      styles={{ body: { padding: 24 } }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
              {icon}
            </div>
            <div>
              <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">{eyebrow}</div>
              <h2 className="text-fg mt-2 text-xl font-semibold tracking-tight">{title}</h2>
              <p className="text-fg-muted mt-2 text-sm leading-7">{description}</p>
            </div>
          </div>
          {extra}
        </div>
        {children}
      </div>
    </Card>
  )
}

/**
 * 加载示例页模拟数据。
 */
async function loadShowcaseData(): Promise<ShowcaseStats> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    message: '当前示例页已切到轻透后台风格。',
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
  const [sliderValue, setSliderValue] = useState(36)
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
      <div className="rounded-[28px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <Alert type="error" description="无法加载示例数据" showIcon />
      </div>
    )
  }

  const timestampLabel = new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(new Date(data.timestamp))

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[32px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-fg-muted text-[11px] font-semibold tracking-[0.2em] uppercase">UI Showcase</div>
              <div className="mt-3 flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                  <LayoutTemplate className="size-5" />
                </div>
                <div>
                  <h1 className="text-fg text-2xl font-semibold tracking-tight">组件与主题</h1>
                  <p className="text-fg-muted mt-2 text-sm leading-7">
                    这里用于确认 Ant Design 在当前 Catppuccin
                    主题下的真实落地效果，重点看轻透表面、信息层级和后台组件的空气感是否统一。
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border-subtle bg-surface-muted/60 p-4 shadow-sm backdrop-blur-xs xl:max-w-sm">
              <div className="text-fg text-sm font-medium">当前状态</div>
              <p className="text-fg-muted mt-2 text-sm leading-6">{data.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-border-subtle bg-overlay-0/25 px-3 py-1 text-xs text-fg-muted">
                  最新同步 {timestampLabel}
                </span>
                <span className="rounded-full border border-border-subtle bg-overlay-0/25 px-3 py-1 text-xs text-fg-muted">
                  适用于后台说明型页面
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {statusSummary.map((item) => (
              <article key={item.title} className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
                <div className="text-fg-muted text-xs">{item.title}</div>
                <div className="text-fg mt-2 text-2xl font-semibold">{item.value}</div>
                <p className="text-fg-muted mt-2 text-xs leading-6">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <ShowcasePanel
          eyebrow="基础交互"
          icon={<PanelTop className="size-5" />}
          title="表单与动作组件"
          description="这一组主要检查页面最常用的输入、筛选和操作组件，看它们在轻透表面里是否还能保持足够清楚的可读性和反馈。"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-border-subtle bg-surface-muted/55 p-5">
              <div className="text-fg text-sm font-medium">筛选与输入</div>
              <p className="text-fg-muted mt-2 text-sm leading-6">
                输入框、下拉框和日期选择器应该和页面外层保持同一套轻透层级。
              </p>
              <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                }}
              >
                <Input placeholder="搜索用户名、邮箱或角色" autoComplete="off" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    defaultValue="lucy"
                    allowClear
                    options={[
                      { value: 'jack', label: 'Jack' },
                      { value: 'lucy', label: 'Lucy' },
                      { value: 'disabled', label: 'Disabled', disabled: true },
                    ]}
                  />
                  <DatePicker className="w-full" />
                </div>
                <Input.Password placeholder="Password" autoComplete="current-password" />
                <Input.TextArea
                  placeholder="这里展示输入区在当前主题下的背景、边框和留白。"
                  rows={3}
                  autoComplete="off"
                />
                <RangePicker className="w-full" />
              </form>
            </div>

            <div className="rounded-3xl border border-border-subtle bg-surface-muted/55 p-5">
              <div className="text-fg text-sm font-medium">按钮与轻反馈</div>
              <p className="text-fg-muted mt-2 text-sm leading-6">
                示例页里也要保留后台气质，主按钮清楚，但不会把整块内容染得很重。
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="primary">Primary</Button>
                <Button>Default</Button>
                <Button type="dashed">Dashed</Button>
                <Button type="text">Text</Button>
                <Button type="link">Link</Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Tag color="magenta">设计令牌</Tag>
                <Tag color="gold">筛选区</Tag>
                <Tag color="green">反馈正常</Tag>
                <Tag color="blue">多主题</Tag>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
                  <div className="text-fg-muted text-xs">透明度预期</div>
                  <div className="mt-3">
                    <Slider value={sliderValue} onChange={setSliderValue} />
                  </div>
                  <div className="text-fg mt-2 text-sm font-medium">{sliderValue}%</div>
                </div>
                <div className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
                  <div className="text-fg-muted text-xs">轻交互状态</div>
                  <div className="mt-4 flex items-center gap-3">
                    <Switch checked={switchValue} onChange={setSwitchValue} />
                    <span className="text-fg text-sm">{switchValue ? '已开启' : '已关闭'}</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Progress percent={44} showInfo={false} strokeColor="var(--color-primary)" />
                    <Progress percent={72} showInfo={false} strokeColor="var(--color-success)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ShowcasePanel>

        <ShowcasePanel
          eyebrow="数据摘要"
          icon={<BarChart3 className="size-5" />}
          title="当前示例数据"
          description="这里用更接近后台真实页面的摘要卡展示数据，让组件页本身也遵循统一的信息节奏。"
        >
          <div className="grid gap-3">
            <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
              <div className="text-fg-muted text-xs">用户数</div>
              <div className="text-primary mt-2 text-3xl font-semibold">{data.stats.users}</div>
              <p className="text-fg-muted mt-2 text-xs leading-6">适合观察数字、标题和说明文字在轻透卡片里的层次。</p>
            </article>
            <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
              <div className="text-fg-muted text-xs">订单数</div>
              <div className="text-success mt-2 text-3xl font-semibold">{data.stats.orders}</div>
              <p className="text-fg-muted mt-2 text-xs leading-6">
                用于确认重点数字被看见，但不会因为颜色过重而抢走整页节奏。
              </p>
            </article>
            <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
              <div className="text-fg-muted text-xs">收入</div>
              <div className="text-warning mt-2 text-3xl font-semibold">¥{data.stats.revenue.toLocaleString()}</div>
              <p className="text-fg-muted mt-2 text-xs leading-6">页面里的强调色只承担信息标记，不铺满整个面板。</p>
            </article>
          </div>
        </ShowcasePanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <ShowcasePanel
          eyebrow="数据表面"
          icon={<LayoutTemplate className="size-5" />}
          title="表格、卡片与标签页"
          description="这组重点看带结构的复合组件。表格根层、表头、排序态和卡片内信息块都应该比普通面板更轻一点。"
        >
          <div className="rounded-3xl border border-border-subtle bg-surface-muted/45 p-4">
            <div className="mb-4 rounded-2xl border border-border-subtle bg-surface/70 px-4 py-3 text-sm text-fg-muted">
              当前表格用于观察轻透背景、表头层级和 hover/selected
              的反馈是否统一，不应该再出现一整块厚重底板压住页面的问题。
            </div>
            <Table columns={tableColumns} dataSource={tableData} pagination={false} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card
              title="默认卡片"
              extra={
                <Button type="link" size="small">
                  查看
                </Button>
              }
              className="h-full rounded-3xl border border-border-subtle shadow-none"
            >
              <p className="text-fg-muted mb-0 text-sm leading-6">
                卡片内容区域保持轻透表面，不需要依赖厚阴影来建立存在感。
              </p>
            </Card>
            <Card
              title="Hover 卡片"
              hoverable
              extra={
                <Button type="link" size="small">
                  查看
                </Button>
              }
              className="h-full rounded-3xl border border-border-subtle shadow-none"
            >
              <p className="text-fg-muted mb-0 text-sm leading-6">
                悬停反馈应该是轻的，重点是提示可点击，不是把整个区域染成重色。
              </p>
            </Card>
            <Card
              actions={[
                <Button key="1" type="text">
                  详情
                </Button>,
                <Button key="2" type="text">
                  操作
                </Button>,
              ]}
              className="h-full rounded-3xl border border-border-subtle shadow-none"
            >
              <Card.Meta title="操作卡片" description="带底部动作的卡片也要保留整洁、稳定的后台气质。" />
            </Card>
          </div>
        </ShowcasePanel>

        <div className="flex flex-col gap-6">
          <ShowcasePanel
            eyebrow="信息切换"
            icon={<PanelTop className="size-5" />}
            title="Tabs 与时间线"
            description="切换类组件主要看边界、间距和内容承接，避免示例页看起来像零散组件拼盘。"
          >
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  children: (
                    <div className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4 text-sm text-fg-muted">
                      当前标签页用于观察内容容器和标题下沿的节奏，保持轻透但清楚。
                    </div>
                  ),
                  key: '1',
                  label: '布局节奏',
                },
                {
                  children: (
                    <div className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4 text-sm text-fg-muted">
                      组件演示区要能直接看出用途，不重复堆很多没有信息量的说明。
                    </div>
                  ),
                  key: '2',
                  label: '说明文字',
                },
                {
                  children: (
                    <div className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4 text-sm text-fg-muted">
                      多主题下保持一致的表面层级，比追求某一套主题下的重装饰更重要。
                    </div>
                  ),
                  key: '3',
                  label: '主题兼容',
                },
              ]}
            />

            <div className="rounded-3xl border border-border-subtle bg-surface-muted/45 p-5">
              <div className="text-fg text-sm font-medium">Timeline 时间轴</div>
              <p className="text-fg-muted mt-2 text-sm leading-6">时间轴用来检查线性信息在轻背景里是否依然容易扫读。</p>
              <div className="mt-4">
                <Timeline
                  items={[
                    { color: 'green', children: '创建示例页结构并接入当前主题' },
                    { color: 'gold', children: '整理表单、表格和标签页的轻透层级' },
                    { color: 'blue', children: '回看语义色与 Catppuccin 色板的落地表现' },
                    { color: 'red', children: '检查过重底板和不统一背景是否被移除' },
                  ]}
                />
              </div>
            </div>
          </ShowcasePanel>

          <ShowcasePanel
            eyebrow="状态提示"
            icon={<BarChart3 className="size-5" />}
            title="Alert 提示反馈"
            description="提示类组件要清楚，但背景和边框仍然要留在同一套后台表面层级里。"
          >
            <div className="space-y-3">
              <Alert type="success" description="当前主题下的成功提示应清楚但不过度发亮。" showIcon />
              <Alert type="info" description="信息提示用于解释当前区块，而不是抢主标题位置。" showIcon />
              <Alert type="warning" description="警告提示保留可见度，同时不把整块区域压成厚重色板。" showIcon />
              <Alert type="error" description="错误提示需要明确，但整页依然保持稳定、克制的后台气质。" showIcon />
            </div>
          </ShowcasePanel>
        </div>
      </div>

      <ShowcasePanel
        eyebrow="设计令牌"
        icon={<Palette className="size-5" />}
        title="Catppuccin 色板与语义层级"
        description="最后一组用来确认当前项目的标准色、文字层级、背景层级和边框层级在示例页里是否都能直接看懂、直接复用。"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="rounded-3xl border border-border-subtle bg-surface-muted/45 p-5">
            <div className="text-fg text-sm font-medium">Catppuccin 标准颜色</div>
            <p className="text-fg-muted mt-2 text-sm leading-6">标准色板保持清楚陈列，但不需要额外装饰来制造存在感。</p>
            <div className="mt-4 space-y-3">
              {toneSwatches.map((row) => (
                <div key={row.map((tone) => tone.label).join('-')} className="grid gap-2 sm:grid-cols-4">
                  {row.map((tone) => (
                    <div
                      key={tone.label}
                      className={`${tone.className} ${tone.textClassName} rounded-2xl px-4 py-4 text-center text-sm font-medium`}
                    >
                      {tone.label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-3xl border border-border-subtle bg-surface/80 p-5 shadow-sm backdrop-blur-xs">
              <div className="text-fg text-sm font-medium">文字层级</div>
              <div className="mt-4 space-y-2">
                <p className="text-fg mb-0 text-base">主要文字用于标题与主要结论</p>
                <p className="text-fg-muted mb-0 text-sm">次要文字用于说明和补充信息</p>
                <p className="text-fg-subtle mb-0 text-xs">提示文字用于标签、时间和辅助信息</p>
              </div>
            </div>

            <div className="rounded-3xl border border-border-subtle bg-surface/80 p-5 shadow-sm backdrop-blur-xs">
              <div className="text-fg text-sm font-medium">背景层级</div>
              <div className="mt-4 space-y-2">
                <div className="rounded-2xl bg-surface px-4 py-3 text-sm font-medium text-fg">surface</div>
                <div className="rounded-2xl bg-surface-muted px-4 py-3 text-sm font-medium text-fg">surface-muted</div>
                <div className="rounded-2xl bg-surface-1 px-4 py-3 text-sm font-medium text-fg">surface-1</div>
                <div className="rounded-2xl bg-surface-elevated px-4 py-3 text-sm font-medium text-fg">elevated</div>
              </div>
            </div>

            <div className="rounded-3xl border border-border-subtle bg-surface/80 p-5 shadow-sm backdrop-blur-xs">
              <div className="text-fg text-sm font-medium">边框层级</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-border px-4 py-3 text-sm font-medium text-fg">border</div>
                <div className="rounded-2xl border border-border-subtle px-4 py-3 text-sm font-medium text-fg">
                  border-subtle
                </div>
                <div className="rounded-2xl border border-border-subtle bg-overlay-0/20 px-4 py-3 text-sm text-fg-muted">
                  轻透背景配合轻边框，用来分层，不用来制造厚重感。
                </div>
              </div>
            </div>
          </div>
        </div>
      </ShowcasePanel>
    </div>
  )
}
