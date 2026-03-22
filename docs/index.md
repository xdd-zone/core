# 文档入口

这份文档用于说明仓库的阅读顺序，以及不同任务下应先看哪些文档。

## 最先阅读

如果你第一次进入这个仓库，推荐按下面顺序看：

1. [README.md](/Users/wuwanzhu/Code/xdd/core/README.md)
2. [architecture.md](/Users/wuwanzhu/Code/xdd/core/docs/architecture.md)
3. [development.md](/Users/wuwanzhu/Code/xdd/core/docs/development.md)
4. [api.md](/Users/wuwanzhu/Code/xdd/core/docs/api.md)

然后再按关注点补：

- [authentication.md](/Users/wuwanzhu/Code/xdd/core/docs/authentication.md)
- [rbac.md](/Users/wuwanzhu/Code/xdd/core/docs/rbac.md)
- [testing.md](/Users/wuwanzhu/Code/xdd/core/docs/testing.md)

## 如果你要了解架构设计背景

优先阅读：

1. [Elysia-First 设计总览](/Users/wuwanzhu/Code/xdd/core/docs/design/elysia-first-refactor/README.md)
2. [原则与关键决策](/Users/wuwanzhu/Code/xdd/core/docs/design/elysia-first-refactor/01-principles-and-decisions.md)
3. [目标架构](/Users/wuwanzhu/Code/xdd/core/docs/design/elysia-first-refactor/02-target-architecture.md)
4. [开发作战手册](/Users/wuwanzhu/Code/xdd/core/docs/design/elysia-first-refactor/07-development-playbook.md)
5. [实施进度](/Users/wuwanzhu/Code/xdd/core/docs/design/elysia-first-refactor/08-implementation-progress.md)

## 如果你要开始写后端代码

优先阅读：

1. [development.md](/Users/wuwanzhu/Code/xdd/core/docs/development.md)
2. [architecture.md](/Users/wuwanzhu/Code/xdd/core/docs/architecture.md)
3. [authentication.md](/Users/wuwanzhu/Code/xdd/core/docs/authentication.md)
4. [rbac.md](/Users/wuwanzhu/Code/xdd/core/docs/rbac.md)

再看代码目录：

- `packages/nexus/src/routes`
- `packages/nexus/src/modules`
- `packages/nexus/src/core/access-control`
- `packages/nexus/src/core/http`
- `packages/nexus/src/modules/*/*.contract.ts`

## 如果你要修改 HTTP 接口定义

优先阅读：

1. [api.md](/Users/wuwanzhu/Code/xdd/core/docs/api.md)
2. [development.md](/Users/wuwanzhu/Code/xdd/core/docs/development.md)
3. [01-principles-and-decisions.md](/Users/wuwanzhu/Code/xdd/core/docs/design/elysia-first-refactor/01-principles-and-decisions.md)

修改后至少检查：

- `packages/nexus`
- OpenAPI 导出
- Eden smoke

## 如果你要排查权限问题

优先阅读：

1. [authentication.md](/Users/wuwanzhu/Code/xdd/core/docs/authentication.md)
2. [rbac.md](/Users/wuwanzhu/Code/xdd/core/docs/rbac.md)
3. [testing.md](/Users/wuwanzhu/Code/xdd/core/docs/testing.md)

建议排查顺序：

1. `/api/auth/get-session`
2. 问题是 `401` 还是 `403`
3. route 用的是 `auth: 'required'`、`permission`、`own` 还是 `me`
4. Eden smoke 与 Nexus 测试是否已覆盖

## 文档集合

- [README.md](/Users/wuwanzhu/Code/xdd/core/README.md)：仓库总览
- [architecture.md](/Users/wuwanzhu/Code/xdd/core/docs/architecture.md)：架构说明
- [development.md](/Users/wuwanzhu/Code/xdd/core/docs/development.md)：开发流程与标准动作
- [api.md](/Users/wuwanzhu/Code/xdd/core/docs/api.md)：HTTP 接口与端点概览
- [authentication.md](/Users/wuwanzhu/Code/xdd/core/docs/authentication.md)：认证与登录态
- [rbac.md](/Users/wuwanzhu/Code/xdd/core/docs/rbac.md)：权限模型与声明式写法
- [testing.md](/Users/wuwanzhu/Code/xdd/core/docs/testing.md)：测试分层与回归命令
- [skills.md](/Users/wuwanzhu/Code/xdd/core/docs/skills.md)：项目级 Skill 与代码生成约定
- [faq.md](/Users/wuwanzhu/Code/xdd/core/docs/faq.md)：常见问题
