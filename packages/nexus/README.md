# @xdd-zone/nexus

`@xdd-zone/nexus` 是 XDD Zone Core 的 Elysia API 服务。

## 当前架构

服务端已经切换到 Elysia-first 结构：

```text
src/
├── app.ts
├── server.ts
├── plugins/
├── routes/
├── modules/
├── core/
├── infra/
└── shared/
```

职责划分：

- `plugins/`：框架级能力
- `routes/`：HTTP 路由
- `modules/`：业务逻辑
- `core/`：认证、配置、权限、错误处理
- `infra/`：数据库与日志

## 运行

```bash
bun run dev
```

默认地址：

- API: `http://localhost:7788/api`
- OpenAPI: `http://localhost:7788/openapi`

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

当前职责边界：

- `authPlugin`：获取会话
- `protectedPlugin`：要求登录
- `permissionPlugin + permit`：权限判断

语义：

- 未登录：`401`
- 已登录但无权限：`403`

## 响应约定

- 成功响应直接返回业务数据
- 删除或无 body 接口返回 `204`
- 错误响应统一由错误插件输出

## 开发约定

- route 中直接使用 schema + service
- OpenAPI 统一使用 `apiDetail(...)`

## 相关文档

- [架构说明](../../docs/architecture.md)
- [开发指南](../../docs/development.md)
- [认证说明](../../docs/authentication.md)
- [RBAC 指南](../../docs/rbac.md)
