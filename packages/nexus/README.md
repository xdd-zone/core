# @xdd-zone/nexus

`@xdd-zone/nexus` 是 XDD Zone Core 的 Elysia API 服务。

## 架构

服务端采用 Elysia-first 结构：

```text
src/
├── index.ts
├── app.ts
├── server.ts
├── routes/
├── modules/
├── core/
├── infra/
├── shared/
└── eden/
```

职责划分：

- `routes/`：HTTP 路由
- `modules/`：业务逻辑
- `core/http/`：HTTP 基础能力与应用装配
- `core/access-control/`：鉴权与权限声明
- `core/`：认证、配置、权限、错误处理等核心能力
- `infra/`：数据库与日志
- `eden/`：仓库内联调与 smoke test

## 运行

```bash
bun run dev
```

默认地址：

- API: `http://localhost:7788/api`
- OpenAPI UI: `http://localhost:7788/openapi`
- OpenAPI JSON: `http://localhost:7788/openapi/json`

## 常用命令

```bash
bun run dev
bun run build
bun run test
bun run type-check
bun run prisma:generate
bun run prisma:migrate
bun run prisma:push
bun run prisma:reset
bun run seed
```

## 鉴权与权限

职责边界：

- `authPlugin`：获取会话，并支持 `auth: 'required'`
- `permissionPlugin`：组合 `authPlugin`，并负责 `permission`、`own`、`me` 判断
- `permit.*`：权限宏内部复用的低层工具，不作为 route 主入口

语义：

- 未登录：`401`
- 已登录但无权限：`403`

## 响应约定

- 成功响应直接返回业务数据
- 删除或无 body 接口返回 `204`
- 错误响应统一由错误插件输出

## 开发约定

- route 中直接使用接口定义 schema + service
- 全局应用装配通过 `core/http` 收口
- 路由鉴权优先使用 `auth: 'required'`、`permission`、`own`、`me`
- OpenAPI 统一使用 `apiDetail(...)`

## 相关文档

- [架构说明](../../docs/architecture.md)
- [开发指南](../../docs/development.md)
- [认证说明](../../docs/authentication.md)
- [RBAC 指南](../../docs/rbac.md)
