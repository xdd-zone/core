# 项目架构

## 架构结论

仓库当前按下面几条规则组织：

- `packages/nexus` 只维护一套服务端 HTTP 接口
- `packages/nexus/src/modules` 按功能组织 Elysia 模块
- 每个模块自己的 `index.ts` 直接作为路由入口
- `model.ts` 统一定义 HTTP schema
- `core/` 只放跨业务的基础能力
- OpenAPI 作为接口说明导出
- Eden 作为仓库内联调与 smoke test 的类型入口

当前系统采用固定角色、固定权限的后台模型：

- 固定角色：`superAdmin / admin / user`
- 权限以系统内置权限为准
- `own` 只用于用户自己的资料场景

## 包职责

### `@xdd-zone/console`

负责：

- 后台管理前端页面与布局
- 应用路由、导航与标签页
- 登录态初始化、登录、登出与会话恢复
- 调用 `@xdd-zone/nexus` 提供的认证与业务接口

不负责：

- 维护服务端接口定义
- 在前端单独维护权限计算规则
- 用菜单承担业务权限判定

### `@xdd-zone/nexus`

负责：

- Elysia app 与模块装配
- HTTP 接口、OpenAPI、认证与权限
- Prisma、日志、配置等基础设施
- Eden smoke test

不负责：

- 维护第二套独立的 HTTP 接口定义

## 服务端结构

`packages/nexus/src/` 当前按下面的职责组织：

```text
src/
├── app.ts
├── server.ts
├── index.ts
├── modules/
├── core/
├── infra/
├── shared/
└── eden/
```

### `app.ts`

负责创建 Elysia app，并装配：

- `core/http` 全局插件
- `modules/` 模块聚合入口

### `server.ts`

负责：

- `app.listen(...)`
- 启动日志
- Prisma 断连与进程退出

### `modules/`

每个功能模块都放在自己的目录里，目录中的 `index.ts` 直接定义该模块的 Elysia 路由。

推荐结构：

```text
modules/<feature>/
├── index.ts
├── model.ts
├── service.ts
├── repository.ts
├── constants.ts
└── types.ts
```

说明：

- `index.ts`
  - Elysia 模块入口
  - 定义 prefix、tags、鉴权声明、`apiDetail(...)`
  - 调用当前模块 service
- `model.ts`
  - 定义 body / query / params / response schema
- `service.ts`
  - 负责业务编排
- `repository.ts`
  - 负责 Prisma 查询与写入
- `constants.ts`
  - 放模块常量
- `types.ts`
  - 放模块内部类型

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

### `infra/`

基础设施实现：

- Prisma 客户端
- Prisma schema / seed
- logger

### `shared/`

轻量共享能力：

- `shared/schema/`
  - 常用基础 schema
  - 分页 schema
  - query helper
- `shared/openapi/`
  - `apiDetail(...)`

## Route / Model / Service / Repository 的职责

### 模块 `index.ts`

每个模块的 `index.ts` 只负责：

1. 定义 Elysia 模块实例
2. 注册当前模块的接口
3. 绑定 `body / query / params / response`
4. 声明 `auth / permission / own / me`
5. 配置 `apiDetail(...)`
6. 调用当前模块 service

### `model.ts`

负责：

- body schema
- query schema
- params schema
- response schema
- route 可复用的 HTTP 类型

### `service.ts`

负责：

- 业务编排
- 存在性校验
- 领域规则处理

### `repository.ts`

负责：

- Prisma 查询与写入
- 数据选择和持久化细节

## 鉴权与权限模型

access control 的统一入口是 `core/access-control/`。

route 层优先使用下面 4 种声明式配置：

- `auth: 'required'`
  - 只要求登录
- `permission`
  - 要求固定权限
- `own`
  - 当前用户自己的资料接口
- `me`
  - 当前登录用户的 `/me` 类接口

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

当前前端约束：

- 是否允许进入后台，只由 `nexus` session 决定
- 会话初始化和认证 mutation 交给 TanStack Query 处理
- 菜单负责导航组织
- 页面级权限以后端 `401 / 403` 为准

## 接口说明产物

接口说明有两份直接可用的产物：

- OpenAPI
- Eden route 类型

推荐顺序：

```text
模块 model / 路由 / service
  -> OpenAPI
  -> Eden smoke
```
