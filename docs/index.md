# 文档入口

这份文档用于说明仓库的阅读顺序，以及不同任务下应先看哪些文档。

## 最先阅读

如果你第一次进入这个仓库，推荐按下面顺序看：

1. [README.md](../README.md)
2. [architecture.md](./architecture.md)
3. [development.md](./development.md)
4. [api.md](./api.md)

然后再按关注点补：

- [console.md](./console.md)
- [authentication.md](./authentication.md)
- [OAuth2/github.md](./OAuth2/github.md)
- [rbac.md](./rbac.md)
- [testing.md](./testing.md)

## 如果你要开始写后端代码

优先阅读：

1. [development.md](./development.md)
2. [architecture.md](./architecture.md)
3. [authentication.md](./authentication.md)
4. [rbac.md](./rbac.md)

再看代码目录：

- `packages/nexus/src/modules`
- `packages/nexus/src/core/security`
- `packages/nexus/src/core/http`
- `packages/nexus/src/modules/*/model.ts`

## 如果你要修改后台前端

优先阅读：

1. [console.md](./console.md)
2. [packages/console/README.md](../packages/console/README.md)
3. [theme.md](./theme.md)
4. [authentication.md](./authentication.md)
5. [development.md](./development.md)

再看代码目录：

- `packages/console/src/app/router`
- `packages/console/src/app/query-client.ts`
- `packages/console/src/app/navigation`
- `packages/console/src/modules/auth`
- `packages/console/src/modules/user`
- `packages/console/src/modules/rbac`
- `packages/console/src/layout`
- `packages/console/src/pages/user`
- `packages/console/src/pages/role`
- `packages/console/src/pages/access`
- `packages/console/src/pages`

## 如果你要修改 HTTP 接口定义

优先阅读：

1. [api.md](./api.md)
2. [development.md](./development.md)
3. [architecture.md](./architecture.md)

修改后至少检查：

- `packages/nexus`
- `/openapi`
- Eden smoke

## 如果你要处理 GitHub 登录或登录后的 Dashboard 页面权限

优先阅读：

1. [authentication.md](./authentication.md)
2. [OAuth2/github.md](./OAuth2/github.md)
3. [console.md](./console.md)
4. [development.md](./development.md)
5. [api.md](./api.md)

再看代码目录：

- `packages/nexus/src/core/security/auth`
- `packages/console/src/app/router`
- `packages/console/src/pages/auth`
- `packages/console/src/pages/dashboard`

## 如果你要排查权限问题

优先阅读：

1. [authentication.md](./authentication.md)
2. [rbac.md](./rbac.md)
3. [testing.md](./testing.md)

建议排查顺序：

1. `/api/auth/get-session`
2. `/api/rbac/users/me/permissions`
3. 问题是 `401` 还是 `403`
4. route 用的是 `auth: 'required'`、`permission`、`own` 还是 `me`
5. 如果涉及 GitHub 登录，再检查 callback URL、`trustedOrigins`、API 基址是否正确，并确认浏览器可以直接访问这条地址；本地开发再检查 `/api` 代理
6. Eden smoke 与 Nexus 测试是否已覆盖

## 文档集合

- [README.md](../README.md)：仓库总览
- [architecture.md](./architecture.md)：架构说明
- [console.md](./console.md)：后台前端架构与开发说明
- [packages/console/README.md](../packages/console/README.md)：Console 包说明与页面入口
- [development.md](./development.md)：开发流程与标准动作
- [api.md](./api.md)：HTTP 接口与端点概览
- [authentication.md](./authentication.md)：认证与登录态
- [OAuth2/github.md](./OAuth2/github.md)：GitHub OAuth App 创建、参数获取和项目接入
- [rbac.md](./rbac.md)：权限模型与声明式写法
- [testing.md](./testing.md)：测试分层与回归命令
- [skills.md](./skills.md)：项目级 Skill 与代码生成约定
- [theme.md](./theme.md)：主题系统与颜色命名
- [faq.md](./faq.md)：常见问题
