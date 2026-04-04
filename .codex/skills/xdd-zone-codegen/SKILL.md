---
name: xdd-zone-codegen
description: 为 XDD Zone Core 建立当前会话上下文，并按仓库现状生成或修改标准前后端代码。适合用在这些开场需求：先看看这个仓库、这次该从哪改、先帮我定位相关文档和代码入口、这个需求该走 packages/nexus 还是 packages/console、按当前项目方式实现。只要任务涉及 packages/nexus、packages/console、认证、RBAC、Eden、OpenAPI、GitHub 登录、路由、导航、布局、项目级文案与类型导出约定，就先用这个 Skill 判断任务落点、补齐前置技能，再按当前结构实现，避免沿用旧目录、旧 API wrapper、旧权限写法或平行实现。
---

# XDD Zone Starter

把这个 Skill 当成当前仓库的开场入口。
目标不是直接生成一段代码，而是先让 Agent 快速知道这次任务应该读哪些文档、先调哪些项目技能、应该改哪几层、哪些旧写法已经不能再用了。

## 这些说法都适合直接用这个 Skill

- 先帮我看看这个仓库现在怎么组织
- 这次需求该从哪改
- 先帮我定位相关文档和代码入口
- 这个功能该走 `packages/nexus` 还是 `packages/console`
- 先别急着写代码，先判断要读哪些文档
- 按当前项目方式实现，不要沿用旧结构
- 帮我接一下认证、RBAC、Eden、OpenAPI 或 GitHub 登录
- 帮我看这次改动会不会同时影响前后端、公开类型或文档

如果用户表达的意思接近这些说法，也直接先用本 Skill 开场。

## 会话启动顺序

1. 先看 `AGENTS.md`、`README.md`、`docs/index.md`
2. 再按任务类型补读文档，优先使用 `references/startup.md` 里的任务分流表
3. 先判断任务落在哪些层：
   - `packages/nexus`
   - `packages/console`
   - `docs / README / 注释 / 提示词`
   - `auth / RBAC / GitHub 登录`
   - `Eden / OpenAPI / 前后端联调`
4. 在真正写代码前，先补齐必须调用的项目技能

## 必须先补的项目技能

只要命中下面场景，就先按这个顺序处理：

- 任务涉及 `packages/nexus`
  - 先调用 `elysiajs`
  - 如果还要按当前仓库风格继续生成或改模块代码，再继续使用本 Skill
- 任务涉及 `packages/console` 的界面、页面、布局、导航、展示型业务组件
  - 先读取 `packages/console/.impeccable.md`
  - 先调用 `frontend-design`
  - 再继续使用本 Skill
- 任务涉及 README、`docs/`、JSDoc、注释、错误提示、提示词或其他说明性文案
  - 先调用 `write-xdd-docs`
  - 再继续使用本 Skill
- 任务同时涉及 `packages/console` 界面和说明性文案
  - 顺序固定为：`packages/console/.impeccable.md` -> `frontend-design` -> `write-xdd-docs` -> 本 Skill

不要跳过这些顺序，也不要把“是否需要调用”留给临时判断。

## 当前仓库要先记住的事实

- 这是一个 `Bun + React + Elysia` 的 monorepo，主包是 `@xdd-zone/console` 和 `@xdd-zone/nexus`
- `packages/nexus` 只维护一套服务端 HTTP 接口
- `packages/nexus/src/modules/*/index.ts` 直接就是模块路由入口，`model.ts` 放 HTTP schema
- `packages/nexus/src/public/*-types.ts` 提供给前端复用的 HTTP 类型
- `@xdd-zone/nexus/permissions` 提供权限常量、角色常量和匹配辅助函数
- `packages/console` 直接通过 `src/shared/api/eden.ts` 里的 Treaty 客户端调接口
- `packages/console` 里的 `user`、`rbac` 已经不再维护一层 1:1 的独立 API wrapper
- GitHub 登录不是普通 JSON 请求，前端通过浏览器跳转到 `/api/auth/sign-in/github`
- 登录方式开关统一在 `packages/nexus/config.yaml` 的 `auth.methods` 里维护
- Console 现在有独立的页面访问控制层：`packages/console/src/app/access/access-control.ts`
- Dashboard、菜单显示和页面入口已经按当前权限模型做过一轮收敛，生成代码时要复用这套结果

## 任务分流

### 后端接口、模块、OpenAPI、权限

先读：

- `docs/development.md`
- `docs/architecture.md`
- `docs/api.md`
- `docs/eden.md`
- 认证相关再补 `docs/authentication.md`
- 权限相关再补 `docs/rbac.md`
- `packages/nexus/README.md`

再看代码：

- `packages/nexus/src/modules/user/`
- `packages/nexus/src/modules/rbac/`
- `packages/nexus/src/modules/auth/`
- `packages/nexus/src/core/security/`
- `packages/nexus/src/public/`

