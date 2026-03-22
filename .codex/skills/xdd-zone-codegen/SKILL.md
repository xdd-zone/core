---
name: xdd-zone-codegen
description: 为 XDD Zone Core 生成或修改标准前后端代码。用于仓库内新增或调整 Elysia-first 的 route、module、contract、权限相关代码，或新增/改造 console 后台管理前端的页面、路由、导航、登录态消费、布局联动时，优先复用现有接口、session、权限与资料边界，保持目录结构、命名、JSDoc、响应格式、i18n、主题语义、apiDetail 与导出方式一致。
---

# XDD Zone Codegen

当用户要在仓库中新增接口、模块、契约、后台页面，或者明确要求“按 XDD Zone 风格生成代码”时，使用这个 Skill。目标是基于当前仓库已有边界生成可直接落地的实现，而不是额外发明一套权限、角色、路由或前端壳层风格。

## 先做什么

先读取这些公共文档：

- `README.md`
- `docs/architecture.md`
- `docs/development.md`
- 目标包的 `README.md`

如果任务涉及 `console`，再读取：

- `docs/console.md`
- `packages/console/README.md`
- `packages/console/AGENTS.md`
- `packages/console/docs/theme.md`

如果任务涉及认证、权限或接口联调，再按需补读：

- `docs/authentication.md`
- `docs/rbac.md`

然后打开最接近的现有实现作为参考。

后端优先参考：

- route 参考 `packages/nexus/src/routes/user.route.ts`
- module 参考 `packages/nexus/src/modules/user/`
- contract 参考 `packages/nexus/src/modules/user/user.contract.ts`

如果是 RBAC / 权限接口，优先参考 `packages/nexus/src/routes/rbac.route.ts` 与 `packages/nexus/src/modules/rbac/`。

前端优先参考：

- 路由参考 `packages/console/src/app/router/routes.tsx`
- 路由守卫参考 `packages/console/src/app/router/guards.tsx`
- 导航参考 `packages/console/src/app/navigation/navigation.ts`
- 认证参考 `packages/console/src/modules/auth/*`
- 根布局参考 `packages/console/src/layout/RootLayout.tsx`
- 页面参考 `packages/console/src/pages/auth/Login.tsx`
- 页面参考 `packages/console/src/pages/dashboard/Dashboard.tsx`

## 先判断任务类型

- 只改 `packages/nexus`：按后端 contract -> service/repository -> route -> OpenAPI 的顺序推进。
- 只改 `packages/console`：先确认 `nexus` 现有接口和登录态边界，再改页面、路由、导航和布局。
- 前后端联动：先改 `nexus`，再导出 OpenAPI / 完成接口自检，最后再接 `console`。

## 不可偏离的规则

### 共享规则

- 先复用仓库现有边界，再考虑新增抽象。
- 优先使用 `@/` 别名导入。
- 导出函数、类、方法补齐中文 JSDoc；避免 `any`。
- 命名和文件名遵循现有约定：camelCase / PascalCase / UPPER_SNAKE_CASE / kebab-case。

### Nexus 后端规则

- `packages/nexus` 模块 contract 是服务端 HTTP 契约真相源。先定义或修改 contract，再写 route、service。
- `packages/nexus/src/routes/*.route.ts` 只负责 route、schema、plugin、`apiDetail(...)` 和调用 service。
- `packages/nexus/src/modules/*` 承载业务逻辑；涉及 Prisma 访问时优先落到 repository。
- 当前仓库默认复用固定角色和固定权限。新增接口前先确认是否能落到现有 `USER / ROLE / USER_ROLE / USER_PERMISSION` 等边界，不要默认新增角色、权限组或动态授权模型。
- 成功响应直接返回业务数据，不包一层 `{ code, message, data }`。
- 删除或无 body 操作返回 `204`。
- 错误交给统一错误处理；缺失资源优先抛 `NotFoundError`。
- `apiDetail` 统一从 `@/shared` 导入。

