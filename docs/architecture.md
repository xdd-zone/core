# 项目架构

这份文档只说明当前代码怎么组织，不讲历史方案。

## 总体结构

仓库现在有两个主包：

- `packages/console`
  后台前端。
- `packages/nexus`
  后端 API 服务。

前后端都在一个仓库里维护，接口类型和权限常量也一起放在仓库里。

## 包职责

### `@xdd-zone/console`

这里负责：

- 后台页面、布局、导航
- 登录态恢复、登录、登出
- 页面权限拦截
- 调用 Nexus 接口并展示结果

这里不负责：

- 单独定义服务端接口
- 复制一套权限常量
- 自己算一套和后端不一致的权限结果

### `@xdd-zone/nexus`

这里负责：

- Elysia app 和模块路由
- 认证、权限、守卫、OpenAPI
- Prisma、日志、配置
- 给前端导出 HTTP 类型和 Eden 类型

这里不负责：

- 维护第二套接口定义

## `packages/nexus` 怎么分层

当前目录：

```text
packages/nexus/src/
├── app.ts
├── server.ts
├── index.ts
├── bootstrap/
├── core/
├── infra/
├── modules/
├── public/
├── shared/
└── eden/
```

### `modules/`

每个业务模块一个目录，`index.ts` 直接写路由。

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

各文件怎么分：

- `index.ts`
  写 prefix、tags、schema 绑定、鉴权声明、`apiDetail(...)`、service 调用。
- `model.ts`
  写 body / query / params / response schema。
- `service.ts`
  写业务判断和流程。
- `repository.ts`
  写 Prisma 查询和写入。

### `core/`

这里放跨业务的能力：

- `core/http`
  CORS、OpenAPI、统一错误处理、请求日志。
- `core/security`
  Better Auth、session、插件、守卫、权限常量和权限判断。
- `core/config`
  读取 `config.yaml`、合并环境变量、返回最终配置。

### `bootstrap/`

这里把配置、日志、认证能力组起来，交给 app 启动。

当前启动顺序：

```text
createConfig()
-> createAppContext()
-> createApp(context)
-> startServer(app, context.config)
```

### `infra/`

这里放基础设施实现：

- Prisma
- logger
- 媒体存储

### `public/`

这里放给前端和其他包直接引用的导出：

- `*-types.ts`
  各模块的 HTTP 类型。
- `permissions.ts`
  权限常量、角色常量、匹配函数。
- `eden.ts`
  `type App = typeof app`。

## `packages/console` 怎么分层

当前最常改的目录：

```text
packages/console/src/
├── app/
├── components/
├── layout/
├── modules/
├── pages/
├── stores/
└── utils/
```

### `app/`

- `app/router`
  路由树、登录守卫、重定向。
- `app/navigation`
  菜单配置。
- `app/access/access-control.ts`
  页面访问控制。
- `app/query-client.ts`
  QueryClient 初始化。

### `modules/`

按业务放 query / mutation 和页面侧逻辑。

当前已有：

- `auth`
- `user`
- `rbac`
- `post`
- `comment`
- `media`
- `preview`
- `site-config`

### `pages/`

按页面入口放组件，比如：

- `pages/dashboard`
- `pages/user`
- `pages/role`
- `pages/article`
- `pages/access`
- `pages/example`
- `pages/auth`
- `pages/error`

## 前后端怎么协作

当前约定很直接：

1. 后端在 `packages/nexus/src/modules/*` 定义接口。
2. OpenAPI 从后端路由和 schema 自动导出。
3. Eden 类型从 `type App = typeof app` 推导。
4. 前端在 `packages/console/src/shared/api/eden.ts` 创建 Treaty 客户端。
5. 页面通过 `modules/*` 里的 query / mutation 调接口。

需要明确 HTTP 类型时，从这些导出拿：

- `@xdd-zone/nexus/auth-types`
- `@xdd-zone/nexus/user-types`
- `@xdd-zone/nexus/rbac-types`
- `@xdd-zone/nexus/post-types`
- `@xdd-zone/nexus/comment-types`
- `@xdd-zone/nexus/media-types`
- `@xdd-zone/nexus/site-config-types`

权限常量统一从 `@xdd-zone/nexus/permissions` 引入。

## 当前认证和权限模型

- 固定角色只有 `superAdmin / user`
- 权限常量以 `packages/nexus/src/core/security/permissions/permissions.ts` 为准
- `own` 只用于当前用户资料相关场景
- 前端页面访问控制走 `packages/console/src/app/access/access-control.ts`
- 后端接口权限校验走 `authPlugin` 或 `accessPlugin`

## 改动时的默认落点

### 新增或调整接口

去 `packages/nexus/src/modules/<feature>/`。

### 新增或调整页面

同时检查：

- `packages/console/src/app/router/routes.tsx`
- `packages/console/src/app/navigation/navigation.ts`
- `packages/console/src/app/access/access-control.ts`
- `packages/console/src/pages/*`
- `packages/console/src/modules/*`

### 新增要给前端复用的类型

去 `packages/nexus/src/public/*-types.ts`。

### 改认证、GitHub 登录、权限

同时检查：

- `packages/nexus/src/core/security/*`
- `packages/nexus/src/modules/auth`
- `packages/console/src/modules/auth`
- `packages/console/src/app/access/access-control.ts`
