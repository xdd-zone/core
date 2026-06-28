# 外部服务接入状态

这份文档记录当前仓库已经写进代码的第三方服务配置。

## 当前已有配置

- `apps/momo` 通过 `better-auth` 配置了 GitHub 登录。
- `apps/momo` 通过 `better-auth` 配置了 Google 登录。
- `apps/momo` 有本地文件存储和腾讯云 COS 驱动。内容模块通过 `POST /rpc/content/assets/images` 上传图片素材。
- `apps/momo` 有禁用搜索驱动和 Meilisearch 搜索驱动，当前还没有搜索接口和业务索引。
- 登录、OAuth callback 和 session cookie 由 `/api/auth/*` 处理。

相关文档：

- [GitHub OAuth](./github-oauth.md)
- [Google OAuth](./google-oauth.md)
- [Meilisearch 搜索](./search/meilisearch.md)
- [腾讯云 COS 对象存储](./storage/tencent-cos.md)

## 当前没有接入的服务

- `apps/momo` 没有短信发送代码。
- `apps/momo` 没有邮件发送代码。
- `apps/fifa` 没有外部服务配置页面。

## 如果以后要加外部服务

先补实际代码，再新增或更新文档。

文档里需要写清：

- 用于什么。
- 代码位置。
- 环境变量。
- 外部服务控制台要配置什么。
- 本地怎么验证。
- 出错时先查什么。
