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
2. [apps/momo.md](./apps/momo.md)
3. [topics/api.md](./topics/api.md)

代码入口：

- `apps/momo/src/bootstrap/create-app.ts`
- `apps/momo/src/routes/index.ts`
- `apps/momo/src/modules/<module>/<module>.route.ts`

新增接口按 [apps/momo.md](./apps/momo.md) 里的模块目录放。

## 要改 Fifa 前端

先看：

1. [apps/fifa.md](./apps/fifa.md)
2. [topics/theme.md](./topics/theme.md)
3. [apps/fifa/README.md](../apps/fifa/README.md)

代码入口：

- `apps/fifa/src/app/router`
- `apps/fifa/src/app/navigation`
- `apps/fifa/src/features`
- `apps/fifa/src/api`
- `apps/fifa/src/layout`

## 要改 Bobo 个人站点

先看：

1. [apps/bobo.md](./apps/bobo.md)
2. [apps/bobo/README.md](../apps/bobo/README.md)

代码入口：

- `apps/bobo/app/layout.tsx`
- `apps/bobo/app/page.tsx`
- `apps/bobo/app/globals.css`
- `apps/bobo/app/styles`

## 要改共享包

先看：

1. [packages.md](./packages.md)

如果是接口约定或主题相关，再看：

- 接口约定：[topics/api.md](./topics/api.md)
- 主题系统：[topics/theme.md](./topics/theme.md)

代码入口：

- `packages/contracts`
- `packages/catppuccin-theme`
- `packages/eslint-config`

## 第三方服务

当前第三方服务状态看：

- GitHub OAuth：[integrations/github-oauth.md](./integrations/github-oauth.md)
- Google OAuth：[integrations/google-oauth.md](./integrations/google-oauth.md)
- Meilisearch 搜索：[integrations/search/meilisearch.md](./integrations/search/meilisearch.md)
- 外部服务：[integrations/index.md](./integrations/index.md)

## 目录结构

```text
docs/
├── apps/
├── topics/
├── integrations/
├── architecture.md
├── development.md
├── packages.md
├── testing.md
├── skills.md
└── faq.md
```

- `apps/` 放每个应用自己的说明。
- `topics/` 放主题、API 这类多个应用都会碰到的说明。
- `integrations/` 放第三方服务接入说明。

## 其他文档

- [testing.md](./testing.md)：测试目录设计、编写规则和检查命令。
- [development/code-server.md](./development/code-server.md)：code-server 代理访问本机服务的命令和地址。
- [packages.md](./packages.md)：共享包目录、包边界和检查命令。
- [apps/momo.md](./apps/momo.md)：Momo 后端目录和新增接口规则。
- [apps/bobo.md](./apps/bobo.md)：Bobo 个人站点目录、命令和维护规则。
- [skills.md](./skills.md)：仓库常用技能顺序。
- [faq.md](./faq.md)：当前常见问题。
