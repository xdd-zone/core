# 文档入口

这份文档用于说明当前仓库的阅读顺序，以及不同角色进入项目时应该先看什么。

## 如果你第一次进入这个仓库

推荐按下面顺序阅读：

1. [README.md](/Users/wuwanzhu/Code/xdd/core/README.md)
2. [architecture.md](/Users/wuwanzhu/Code/xdd/core/docs/architecture.md)
3. [development.md](/Users/wuwanzhu/Code/xdd/core/docs/development.md)
4. 按关注点继续看：
   - [authentication.md](/Users/wuwanzhu/Code/xdd/core/docs/authentication.md)
   - [rbac.md](/Users/wuwanzhu/Code/xdd/core/docs/rbac.md)
   - [api.md](/Users/wuwanzhu/Code/xdd/core/docs/api.md)
   - [testing.md](/Users/wuwanzhu/Code/xdd/core/docs/testing.md)

## 如果你要开始写后端代码

先看：

1. [development.md](/Users/wuwanzhu/Code/xdd/core/docs/development.md)
2. [architecture.md](/Users/wuwanzhu/Code/xdd/core/docs/architecture.md)
3. [authentication.md](/Users/wuwanzhu/Code/xdd/core/docs/authentication.md)
4. [rbac.md](/Users/wuwanzhu/Code/xdd/core/docs/rbac.md)

然后再进入代码目录：

- `packages/nexus/src/routes`
- `packages/nexus/src/plugins`
- `packages/nexus/src/modules`
- `packages/schema/src/contracts`

## 如果你要使用 client SDK

先看：

1. [packages/client/README.md](/Users/wuwanzhu/Code/xdd/core/packages/client/README.md)
2. [api.md](/Users/wuwanzhu/Code/xdd/core/docs/api.md)
3. [authentication.md](/Users/wuwanzhu/Code/xdd/core/docs/authentication.md)

重点关注：

- 成功响应直接返回业务数据
- `401` 与 `403` 的区别
- cookie 自动管理
- `requestRaw(...)` 的使用场景

## 如果你要修改 schema / 协议

先看：

1. [packages/schema/README.md](/Users/wuwanzhu/Code/xdd/core/packages/schema/README.md)
2. [api.md](/Users/wuwanzhu/Code/xdd/core/docs/api.md)
3. [development.md](/Users/wuwanzhu/Code/xdd/core/docs/development.md)

修改时优先检查三处是否一致：

- `packages/schema`
- `packages/nexus`
- `packages/client`

## 如果你要排查权限问题

先看：

1. [authentication.md](/Users/wuwanzhu/Code/xdd/core/docs/authentication.md)
2. [rbac.md](/Users/wuwanzhu/Code/xdd/core/docs/rbac.md)
3. [testing.md](/Users/wuwanzhu/Code/xdd/core/docs/testing.md)

建议验证顺序：

1. `/api/auth/get-session`
2. 当前接口是 `401` 还是 `403`
3. route 使用的是 `protectedPlugin` 还是 `permissionPlugin`
4. `permit.permission / permit.own / permit.me` 是否用对

## 当前文档集合

- [architecture.md](/Users/wuwanzhu/Code/xdd/core/docs/architecture.md)：当前架构
- [api.md](/Users/wuwanzhu/Code/xdd/core/docs/api.md)：协议与接口
- [authentication.md](/Users/wuwanzhu/Code/xdd/core/docs/authentication.md)：认证与登录态
- [rbac.md](/Users/wuwanzhu/Code/xdd/core/docs/rbac.md)：权限模型与路由写法
- [development.md](/Users/wuwanzhu/Code/xdd/core/docs/development.md)：开发流程
- [testing.md](/Users/wuwanzhu/Code/xdd/core/docs/testing.md)：测试与回归
- [faq.md](/Users/wuwanzhu/Code/xdd/core/docs/faq.md)：常见问题
- [skills.md](/Users/wuwanzhu/Code/xdd/core/docs/skills.md)：项目级 Skill 与代码生成约定
