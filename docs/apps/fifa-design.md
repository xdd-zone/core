# Fifa 设计规范

这份文档写 `apps/fifa` 的页面设计规则。改控制台布局、导航、列表、表单、详情页、空状态和全局样式时先看这里。

文档结构和 `docs/apps/bobo-design.md` 保持一致：先写设计上下文，再写主题、排版、布局、组件、动效和检查项。Fifa 是后台控制台，不按 Bobo 的个人站点风格做页面。

## 设计上下文

- 目标用户：后台管理员，主要用来管理个人站点内容、站点配置、项目、公开资料和系统设置。
- 主要场景：写文章、管素材、改站点信息、管理项目、配置 LLM、查看当前账号状态。
- 界面气质：克制、清楚、安静、有秩序。重点是操作效率，不是视觉表演。

Fifa 是控制台，不是展示站。页面要先回答三件事：

1. 这页能做什么。
2. 当前结果是什么。
3. 下一步点哪里。

## 视觉方向

关键词：

- 安静的管理界面。
- 信息密度比 Bobo 高，但不能挤。
- 页面重点落在表格、表单、操作反馈和当前状态。

不要做这些风格：

- 不做欢迎页风格的大首页。
- 不做一堆没有真实数据的统计卡。
- 不做重渐变、发光、玻璃和模糊效果。
- 不靠大图标和大标题撑页面。
- 不把后台页面做成个人站点或营销页。

当前首页是入口型首页。没有真实业务数据时，不做趋势图、假统计卡和大欢迎区。

## 主题和颜色

主题入口固定在：

```text
packages/catppuccin-theme/styles/fifa.css
apps/fifa/src/assets/styles/index.css
apps/fifa/src/utils/catppuccin.antd.ts
```

页面和组件里优先使用 Tailwind 语义类名：

```text
bg-surface
bg-surface-muted
bg-surface-subtle
text-fg
text-fg-muted
border-border
border-border-subtle
text-primary
text-success
text-warning
text-info
text-danger
```

颜色使用规则：

- 颜色主要用来表达层级和状态。
- 主色只用于主要操作、当前菜单、焦点和少量强调信息。
- 同一种状态在不同页面保持一样：成功用 `success`，警告用 `warning`，失败用 `danger`。
- 不在页面里临时写死一套颜色。
- Ant Design 主题从 `getAntdThemeConfig()` 来，页面不要自己拼 token。
- 暗色主题通过现有变量切换，不单独维护另一套页面写法。

Fifa 可以有轻微背景纹理，但只能作为底层背景。表格、表单和正文不能被背景抢掉注意力。

## 字体和排版

Fifa 是后台，字号要稳定。正文和密集 UI 不使用随屏幕宽度变化的字号。

常用层级：

```text
页面标题：text-xl 到 text-2xl
区块标题：text-base 到 text-lg
表格表头：text-xs，允许 uppercase
正文和表单：text-sm 到 text-base
辅助说明：text-xs 到 text-sm
```

使用规则：

- 页面标题短，优先用名词，比如“文章列表”“站点配置”“LLM 配置”。
- 说明文字一行能说清就不要写成段落。
- 表格里的日期、数量、状态计数优先使用 `tabular-nums`。
- 不为了开发者气质把普通说明写成代码样式。
- 路径、环境变量、命令和字段名才使用代码样式。

## 布局和空间

主要布局入口：

```text
apps/fifa/src/layout/RootLayout.tsx
apps/fifa/src/layout/layouts/TopBottomLayout.tsx
apps/fifa/src/assets/styles/components/layout.css
```

页面内容容器默认使用当前布局：

```text
guide-content
guide-content-inner
guide-content-inner--full
```

空间规则：

- 顶部区域要轻，不能抢表格和表单。
- 页面主体直接服务当前操作。
- 列表页：标题、短说明、摘要标签、筛选区、表格。
- 编辑页：标题、当前对象摘要、表单。
- 详情页：标题、当前对象摘要、详情区、操作区。
- 自助页：标题、摘要标签、结果区。
- 主内容已经明确时，不额外塞说明块。

卡片使用规则：

- 卡片只用于独立模块、表单分组、结果区和可点击入口。
- 不嵌套卡片。
- 表格不要塞进厚重装饰卡片里。表格外层可以有轻边框和浅背景。
- 页面 section 不要都做成浮动卡片。

圆角规则：

- 页面头部、表单分组、表格容器用 `rounded-xl` 或 Ant Design 当前 card 圆角。
- 按钮、输入框、标签、状态块用较小圆角。
- `rounded-full` 只给小标签、头像、圆形图标按钮和少量胶囊操作。
- 新增样式时不要继续扩大大圆角。

## 页面规则

首页：

- 先显示当前账号、可访问入口和当前服务状态。
- 没有真实数据时，不补假图表。
- 常用入口要能直接跳到具体页面。

列表页：

- 表格和筛选是主角。
- 筛选项先回答“怎么缩小范围”。
- 表格回答“当前有哪些结果”。
- 顶部只放标题、一句短说明、右侧摘要标签或主要操作。
- 不在表格上方堆解释。

编辑页：

- 先显示当前对象的关键信息。
- 表单标签已经说清的内容，不重复写说明。
- 保存、发布、归档、删除等操作要有清楚的状态反馈。
- 高风险操作不要和普通保存按钮挤在一起。