### Console 前端规则

- `packages/console` 只消费 `nexus` 暴露的认证与业务接口，不复制一套接口真相源，也不在前端单独维护权限计算规则。
- 前端路由只区分 `public / protected`；未登录由 `guards.tsx` 处理，细粒度权限以后端 `401 / 403` 为准。
- 菜单与路由解耦。新增后台页面时通常同时更新 `app/router/routes.tsx` 与 `app/navigation/navigation.ts`，但不要把菜单裁剪当成权限系统。
- 根路径 `/` 的跳转逻辑保持在 `RootIndexRedirect`，不要把首页重定向散落到页面内部。
- 认证相关请求与 store 只放 `packages/console/src/modules/auth/*`；页面、layout、router 不要直接复制 `get-session / sign-in / sign-out` 流程。
- 布局壳层放 `packages/console/src/layout/*`；页面不要自己拼一套 Header / Sidebar / TabBar / SettingDrawer。
- 可持久化的全局 UI 状态放 Zustand store；单页临时状态优先留在页面组件内部。
- 页面、导航、Tab 标题、按钮等用户可见文案优先走 i18n key；新增文案同步更新 `packages/console/src/i18n/locales/zh.ts` 与 `en.ts`。
- 基础控件优先复用 Ant Design；布局、间距、局部视觉优先用 Tailwind。主题颜色优先使用 `bg-surface`、`text-fg`、`border-border`、`text-fg-muted` 等语义类，不要另外发明一套配色。
- 只有当一个业务接口会被多个页面复用、或需要共享状态时，才考虑新增 `packages/console/src/modules/<domain>/`；不要为了形式把单页逻辑过度模块化。

## 类型安全底线

- 禁止写 `any`、`as any`、`Array<any>`、`Promise<any>`、`Record<string, any>`。
- 每个类型都要表达业务含义，优先使用 `UserListQuery`、`UpdateMyProfileBody`、`AssignRoleToUserBody`、`UserWhereInput` 这类语义化名称，避免空泛的 `Data`、`Result`、`Payload`。
- route 的 `body / query / params / response` 类型优先从模块内 `*.contract.ts` 或 `shared/schema` 的 Zod schema 推导。
- repository 的输入输出优先复用 Prisma 生成类型、`WhereInput`、`Select`、`GetPayload` 或模块内显式定义的 `*.types.ts`。
- service 的方法签名必须写清楚入参与返回值，不能把 `Promise` 返回值留成隐式宽类型。
- 真正动态的数据先用 `unknown`，再通过 schema、类型守卫或字段收窄转换；不要直接退回 `any`。
- 如果一个对象暂时无法精确定义，就先在 `*.types.ts` 或 `*.model.ts` 给它起一个有意义的名字，再继续写逻辑。

## 类型来源优先级

按下面顺序找类型来源，只有前一层无法表达时才进入下一层：

1. `packages/nexus/src/modules/*/*.contract.ts` 或 `packages/nexus/src/shared/schema/*` 的 `z.infer`、`_input`、`_output`
2. Prisma 生成类型和 `select` 对应的 payload 类型
3. 现有基础泛型，例如 `PaginatedList<T>`、`PaginationQuery`、`RequestFn`
4. 模块内新增的语义化 `type` / `interface`

不要为了省事跳过前两层，直接写宽泛对象类型。

## 生成顺序

### 后端任务

1. 在 `packages/nexus/src/modules/<name>/` 定义 `body / query / params / response` contract，并更新对应 `index.ts`
2. 在 `packages/nexus/src/modules/<name>/` 实现 `service / repository / types / constants / index`
3. 在 `packages/nexus/src/routes/*.route.ts` 注册接口，并按需更新 `packages/nexus/src/routes/index.ts`
4. 检查是否需要补充 OpenAPI、文档或导出

### Console 任务

