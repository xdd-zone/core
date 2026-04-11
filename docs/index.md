# 文档入口

这份文档只做一件事：告诉你现在该先看哪份文档。

## 第一次进仓库

按这个顺序读：

1. [README.md](../README.md)
2. [architecture.md](./architecture.md)
3. [development.md](./development.md)
4. [api.md](./api.md)
5. [eden.md](./eden.md)

## 要改后端接口

先看：

1. [development.md](./development.md)
2. [architecture.md](./architecture.md)
3. [api.md](./api.md)
4. [eden.md](./eden.md)

如果还碰到认证或权限，再补：

- [authentication.md](./authentication.md)
- [rbac.md](./rbac.md)

代码入口：

- `packages/nexus/src/modules`
- `packages/nexus/src/core/security`
- `packages/nexus/src/public`

## 要改 Console 前端

先看：

1. [console.md](./console.md)
2. [theme.md](./theme.md)
3. [development.md](./development.md)
4. [eden.md](./eden.md)
5. [packages/console/README.md](../packages/console/README.md)

代码入口：

- `packages/console/src/app/router`
- `packages/console/src/app/navigation`
- `packages/console/src/app/access/access-control.ts`
- `packages/console/src/modules`
- `packages/console/src/pages`

## 要改认证或 GitHub 登录

先看：

1. [authentication.md](./authentication.md)
2. [OAuth2/github.md](./OAuth2/github.md)
3. [console.md](./console.md)
4. [api.md](./api.md)

代码入口：

- `packages/nexus/src/core/security/auth`
- `packages/nexus/src/modules/auth`
- `packages/console/src/modules/auth`
- `packages/console/src/pages/auth/Login.tsx`

## 要改权限

先看：

1. [rbac.md](./rbac.md)
2. [authentication.md](./authentication.md)
3. [testing.md](./testing.md)

代码入口：

- `packages/nexus/src/core/security/permissions`
- `packages/nexus/src/core/security/plugins/access.plugin.ts`
- `packages/nexus/src/core/security/guards`
- `packages/console/src/app/access/access-control.ts`

## 要排查联调问题

先看：

1. [eden.md](./eden.md)
2. [api.md](./api.md)
3. [authentication.md](./authentication.md)
4. [faq.md](./faq.md)

排查顺序：

1. 先看请求是不是打到了正确的 `/api/*`
2. 再看 `/api/auth/get-session` 有没有拿到登录态
3. 再区分是 `401` 还是 `403`
4. 最后看 OpenAPI、Eden smoke 和前端路由守卫

## 其他文档

- [console.md](./console.md)：前端结构、路由、导航、页面入口
- [theme.md](./theme.md)：主题、颜色类名、切换方式
- [skills.md](./skills.md)：仓库常用技能和使用顺序
- [testing.md](./testing.md)：测试、数据库、回归命令
- [faq.md](./faq.md)：常见问题
