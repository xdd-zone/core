# 后台底座优先 V1 需求文档

## 1. 背景

当前仓库已经具备认证、用户、RBAC 等基础能力，但整体设计仍混杂了“博客产品起步阶段的尝试”和“通用后台底座的能力预研”。本次需求以“后台底座优先”为唯一目标，对现有模型、权限、接口和文案进行统一收口。

## 2. 目标

本次仅解决以下问题：

1. 提供稳定的身份认证与会话能力。
2. 提供最小可用的后台用户管理与角色分配能力。
3. 为后续博客、项目、内容等业务模块预留统一接入方式。

## 3. 产品定位

本项目当前阶段定位为：

- 一个服务于“博客 + 后续业务模块”的后台 API 底座
- 不是博客业务本身
- 不是动态权限平台
- 不是多租户/组织架构平台

## 4. 范围

### 4.1 本次范围内

- 身份域：`User / Account / Session / Verification`
- 访问控制域：`Role / Permission / UserRole / RolePermission`
- 最小权限集合
- 固定系统角色
- 用户启用、禁用、封禁、归档语义
- 当前文档、代码、接口文案同步收口

### 4.2 本次范围外

- 博客文章、分类、标签、评论等业务模型
- 多租户、组织、部门、项目空间
- 角色继承体系
- 动态权限创建、编辑、删除平台
- 对旧接口、旧模型、旧文案的兼容层

## 5. 核心需求

### 5.1 身份能力

- 用户支持注册、登录、会话获取、登出。
- 用户拥有平台级基础资料：`name / image / email / username / phone`。
- 用户状态至少支持：`ACTIVE / INACTIVE / BANNED`。
- 用户资料与业务资料解耦，用户模型不承载博客业务属性。

### 5.2 后台管理能力

- 管理员可以查看用户列表和用户详情。
- 管理员可以更新用户基础信息和状态。
- 管理员可以为用户分配、移除角色。
- 管理员可以查看指定用户角色和权限。
- 当前登录用户可以查看并更新自己的基础资料。
- 当前登录用户可以查看自己的角色和权限。

### 5.4 接口保留范围

V1 保留以下接口能力：

- 注册、登录、登出、获取会话
- `GET /api/user/me`
- `PATCH /api/user/me`
- `GET /api/user`
- `GET /api/user/:id`
- `PATCH /api/user/:id`
- `PATCH /api/user/:id/status`
- `GET /api/rbac/roles`
- `GET /api/rbac/users/:userId/roles`
- `POST /api/rbac/users/:userId/roles`
- `DELETE /api/rbac/users/:userId/roles/:roleId`
- `GET /api/rbac/users/:userId/permissions`
- `GET /api/rbac/users/me/roles`
- `GET /api/rbac/users/me/permissions`

### 5.3 权限能力

- 权限模型用于表达“允许做什么”，不负责表达“资源是否属于当前用户”。
- 资源归属判断由具体业务模块负责。
- V1 仅保留最小权限集合，不开放角色继承和动态权限平台能力。

## 6. 最小权限集合

建议 V1 固定为以下集合：

- `user:read:own`
- `user:update:own`
- `user:read:all`
- `user:update:all`
- `user:disable:all`
- `role:read:all`
- `user_role:assign:all`
- `user_role:revoke:all`
- `user_permission:read:own`
- `user_permission:read:all`
- `system:manage`

## 7. 固定角色集合

V1 固定为以下系统角色：

- `superAdmin`
- `admin`
- `user`

说明：

- `superAdmin` 为平台级超级管理员。
- `admin` 为后台管理员。
- `user` 为普通登录用户。
- 本次不支持后台动态创建系统外角色。

## 8. 用户生命周期要求

- 默认不使用硬删除作为常规业务动作。
- 用户停用通过 `INACTIVE` 表达。
- 用户封禁通过 `BANNED` 表达。
- `deletedAt` 仅用于归档/逻辑删除语义，不用于日常管理入口。

## 9. 硬约束

### 9.1 不做兼容

本次所有与目标不一致的旧设计，直接清理，不保留兼容方案，包括但不限于：

- 旧权限定义
- 旧 RBAC 路由能力
- 旧接口文案
- 旧模型注释
- 旧实现分支

### 9.2 不保留历史包袱

- 不为了兼容旧调用继续保留错误语义。
- 不为了兼容旧模型继续保留无效字段语义。
- 不为了兼容旧权限继续保留无实际用途的常量和接口。

## 10. 成功标准

满足以下条件视为本次需求完成：

1. 模型边界清晰，身份域与访问控制域职责明确。
2. 权限集收敛为最小可用集合。
3. 固定角色可覆盖当前后台需求。
4. 旧的无效代码、无效接口、无效文案已移除。
5. 文档、实现、验收标准一致。