1. 先确认 `nexus` 现有接口、session 与权限边界是否已满足需求
2. 在 `packages/console/src/pages/*` 新增或修改页面入口
3. 在 `packages/console/src/app/router/routes.tsx` 注册路由；按需补 `handle.title / breadcrumbTitle / tab`
4. 如果页面需要后台入口，再同步 `packages/console/src/app/navigation/navigation.ts`
5. 如果改动涉及登录态或会话消费，修改 `packages/console/src/modules/auth/*`
6. 如果改动涉及后台壳层、TabBar、移动端菜单或主题设置，修改 `packages/console/src/layout/*`、`hooks/*`、`stores/modules/*`
7. 同步 i18n 文案与主题语义类
8. 完成 `lint / type-check / build` 验证

### 前后端联动任务

1. 先按后端顺序改 `nexus`
2. 导出 OpenAPI，并做至少一轮接口 / 权限自检
3. 再接 `console` 的页面、路由、导航和联调

如果用户只要求后端内部能力，不要默认新增调用方包装层。

## plugin 选择

- 提供认证上下文：`authPlugin`
- 仅要求登录：在 route 上声明 `auth: 'required'`
- 需要权限判断：`permissionPlugin`
- `own` 只用于当前登录用户查看或修改自己的资料场景，不要把它泛化成通用资源归属模型。

常见 route 写法：

- `permission: Permissions.USER.READ_ALL`
- `permission: Permissions.USER_ROLE.ASSIGN_ALL`
- `me: Permissions.USER.READ_OWN`
- `me: Permissions.USER_PERMISSION.READ_OWN`
- 当前用户角色列表这类只要求登录的接口，可以只声明 `auth: 'required'`

如果 handler 需要直接消费已认证的 `auth.user` / `auth.session`，推荐同时显式声明：

- `auth: 'required'`

## OpenAPI 与响应约定

- route detail 统一走 `apiDetail(...)`
- 列表分页结构固定为 `items / total / page / pageSize / totalPages`
- `204` 接口只设置 `set.status = 204`

## Console 路由与页面约定

- 受保护页面默认挂到 `RequireAuth` 下，不要绕过现有守卫。
- 页面路由优先用 lazy import，和现有 `routes.tsx` 保持一致。
- `handle.title` 优先填写 i18n key，这会同时影响 TabBar 与面包屑。
- 不应该出现在 TabBar 的页面，例如 `/login`、错误页、纯重定向页，显式设 `handle.tab = false`。
- 页面内的 loading / error 优先复用现有模式：`<Loading />`、Antd `Alert`、`message`。
- 使用表格页时，优先检查是否适合复用 `useDynamicTableHeight`，避免固定高度写死。

## 生成前检查

在真正写代码前，先判断这次改动是否需要同时更新以下层：

- `packages/nexus`
- `packages/console`
- `packages/nexus/openapi/openapi.json`
- `docs`
- 相关 smoke test 或回归验证

涉及公共 API 的新增或变更，默认同时检查这些层是否一致。

## 收尾检查

完成代码后，再做一次类型安全自检：

- 搜索是否残留 `any` 或 `as any`
- 检查导出类型名是否表达业务语义
- 检查 route / service / repository 的返回值是否明确
- 检查动态数据是否经过 schema parse 或显式收窄

如果出现“先写 `any`，后面再改”的冲动，直接停下来补类型，不要把这个债留给后续修改。

前端收尾时，再额外检查：

- 新页面是否已在正确的路由分组下
- 导航、TabBar、面包屑标题是否一致
- `zh / en` 文案是否补齐
- 是否误把权限判断写进了菜单或前端路由
- 是否复用了现有主题语义类，而不是硬编码颜色
- 登录后刷新、退出登录、移动端菜单等行为是否没有回退

## 模板与清单

- 创建 `nexus` 新模块或新接口时，打开 `references/patterns.md`，按其中的骨架与检查清单生成。
- 创建或修改 `console` 后台页面时，打开 `references/console.md`，按其中的路由、导航、auth、布局、主题和验证清单生成。
