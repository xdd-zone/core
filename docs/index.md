# 文档入口

这份文档只告诉你现在先看哪几份文档。

## 第一次进仓库

按这个顺序读：

1. [README.md](../README.md)
2. [architecture.md](./architecture.md)
3. [development.md](./development.md)
4. [topics/api.md](./topics/api.md)

## 要改后端接口

先看：

1. [development.md](./development.md)
2. [apps/nexus.md](./apps/nexus.md)
3. [topics/api.md](./topics/api.md)

代码入口：

- `apps/nexus/src/app.ts`
- `apps/nexus/src/routes/index.ts`

新增接口按 [apps/nexus.md](./apps/nexus.md) 里的模块目录放。

## 要改 Console 前端

先看：

1. [apps/console.md](./apps/console.md)
2. [topics/theme.md](./topics/theme.md)
3. [apps/console/README.md](../apps/console/README.md)

代码入口：

- `apps/console/src/app/router`
- `apps/console/src/app/navigation`
- `apps/console/src/features`
- `apps/console/src/api`
- `apps/console/src/layout`

## 要改 Bobo 个人站点

先看：

1. [apps/bobo.md](./apps/bobo.md)
2. [apps/bobo/README.md](../apps/bobo/README.md)

代码入口：

- `apps/bobo/app/layout.tsx`
- `apps/bobo/app/page.tsx`
- `apps/bobo/app/globals.css`
- `apps/bobo/app/styles`

## 当前没有实现的内容

这些旧专题目前没有对应代码：

- 认证：[topics/authentication.md](./topics/authentication.md)
- GitHub OAuth：[integrations/github-oauth.md](./integrations/github-oauth.md)
- RBAC：[topics/rbac.md](./topics/rbac.md)
- 外部服务：[integrations/index.md](./integrations/index.md)

## 目录结构

```text
docs/
├── apps/
├── topics/
├── integrations/
├── architecture.md
├── development.md
├── testing.md
├── skills.md
└── faq.md
```

- `apps/` 放每个应用自己的说明。
- `topics/` 放登录、权限、主题、API 这类多个应用都会碰到的说明。
- `integrations/` 放第三方服务接入说明。

## 其他文档

- [testing.md](./testing.md)：当前可跑的检查命令。
- [apps/nexus.md](./apps/nexus.md)：Nexus 后端目录和新增接口规则。
- [apps/bobo.md](./apps/bobo.md)：Bobo 个人站点目录、命令和维护规则。
- [skills.md](./skills.md)：仓库常用技能顺序。
- [faq.md](./faq.md)：当前常见问题。