详情页：

- 先给关键信息，再给详细信息。
- 操作区放在用户自然会找的位置，别藏到长内容后面。
- 如果详情内容很多，优先分组，不用嵌套卡片。

登录页：

- 只放登录所需字段和必要提示。
- 错误提示写清失败原因和下一步。
- 不写欢迎词堆气氛。

示例页：

- 示例页可以展示组件能力，但不能影响真实业务页面的设计方向。
- 临时样式不要复制到业务页面。

## 组件规则

Ant Design：

- 优先复用 Ant Design 组件，再用 Tailwind 语义类收样式。
- 表单使用 Ant Design 的 label、校验、错误提示和 disabled 状态。
- 表格使用 Ant Design 的排序、分页、加载和空状态。
- Dropdown、Select、Picker 的样式从全局 Ant Design 覆盖里走。

页面头部：

- 统一优先用 `FifaPageHeader`。
- 默认只放页面标题、一句短说明、摘要标签和右侧操作。
- 不放眉题。
- 不在标题左侧放大图标。
- 不写“欢迎回来”“一目了然”这类气氛文案。

导航：

- 菜单从 `apps/fifa/src/app/navigation/navigation.ts` 生成。
- 当前菜单状态要清楚，但 hover 和选中反馈要轻。
- 移动端菜单必须能关闭，打开后不要让背景滚动。
- 图标只用于菜单、操作和局部语义，不用来撑页面气氛。

表格：

- 表格是列表页主角。
- 表头、表体、分页、筛选区保持同一套层级。
- hover 和选中反馈要轻。
- 空数据时给短结论和可执行动作。
- 操作列里的按钮要短，危险操作要和普通操作区分。

表单：

- label 常驻，不用 placeholder 当 label。
- 必填、禁用、加载、错误状态都要能看清。
- 校验失败时说明字段哪里不对。
- 保存按钮写具体动作，比如“保存配置”“发布文章”。

按钮和链接：

- 主要操作一个区域最多一个。
- 次要操作用默认按钮、文本按钮或链接。
- 所有可交互元素都要有清楚的 focus 状态。
- 图标按钮必须有 `aria-label` 或可见文本。

空状态和错误状态：

- 先给结论，再给动作。
- 文字尽量短。
- 不做成海报。
- 错误页不要写玩笑。

## 动效

动效入口：

```text
apps/fifa/src/assets/styles/**
apps/fifa/src/components/ui/Pattern.tsx
```

规则：

- 只做轻量反馈：页面进入、hover、focus、展开收起、状态切换。
- 动画只用 `transform` 和 `opacity`。
- hover 反馈控制在 `150ms` 到 `300ms`。
- 展开收起控制在 `200ms` 到 `400ms`。
- 不使用跳动、回弹和明显缩放。
- 背景 Pattern 可以轻微移动，但必须支持 `prefers-reduced-motion`。
- 表格、表单和弹层不要使用明显位移。

## 响应式

- 默认先保证桌面管理场景好用。
- 窄屏时保留关键操作，不隐藏主要入口。
- 表格在窄屏下优先允许横向滚动，不强行改成难扫的卡片。
- 筛选区在窄屏下可以折行。
- 触摸目标至少接近 `44px`。
- 移动端抽屉、菜单、弹层要能键盘访问。

## 文案

Fifa 默认写中文短句。英文技术名保留原写法。

优先用这些说法：

```text
当前账号
当前范围
查看权限
编辑资料
角色列表
用户列表
文章列表
素材库
站点配置
项目列表
保存配置
发布文章
归档项目
```

少用这些说法：

```text
帮助你快速了解
从这里开始
一目了然
全面掌握
为你整理
```

错误提示写法：

- 哪个操作失败。
- 为什么失败，如果前端能判断。
- 下一步能做什么。

示例：

```text
文章保存失败，请检查标题和正文后再试
当前没有文章，先新建一篇
Momo 服务暂时不可用，稍后再刷新
```

## 代码落点

- 全局样式入口：`apps/fifa/src/assets/styles/index.css`
- Ant Design 覆盖：`apps/fifa/src/assets/styles/components/antd.css`
- 控制台布局样式：`apps/fifa/src/assets/styles/components/layout.css`
- Catppuccin Tailwind token：`packages/catppuccin-theme/styles/fifa.css`
- Ant Design 主题：`apps/fifa/src/utils/catppuccin.antd.ts`
- 页面头部：`apps/fifa/src/components/common/FifaPageHeader.tsx`
- 控制台布局：`apps/fifa/src/layout`
- 页面模块：`apps/fifa/src/features/<module>/pages`

新页面先写在对应模块的 `pages` 目录里。确认复用后，再把组件移到 `apps/fifa/src/components` 或当前模块的贴身组件目录。

## 检查清单

改 Fifa 页面或样式后，至少检查这些点：

- 标题是不是已经足够清楚。
- 顶部区域是不是太重。
- 页面重点是不是落在真正能操作的内容上。
- 有没有假的统计块或没用的说明块。
- 表格、表单、按钮、空状态是否都能看清。
- hover 不是唯一入口。
- 深色和浅色主题都能看清正文、边框和按钮。
- 是否统一使用现有主题语义类。
- 文案是不是足够短。

能跑命令时，在仓库根目录执行：

```bash
pnpm lint:fifa
pnpm type-check:fifa
```
