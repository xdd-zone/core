# @xdd-zone/console

`@xdd-zone/console` 是 XDD Zone Core 的后台管理前端。

## 这个包负责什么

- 后台页面、布局、导航
- 登录页和登录态恢复
- 页面访问控制
- 调用 Nexus 接口并展示结果
- 主题切换和示例页

## 开发前先看

只要任务涉及页面、布局、导航或展示型组件，先看：

1. `packages/console/design-context.md`
2. `docs/console.md`
3. `docs/theme.md`

## 常用命令

```bash
cd packages/console

bun run dev
bun run build
bun run preview
bun run lint
bun run lint:fix
bun run format
bun run format:check
bun run type-check
```

## 目录结构

```text
src/
├── app/
├── components/
├── layout/
├── modules/
├── pages/
├── stores/
└── utils/
```

最常改的目录：

- `app/router`
  路由树、登录守卫、重定向。
- `app/navigation`
  菜单配置。
- `app/access/access-control.ts`
  页面访问控制。
- `modules/auth`
  登录、登出、session 查询。
- `modules/user`
  用户相关请求。
- `modules/rbac`
  角色和权限相关请求。
- `pages/*`
  页面入口。

## 当前页面路径

- `/login`
- `/dashboard`
- `/users`
- `/users/$id`
- `/users/$id/edit`
- `/users/$id/access`
- `/roles`
- `/profile`
- `/my-access`
- `/articles`
- `/articles/new`
- `/articles/$id`
- `/articles/$id/edit`
- `/categories`
- `/tags`
- `/comments`
- `/article-settings`
- `/ui-showcase`
- `/markdown-example`
- `/tiptap-example`
- `/image-crop`
- `/error-example`
- `/forbidden-example`
- `/not-found-example`

## 前后端怎么协作

- 前端统一通过 `packages/console/src/shared/api/eden.ts` 调接口
- 需要明确 HTTP 类型时，从 `@xdd-zone/nexus/*-types` 引入
- 权限常量和匹配函数从 `@xdd-zone/nexus/permissions` 引入
- 页面访问控制看 `packages/console/src/app/access/access-control.ts`
- GitHub 登录走浏览器重定向，不走普通 JSON 请求

## 新增页面时通常要改哪几处

1. `packages/console/src/app/router/routes.tsx`
2. `packages/console/src/app/navigation/navigation.ts`
3. `packages/console/src/app/access/access-control.ts`
4. `packages/console/src/modules/<feature>/`
5. `packages/console/src/pages/<feature>/`

## 相关文档

- [仓库 README](../../README.md)
- [Console 前端指南](../../docs/console.md)
- [主题系统](../../docs/theme.md)
- [开发指南](../../docs/development.md)
- [Eden 指南](../../docs/eden.md)
