# 项目架构

## 架构结论

仓库的主要边界可以概括成 5 条：

- `packages/nexus` 是服务端 HTTP 接口定义的唯一来源
- route 层直接表达 HTTP 语义，不维护额外的 schema 镜像层
- access control 通过声明式 route 配置表达
- OpenAPI 是服务端对外的接口说明导出物
- Eden 是仓库内联调与 smoke test 的内部类型基线

当前系统采用固定角色和固定权限的后台管理模型。

这意味着：

- 固定系统角色只保留 `superAdmin / admin / user`
- 权限以当前系统内置权限为准
- 角色能力围绕角色列表、用户角色分配与用户权限查看展开
- `own` 只用于用户自己的资料场景，不作为通用资源归属判断器

## 包边界

### `@xdd-zone/console`

负责：

- 后台管理前端页面与布局
- 应用路由、导航与标签页
- 登录态初始化、登录、登出与会话恢复
- 消费 `@xdd-zone/nexus` 暴露的认证与业务接口

不负责：

- 维护服务端接口定义的唯一来源
- 在前端单独维护权限计算规则
- 用菜单承担业务权限判定

### `@xdd-zone/nexus`

负责：

- Elysia app / route / plugin 组合
- 模块接口定义、OpenAPI、权限与认证
- Prisma、日志、配置等基础设施
- Eden internal smoke test

不负责：

- 维护第二套独立的 HTTP 接口定义

### `@xdd-zone/eslint-config`

负责共享 lint / format 规则，不参与业务接口流程。

## 前端结构

`packages/console/src/` 当前按下面的职责组织：

```text
src/
├── app/
│   ├── navigation/
│   └── router/
├── modules/
│   └── auth/
├── pages/
├── layout/
├── components/
├── hooks/
├── stores/
└── utils/
```

其中：

- `app/router/`
  - public / protected 路由配置与守卫
- `app/navigation/`
  - 独立导航配置
- `modules/auth/`
  - `get-session / sign-in / sign-out` 的前端消费封装
- `layout/`
  - 后台外壳、侧边栏、头部、TabBar、设置抽屉

当前前端架构的约束是：

- 是否允许进入后台，只由 `nexus` session 决定
- 菜单负责导航组织
- 页面级权限以服务端返回的 `401 / 403` 为准
- 根路径会根据登录态重定向到 `/login` 或 `/dashboard`

## 服务端结构

`packages/nexus/src/` 按下面的职责组织：

```text
src/
├── app.ts
├── server.ts
├── index.ts
├── routes/
├── modules/
├── core/
├── infra/
├── shared/
└── eden/
```

### `app.ts`

负责创建 Elysia app，并装配：

- `core/http` 全局插件
- API 路由聚合

它不负责监听端口，也不负责优雅关闭。

### `server.ts`

负责：

- `app.listen(...)`
- 启动日志
- Prisma 断连与进程退出

### `index.ts`

只负责启动入口。

## Route / Module / Core 的边界

### `routes/`

每个 `*.route.ts` 只负责：

1. prefix / tags
2. route 级 schema 绑定
3. 声明式鉴权与权限
4. `apiDetail(...)`
5. 调用 service

### `modules/`

业务模块以 `auth / user / rbac` 为主，推荐包含：

- `*.contract.ts`
- `*.service.ts`
- `*.repository.ts`
- `*.types.ts`
- `*.constants.ts`
- `index.ts`

其中：

- `*.contract.ts`
  - 定义 HTTP body / query / params / response
- `*.service.ts`
  - 承担业务编排
- `*.repository.ts`
  - 承担 Prisma 访问

### `core/`

只放跨业务框架能力：

- `core/http/`
  - CORS
  - OpenAPI
  - 统一错误处理
  - 请求日志
- `core/access-control/`
  - `authPlugin`
  - `permissionPlugin`
- `core/auth/`
  - Better Auth 配置与适配
- `core/permissions/`
  - 权限常量、权限服务、辅助判断

其中：

- `core/access-control/` 只负责登录态与声明式权限判断
- `core/permissions/` 只负责权限常量与用户权限计算
- `core/permissions` 负责基于固定角色计算用户权限

### `infra/`

基础设施实现：

- Prisma 客户端
- Prisma schema / seed
- logger

### `shared/`

轻量共享能力：

- `shared/schema/`
  - `ApiErrorSchema`
  - 分页 schema
  - query helpers
  - 常见 primitives
- `shared/openapi/`
  - `apiDetail(...)`

## 鉴权与权限模型

access control 的统一入口是 `core/access-control/`。

route 层优先使用下面 4 种声明式配置：

- `auth: 'required'`
  - 只要求登录
- `permission`
  - 要求显式权限
- `own`
  - 仅用于用户自己的资料场景，或具备 `:all` 权限
- `me`
  - 登录用户访问自己的 `/me` 类接口

当 handler 需要直接消费已认证的 `auth` 上下文时，推荐同时显式声明：

- `auth: 'required'`

新代码应统一从 `@/core/access-control` 与 `@/core/http` 导入。

当前权限列表包括：

- `user:read:own`
- `user:update:own`
- `user:read:all`
- `user:update:all`
- `user:disable:all`
- `role:read:all`
- `user_role:assign:all`
- `user_role:revoke:all`
- `user_permission:read:own`
- `user_permission:read:all`
- `system:manage`

## 接口定义与导出流程

整体流程如下：

```text
Nexus 接口定义 / route
  -> OpenAPI 导出
  -> Eden / 测试 / 外部集成消费
```

具体落点：

- 接口定义位置：
  - `packages/nexus/src/modules/*/*.contract.ts`
- OpenAPI 导出：
  - `packages/nexus/scripts/export-openapi.ts`
  - `packages/nexus/openapi/openapi.json`

## 内部验证链路

仓库内有两条验证链：

### Eden internal

用途：

- route 类型漂移检查
- 登录态 / own / me 的 typed smoke test

位置：

- `packages/nexus/src/eden/eden-smoke.test.ts`

### OpenAPI export

用途：

- 验证 OpenAPI 文档可导出，并覆盖关键路径

位置：

- `packages/nexus/src/eden/openapi-smoke.test.ts`

## 实现摘要

- 服务端只维护一套 HTTP 接口定义
- route 风格保持 Elysia-native 的声明式写法
- Better Auth 适配位于 `core/auth`
- Eden 位于 Nexus 测试集中，并覆盖匿名、登录态、own、me
