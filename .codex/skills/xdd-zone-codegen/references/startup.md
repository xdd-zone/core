# XDD Zone 会话启动参考

## 目录

1. 开场最少阅读
2. 按任务类型找文档
3. 按任务类型找代码
4. 最近更新后要优先记住的变化
5. 开始改代码前的判断清单

## 开场最少阅读

第一次进入仓库，先看这几份：

1. `AGENTS.md`
2. `README.md`
3. `docs/index.md`

如果用户需求已经比较清楚，再按下面分流补读，不要一口气把所有文档都读完。

## 按任务类型找文档

### 想先搞清楚整个项目

- `README.md`
- `docs/architecture.md`
- `docs/development.md`
- `docs/api.md`
- `docs/eden.md`

### 写 `packages/nexus`

- `docs/development.md`
- `docs/architecture.md`
- `docs/api.md`
- `docs/eden.md`
- `docs/authentication.md`
- `docs/rbac.md`
- `packages/nexus/README.md`

### 写 `packages/console`

- `packages/console/.impeccable.md`
- `docs/console.md`
- `docs/development.md`
- `docs/eden.md`
- `docs/authentication.md`
- `docs/theme.md`
- `packages/console/README.md`

### 写 GitHub 登录、登录态、认证流程

- `docs/authentication.md`
- `docs/OAuth2/github.md`
- `docs/console.md`
- `docs/eden.md`
- `docs/api.md`

### 写 OpenAPI、Eden、前后端联调

- `docs/api.md`
- `docs/eden.md`
- `docs/development.md`
- `docs/testing.md`

### 写 README、文档、JSDoc、提示词

- 先调用 `write-xdd-docs`
- 再读任务相关的 `docs/*.md`、包 README 和目标文件

## 按任务类型找代码

### 认证、登录、会话

- `packages/nexus/src/modules/auth/`
- `packages/nexus/src/core/security/auth/`
- `packages/console/src/modules/auth/`
- `packages/console/src/app/router/guards.tsx`
- `packages/console/src/pages/auth/Login.tsx`

### 权限、角色、页面访问控制

- `packages/nexus/src/modules/rbac/`
- `packages/nexus/src/core/security/permissions/`
- `packages/nexus/src/public/permissions.ts`
- `packages/console/src/app/access/access-control.ts`
- `packages/console/src/modules/rbac/`
- `packages/console/src/pages/access/`

### 用户资料、用户管理

- `packages/nexus/src/modules/user/`
- `packages/nexus/src/public/user-types.ts`
- `packages/console/src/modules/user/`
- `packages/console/src/pages/user/`

### Console 路由、导航、布局

- `packages/console/src/app/router/routes.tsx`
- `packages/console/src/app/router/guards.tsx`
- `packages/console/src/app/navigation/navigation.ts`
- `packages/console/src/layout/`
- `packages/console/src/hooks/`
- `packages/console/src/stores/modules/`

### Eden 与 API 基址

- `packages/nexus/src/public/eden.ts`
- `packages/nexus/src/eden/`
- `packages/console/src/shared/api/eden.ts`
- `packages/console/src/shared/api/index.ts`

## 最近更新后要优先记住的变化

### Eden 协作方式已经换了

- Console 现在直接在 `modules/*/*.query.ts` 里调用 Treaty 客户端
- `user`、`rbac` 这两块不再维护一层独立 `*.api.ts`
- 需要显式 HTTP 类型时，直接从 `@xdd-zone/nexus/*-types` 引入

### GitHub 登录已经接入并支持开关

- 后端入口是 `/api/auth/sign-in/github`
- 登录方式是否开放由 `packages/nexus/config.yaml` 的 `auth.methods` 决定
- GitHub 登录是浏览器重定向流程，不是普通 JSON 接口调用
- 本地和生产都要同时考虑 API 基址、`trustedOrigins`、callback URL

### Console 权限访问控制收口了

- 受保护页面进入前会跑 `ensureConsolePathAccess(...)`
- 页面是否可访问，不要散落到菜单、页面组件或随机 hook 里自己判断
- Dashboard 和导航已经按当前权限模型调整过，不要倒回“无论权限都请求所有管理接口”的写法

### `packages/nexus/src/public` 现在更重要

- `auth-types.ts`、`user-types.ts`、`rbac-types.ts` 给前端复用
- `permissions.ts` 导出权限常量、角色常量和匹配 helper
- `index.ts` 聚合导出 HTTP 类型和 Eden 类型
- 不要把权限运行时工具再塞进 `public/index.ts` 里做混合入口，保持现在的导出方式

## 开始改代码前的判断清单

1. 这次改动属于后端、前端、文案，还是前后端联动
2. 需要先调用哪个项目技能
3. 这次改动会不会影响：
   - `packages/nexus/src/public/*`
   - `/openapi`
   - Eden smoke
   - `packages/console` 的 query / route / navigation
4. 这次是否命中当前已经存在的权限常量、固定角色和登录态约定
5. 这次是否只是需要复用现有模块，而不是新建平行层
