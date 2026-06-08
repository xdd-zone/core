# 文档入口

这份文档只告诉你现在先看哪几份文档。

## 第一次进仓库

按这个顺序读：

1. [README.md](../README.md)
2. [architecture.md](./architecture.md)
3. [development.md](./development.md)
4. [api.md](./api.md)

## 要改后端接口

先看：

1. [development.md](./development.md)
2. [nexus.md](./nexus.md)
3. [api.md](./api.md)

代码入口：

- `apps/nexus/src/app.ts`
- `apps/nexus/src/routes/index.ts`

新增接口按 [nexus.md](./nexus.md) 里的模块目录放。

## 要改 Console 前端

先看：

1. [console.md](./console.md)
2. [theme.md](./theme.md)
3. [apps/console/README.md](../apps/console/README.md)

代码入口：

- `apps/console/src/app/router`
- `apps/console/src/app/navigation`
- `apps/console/src/features`
- `apps/console/src/layout`

## 当前没有实现的内容

这些旧专题目前没有对应代码：

- 认证：[authentication.md](./authentication.md)
- GitHub OAuth：[OAuth2/github.md](./OAuth2/github.md)
- RBAC：[rbac.md](./rbac.md)
- 外部服务：[integrations/index.md](./integrations/index.md)

## 其他文档

- [testing.md](./testing.md)：当前可跑的检查命令。
- [nexus.md](./nexus.md)：Nexus 后端目录和新增接口规则。
- [skills.md](./skills.md)：仓库常用技能顺序。
- [faq.md](./faq.md)：当前常见问题。
