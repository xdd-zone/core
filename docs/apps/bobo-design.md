# Bobo 设计规范

这份文档写 `apps/bobo` 的页面设计规则。改首页、文章页、项目页、搜索页、站点导航、内容组件和全局样式时先看这里。

参考过 [Vercel design.md](https://vercel.com/design.md) 的写法：先把颜色、字号、间距、组件状态写成能检查的规则。Bobo 不照搬 Geist 的字体和颜色，继续使用现有的 Maple Mono 和 Catppuccin 主题。

## 设计上下文

- 目标用户：认识喜东东的技术朋友、潜在合作方、自己回看项目和文章的人。
- 主要场景：看文章、看项目、搜索内容、通过 RSS 或邮箱保持联系。
- 界面气质：克制、个人、偏编辑型，有技术味，但不做冷冰冰的 SaaS 控制台。

Bobo 是个人站点，不是产品官网。页面要让内容先出来，动效和装饰只负责引导阅读，不抢内容。

## 视觉方向

关键词：

- 温和的技术感。
- 像个人笔记和项目陈列，不像后台系统。
- 有一点实验感，但页面仍然好读。

不要做这些风格：

- 不做大面积深色霓虹和紫蓝渐变。
- 不做一屏又一屏的营销区块。
- 不做每个区块都套卡片。
- 不做大图标加标题加说明的重复卡片网格。
- 不为了显得科技感而滥用发光、玻璃、模糊和粒子。

首页可以比其他页面更有动效。文章页和项目详情页要更安静，阅读体验优先。

## 主题和颜色

主题入口固定在：

```text
packages/catppuccin-theme/styles/bobo.css
apps/bobo/app/globals.css
```

页面和组件里优先使用 Tailwind 语义类名：

```text
bg-background
bg-surface
bg-surface-muted
text-fg
text-foreground
text-muted-foreground
border-border
border-border-subtle
```

少量特殊效果可以使用 CSS 变量。只允许放在这些位置：

- `apps/bobo/app/globals.css`
- `apps/bobo/app/styles/**`
- 当前页面里确实只用一次的背景或遮罩

颜色使用规则：

- 背景以 `bg-background` 和 `bg-surface` 为主。
- 文字以 `text-foreground` 为主，辅助信息用 `text-muted-foreground`。
- 强调色只用于链接、焦点、主要按钮、当前状态和少量 hover。
- 同一屏不要同时使用多组渐变。已有 `--color-ld-accent-1` 和 `--color-ld-accent-2` 时，先复用它们。
- 浅色主题用阴影表达层级；深色主题用更亮一点的 surface 表达层级。
- 不直接写 `#000`、`#fff` 和随机 rgba。先看主题里有没有现成变量。

## 字体和排版

Bobo 当前全站字体是 Maple Mono，定义在 `apps/bobo/app/layout.tsx`，Tailwind 映射在 `packages/catppuccin-theme/styles/bobo.css`。

使用规则：

- 正文最小 `1rem`，不要为了塞内容写更小。
- 文章详情正文控制在 `65ch` 左右。
- 长段落行高用 `leading-7` 或接近值。
- 页面标题允许使用 `clamp()`，正文和密集 UI 不使用随屏幕宽度变化的字号。
- 英文标签、日期、分类可以小一号，但要保留足够行高。
- 数字、日期、计数使用等宽数字时，优先加 `tabular-nums`。
- 不新增第二套字体，除非同时说明它用于哪个页面、怎么加载、fallback 是什么。

常用层级：

```text
页面主标题：text-[clamp(2.4rem,8vw,6.5rem)]，只用于首页或详情页顶部
区块标题：text-[clamp(2rem,5vw,3.2rem)]
列表标题：text-lg 到 text-2xl
正文：text-base
辅助文字：text-sm
标签和 metadata：text-xs 到 text-sm
```

不要为了制造“开发者气质”把所有内容都写成代码样式。代码块、变量名、路径和命令才用代码样式。

## 布局和空间

页面主容器优先使用现有写法：

```text
max-w-7xl mx-auto px-[clamp(24px,6vw,80px)]
```

内容型页面可以收窄：

```text
max-w-3xl mx-auto px-[clamp(20px,5vw,48px)]
```

空间规则：

- 移动端从单列开始写，再增加桌面布局。
- section 上下间距用 `py-12`、`py-16`、`py-20` 这一组。
- 同一组内容内部用 `gap`，不要靠一堆 margin 撑开。
- 首页可以使用不等宽网格和轻微错位。
- 文章列表、搜索结果和项目列表要更稳定，优先让标题、摘要、日期好扫。
- 不把 page section 写成大卡片。卡片只用于可点击的项目、文章、预览项或明确独立的内容块。
- 不嵌套卡片。卡片内部用标题、间距、分割线和轻微背景区别层级。

圆角规则沿用 `docs/apps/bobo.md`：

- 大容器：`rounded-xl`。
- 一般卡片：`rounded-lg`。
- 按钮、标签、状态块：`rounded-sm` 或 `rounded-md`。
- `rounded-full` 只给导航胶囊、头像、圆形图标按钮和极少量强调按钮。
- 没有明确设计理由，不新增 `rounded-2xl`、`rounded-3xl`。

## 页面规则

首页：

- 第一屏要直接出现身份、角色和主要入口。
- 可以使用视差、滚动 reveal、滚动提示和大字号。
- 首页装饰只能服务“个人技术站”这个方向，不要放泛用抽象背景。
- 代表项目最多露出 4 个，文章最多露出 4 篇，避免首页变成列表页。

文章列表页：

- 列表项优先显示标题、分类、发布日期和摘要。
- 筛选入口要能键盘访问。
- 没有文章时，说清楚当前分类或搜索条件下没有结果。

文章详情页：

- 正文宽度优先照顾阅读。
- 标题、发布日期、分类和正文之间要有明显间距。
- 代码块、引用、图片、链接卡片使用 `RichContentRenderer` 现有组件。
- 正文里不要塞会分散注意力的大面积动效。

项目页：

- 项目列表可以比文章列表更强调封面。
- 封面图必须能说明项目，不用纯装饰图代替。
- 项目详情要先交代项目是什么、解决什么事、用到什么技术、现在状态如何。

搜索页：

- 搜索框和结果列表优先。
- 空状态要写出当前关键词没有结果。
- 不要用大面积插画占掉主要空间。

## 组件规则

导航：

- 固定导航继续放在 `apps/bobo/app/(site)/_components/site/site-nav.tsx`。
- 胶囊导航是 Bobo 的识别点，保留。
- 移动端菜单必须能关闭、能键盘聚焦，打开后不能让页面背景继续滚动。
- 分类菜单 hover 只是增强，不能作为唯一入口。

按钮和链接：

- 链接文本写目的地，比如“查看项目”“继续阅读”。
- 主要操作一个区域最多一个。
- hover 可以轻微位移或变色，位移不要超过 `-translate-y-1`。
- 所有可交互元素都要有 `focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1` 或同等明显的焦点样式。
- 图标按钮必须有 `aria-label`。

卡片：

- 可点击卡片整体用 `Link`。
- 卡片 hover 使用 transform、border、surface 变化，不动画 width、height、padding、margin。
- 有封面图时必须写准确 `alt`。纯装饰图用空 alt。
- 列表型卡片不要强行做成同高网格。

标签和 metadata：

- 标签用短词，不写整句。
- 日期用同一种格式。中文页面优先用 `zh-CN` 格式化。
- 分类、标签、日期之间用间距和颜色分开，不靠花哨符号。

错误、加载和空状态：

- 加载状态说清楚正在读取什么，比如“正在读取文章”。
- 错误状态说明哪里失败和下一步能做什么。
- 空状态只写事实，不写玩笑。

## 动效

动效文件放在：

```text
apps/bobo/app/globals.css
apps/bobo/app/styles/utilities/animations.css
```

规则：

- 动画只用 `transform` 和 `opacity`。
- hover 反馈控制在 `150ms` 到 `300ms`。
- 页面进入和滚动 reveal 控制在 `500ms` 到 `800ms`。
- 使用 `cubic-bezier(0.23, 1, 0.32, 1)` 或接近的 ease-out 曲线。
- 不使用 bounce、elastic 这类回弹曲线。
- 列表 stagger 要限制总时长，很多项时不要每项都延迟。
- 必须考虑 `prefers-reduced-motion`。减少动效时保留状态变化，不做空间位移。

## 响应式

- 默认从移动端样式开始写。
- 常用断点优先用 `md:` 和 `lg:`，不要为某个具体设备写特殊断点。
- 图片使用 `next/image` 时必须写 `sizes`。
- 交互不要依赖 hover。移动端必须有可见入口。
- 触摸目标至少接近 `44px`。
- 固定底部或顶部区域要考虑 `env(safe-area-inset-*)`。

## 文案

Bobo 默认写中文短句。英文技术名保留原写法。

写法：

- 说明当前页面能做什么。
- 按钮写动作和对象。
- 空状态写当前条件下没有什么。
- 报错写失败位置和下一步。

不要写：

- 空泛宣传语。
- 页面标题已经说过的信息。
- 夸张宣传语。
- 为了活泼而写的错误玩笑。

示例：

```text
继续阅读
查看项目
正在读取文章
这个分类下还没有文章
搜索服务暂时不可用，稍后再试
```

## 代码落点

- 全局字体：`apps/bobo/app/layout.tsx`
- 全局样式入口：`apps/bobo/app/globals.css`
- 基础样式：`apps/bobo/app/styles/base/reset.css`
- 动画工具类：`apps/bobo/app/styles/utilities/animations.css`
- 主题 token：`packages/catppuccin-theme/styles/bobo.css`
- 站点导航：`apps/bobo/app/(site)/_components/site`
- 首页交互：`apps/bobo/app/(site)/_components/home`
- 内容渲染：`apps/bobo/components/content/rich-content-renderer`
- 复用 UI：`apps/bobo/components`

新页面先写在对应 route 的 `page.tsx`。确认复用后，再把组件移到 `apps/bobo/components` 或当前 route 的 `_components`。

## 检查清单

改 Bobo 页面或样式后，至少检查这些点：

- 页面能在移动端单列阅读。
- 主要操作能键盘聚焦。
- hover 不是唯一入口。
- 深色和浅色主题都能看清正文、边框和按钮。
- 图片有合适的 `alt`。
- 文案没有重复页面标题。
- 没有新增无理由的大圆角、发光和玻璃效果。

能跑命令时，在仓库根目录执行：

```bash
pnpm lint:bobo
pnpm type-check:bobo
```
