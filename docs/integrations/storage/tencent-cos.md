# 腾讯云 COS

当前 `apps/momo` 已经接入文件存储驱动层。可以使用本地目录，也可以使用腾讯云 COS。内容模块已经通过素材接口保存图片文件。

## 当前情况

- 存储接口放在 `apps/momo/src/infra/storage/storage.types.ts`。
- 本地存储驱动放在 `apps/momo/src/infra/storage/local-storage.ts`。
- COS 存储驱动放在 `apps/momo/src/infra/storage/cos-storage.ts`。
- 文件名生成和 MIME 白名单放在 `apps/momo/src/infra/storage/media-file.ts`。
- 存储路径校验放在 `apps/momo/src/infra/storage/storage-path.ts`。
- `createRuntime()` 会创建 `runtime.storage`。
- 当前没有 `modules/media`。图片素材接口放在 `apps/momo/src/modules/content/content.route.ts`。

## 腾讯云基础概念

这些概念来自腾讯云 COS 文档，和当前代码里的环境变量一一对应。

- 存储桶是对象的容器。创建存储桶后，才能把文件写进去。当前代码不会创建存储桶，需要先在腾讯云控制台创建。
- `COS_BUCKET` 填完整存储桶名，格式是 `BucketName-APPID`，例如 `examplebucket-1250000000`。
- 对象是 COS 里保存的一个文件。腾讯云 SDK 里用 `Key` 表示对象在桶里的名字。
- 当前代码里的 `storagePath` 就是 COS 对象 `Key`。它由 `COS_KEY_PREFIX`、可选保存目录和生成后的文件名拼出来，例如 `media/<uuid>.png` 或 `media/avatars/<uuid>.png`。读取、删除和查询文件状态前都会检查 `storagePath`，空路径、绝对路径、反斜杠、连续斜杠和 `..` 路径段会按文件不存在处理。
- `COS_REGION` 填存储桶所在地域，例如 `ap-shanghai`。地域要和桶实际所在地域一致。
- `COS_SECRET_ID` 和 `COS_SECRET_KEY` 是腾讯云 API 密钥。当前代码用它们初始化 Node.js SDK。
- 腾讯云建议用临时密钥调用 SDK。如果继续使用永久密钥，需要给子账号设置尽量小的权限范围。
- 上传对象时，腾讯云 SDK 需要 `Bucket`、`Region`、`Key` 和 `Body`。当前代码还会传 `ContentLength` 和 `ContentType`。
- `ContentType` 会作为对象元数据保存。当前代码直接使用 `file.type`。
- `save()` 只保存图片，允许 `image/avif`、`image/gif`、`image/jpeg`、`image/png` 和 `image/webp`，单个文件最大 `10 MiB`。需要保存到子目录时传 `save(file, { directory: 'avatars' })`。
- `stat()` 会调用 `headObject()`，从返回 header 里读取文件大小、MIME 和修改时间。
- 当前代码没有给对象单独设置 `ACL`，对象权限按存储桶配置处理。

参考文档：

- [基本概念](https://cloud.tencent.com/document/product/436/44352)
- [Node.js SDK 快速入门](https://cloud.tencent.com/document/product/436/8629)
- [Node.js SDK 存储桶操作](https://cloud.tencent.com/document/product/436/36118)
- [Node.js SDK 上传对象](https://cloud.tencent.com/document/product/436/64980)

## 环境变量

环境变量读取代码放在 `apps/momo/src/shared/env.ts`。

```text
STORAGE_PROVIDER=local
LOCAL_STORAGE_DIR=
COS_SECRET_ID=
COS_SECRET_KEY=
COS_BUCKET=
COS_REGION=ap-shanghai
MOMO_PUBLIC_BASE_URL=http://localhost:7788
COS_PUBLIC_BASE_URL=
COS_KEY_PREFIX=media
COS_SIGNED_URL_EXPIRES=600
```

- `STORAGE_PROVIDER` 可选 `local` 或 `cos`，默认是 `local`。
- `LOCAL_STORAGE_DIR` 只在本地存储时使用。未设置时写到 `storage/media`。
- `STORAGE_PROVIDER=cos` 时，`COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_BUCKET` 和 `COS_REGION` 必须配置。
- `COS_BUCKET` 使用带 APPID 的桶名。
- `MOMO_PUBLIC_BASE_URL` 用来给本地素材拼 Momo 文件接口地址。
- `COS_PUBLIC_BASE_URL` 配置后，素材响应里的 `fileUrl` 使用公开地址。未配置时，`fileUrl` 使用 Momo 文件接口地址，读取文件时会跳到 COS 临时地址。
- `COS_KEY_PREFIX` 默认是 `media`。
- `COS_SIGNED_URL_EXPIRES` 默认是 `600` 秒，最小值是 `60`。

## 当前图片素材接口

当前文件存储由 content 模块调用：

- `POST /rpc/content/assets/images`
  上传图片素材，需要 `content.asset.upload` 权限。
- `GET /rpc/content/assets`
  读取素材列表，需要 `content.asset.read` 权限。
- `GET /rpc/content/assets/:id`
  读取素材详情，需要 `content.asset.read` 权限。
- `GET /rpc/content/assets/:id/file`
  读取素材文件，不检查后台登录态，给文章正文和预览页使用。
- `PATCH /rpc/content/assets/:id`
  更新素材说明，需要 `content.asset.edit` 权限。
- `DELETE /rpc/content/assets/:id`
  删除素材，需要 `content.asset.delete` 权限。

上传请求用 `multipart/form-data`，字段名是 `file`。文件存入当前 `STORAGE_PROVIDER` 指定的驱动，素材记录写入 `content_assets` 表。

## 验证

存储驱动可以直接跑脚本验证，不需要启动 HTTP 服务：

```bash
cd apps/momo
pnpm storage:test
```

这个脚本会读取 `apps/momo/.env.development`，按 `STORAGE_PROVIDER` 创建存储驱动，然后依次调用 `save()`、`openFile()` 和 `remove()`。

验证 COS 时，先在 `apps/momo/.env.development` 写入这些值：

```text
STORAGE_PROVIDER=cos
COS_SECRET_ID=你的 SecretId
COS_SECRET_KEY=你的 SecretKey
COS_BUCKET=你的 BucketName-APPID
COS_REGION=ap-shanghai
COS_KEY_PREFIX=media
COS_SIGNED_URL_EXPIRES=600
```

脚本验证 COS 时会真实调用 `putObject` 和 `deleteObject`。`openFile()` 只检查返回的 `302` 和 `location`，不会把带签名参数的完整地址打印到终端。单元测试会用 mock client 覆盖 `putObject()`、`deleteObject()`、`getObjectUrl()` 和 `headObject()`，不会访问真实 COS。

单元测试：

```bash
cd apps/momo
pnpm test
```
