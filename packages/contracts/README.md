# @xdd-zone/contracts

`@xdd-zone/contracts` 放 Console 和 Nexus 共用的接口类型、schema 和响应结构。

这个包不能调用 Node.js 或浏览器 API。不要在这里 import `node:*`，也不要直接使用 `window`、`document`、`localStorage` 或 `sessionStorage`。

## 当前内容

- `src/common/biz-code.ts`
  业务错误码。
- `src/common/response.ts`
  `ApiResponse`、`ApiSuccess`、`ApiFailure`、`buildSuccess()` 和 `buildFailure()`。
- `src/system`
  系统接口的 schema 和类型。
- `src/index.ts`
  聚合导出。

## 使用方式

Nexus 用 schema 校验请求：

```ts
import { PingRequestSchema } from '@xdd-zone/contracts'
```

Console 用类型构造请求和读取返回：

```ts
import type { PingRequest, PingResponse } from '@xdd-zone/contracts'
```