然后打开 `references/patterns.md`。

### Console 页面、路由、导航、布局

先读：

- `packages/console/.impeccable.md`
- `docs/console.md`
- `docs/development.md`
- `docs/eden.md`
- `docs/authentication.md`
- `packages/console/README.md`

主题相关再补：

- `docs/theme.md`

再看代码：

- `packages/console/src/app/router/routes.tsx`
- `packages/console/src/app/router/guards.tsx`
- `packages/console/src/app/access/access-control.ts`
- `packages/console/src/app/navigation/navigation.ts`
- `packages/console/src/layout/`
- `packages/console/src/modules/auth/`
- `packages/console/src/modules/user/`
- `packages/console/src/modules/rbac/`

然后打开 `references/console.md`。

### GitHub 登录、登录态、前后端联调

先读：

- `docs/authentication.md`
- `docs/OAuth2/github.md`
- `docs/console.md`
- `docs/eden.md`
- `docs/api.md`

再看代码：

- `packages/nexus/src/core/security/auth/`
- `packages/nexus/src/modules/auth/`
- `packages/console/src/modules/auth/`
- `packages/console/src/shared/api/eden.ts`
- `packages/console/src/pages/auth/Login.tsx`
- `packages/console/src/pages/dashboard/Dashboard.tsx`

### 会话开场还不确定该看哪里

先打开 `references/startup.md`，按任务类型和关键词找文档、目录和最近更新点。

## 当前实现规则

### Nexus

- 默认顺序：`model.ts` -> `service.ts / repository.ts` -> 模块 `index.ts` -> 回归验证
- `index.ts` 只放 route、schema、鉴权声明、`apiDetail(...)` 和 service 调用
- 只要求登录时优先用 `authPlugin + auth: 'required'`
- 需要权限、`own`、`me` 时优先用 `accessPlugin`
- `own` 只用于当前用户自己的资料场景，不把它泛化成任意资源归属模型
- 当前固定角色只保留 `superAdmin / admin / user`
- 成功响应直接返回业务数据，不包 `{ code, message, data }`
- 删除或无 body 操作返回 `204`
- 公开给前端复用的 HTTP 类型按需维护在 `packages/nexus/src/public/*-types.ts`
- 运行时权限工具继续从 `packages/nexus/src/public/permissions.ts` 导出

### Console

- 页面、路由、导航和布局改动之前，先遵守 `packages/console/.impeccable.md`
- Query / mutation 直接走 `packages/console/src/shared/api/eden.ts` 的 `api`
- GitHub 登录继续通过 `getGithubSignInUrl(...)` 和浏览器跳转处理，不改成普通 Treaty JSON 请求
- 页面访问控制统一看 `packages/console/src/app/access/access-control.ts`
- 菜单和路由分开维护；新增页面通常同时改 `routes.tsx` 和 `navigation.ts`
- 根路径重定向继续放在 `RootIndexRedirect`
- 后台壳层统一由 `layout/*` 提供，页面不要重复拼 Header / Sidebar
- 用户可见文案优先走 i18n key，同时补 `zh.ts` 和 `en.ts`
- 主题颜色优先复用语义类，不新开平行配色系统

### Eden 与类型协作

- `packages/nexus/src/public/eden.ts` 只导出 `type App = typeof app`
- `packages/console/src/shared/api/eden.ts` 统一维护 API 基址、cookie 和错误拆包
- Console 直接用 Treaty 推导路径、参数和返回值
- 只有页面表单、表格或共享状态真的需要明确 HTTP 类型时，才补 `@xdd-zone/nexus/*-types`

## 最近更新后最容易踩错的点

- 不要继续给 `packages/console/src/modules/user`、`packages/console/src/modules/rbac` 新增一层 1:1 `*.api.ts` 包装
- 不要在前端复制一套权限常量或手写第二套 HTTP 类型
- 不要把 GitHub 登录接成普通异步 JSON 登录按钮请求
- 不要忽略 `packages/nexus/config.yaml` 的 `auth.methods`、`trustedOrigins`
- 不要绕过 `app/access/access-control.ts` 自己散落地写页面访问限制

## 收尾检查

真正改代码前，先判断这次任务是否还要同步这些层：

- `packages/nexus`
- `packages/console`
- `packages/nexus/src/public/*`
- `/openapi`
- `docs`
- Nexus smoke test

完成后至少做这些检查：

- `bun run format`
- `bun run lint`
- `bun run type-check`

如果动了接口、认证、权限、OpenAPI、Eden 或公开类型，再补：

- `bun run --filter @xdd-zone/nexus test`

## 参考文件

- 会话启动与任务定位：`references/startup.md`
- Nexus 代码骨架与检查清单：`references/patterns.md`
- Console 入口、路由、导航、认证和布局参考：`references/console.md`
