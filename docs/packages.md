# 共享包

这份文档说明 `packages/` 下的包分别放什么，以及改共享代码时先看哪些文件。

## 当前包

| 目录 | 包名 | 用途 | 使用方 |
| ---- | ---- | ---- | ------ |
| `packages/contracts` | `@xdd-zone/contracts` | 接口 schema、请求类型、响应类型和业务错误码 | Momo、Fifa |
| `packages/catppuccin-theme` | `@xdd-zone/catppuccin-theme` | Catppuccin 主题变量、色板、颜色工具函数和 Ant Design 主题配置 | Fifa、Bobo |
| `packages/eslint-config` | `@xdd-zone/eslint-config` | 共享 ESLint 和 Prettier 配置 | 当前所有子包 |

## 什么代码放这里

- 两个以上 app 都会 import 的类型、schema、样式变量或配置。
- 不依赖具体页面、路由和运行时状态的代码。
- 可以通过包名直接 import 的代码。

## 什么代码不要放这里

- 只给一个 app 用的函数。
- 页面组件、业务 hooks 和接口请求函数。
- 读取环境变量、文件系统、浏览器存储或 DOM 的代码。
- 和某个 app 目录结构绑定很深的代码。

## `packages/contracts`

`@xdd-zone/contracts` 放 Fifa 和 Momo 都要用的接口约定。

主要文件：

- `packages/contracts/src/common/biz-code.ts`
  放业务错误码。
- `packages/contracts/src/common/response.ts`
  放 `ApiResponse`、`ApiSuccess`、`ApiFailure`、`buildSuccess()` 和 `buildFailure()`。
- `packages/contracts/src/system`
  放系统接口的 schema 和类型。
- `packages/contracts/src/index.ts`
  聚合导出。

Momo 用这里的 schema 校验请求：

```ts
import { PingRequestSchema } from '@xdd-zone/contracts'
```

Fifa 用这里的类型构造请求和读取返回：

```ts
import type { PingRequest, PingResponse } from '@xdd-zone/contracts'
```

改接口请求体、返回体或错误码时，先改这里，再改 Momo route 和 Fifa 调用代码。

检查命令：

```bash
pnpm --filter @xdd-zone/contracts build
pnpm --filter @xdd-zone/contracts type-check
pnpm --filter @xdd-zone/contracts lint
pnpm --filter @xdd-zone/contracts format:check
```

更多内容看：

- [packages/contracts/README.md](../packages/contracts/README.md)
- [topics/api.md](./topics/api.md)

## `packages/catppuccin-theme`

`@xdd-zone/catppuccin-theme` 放 Fifa 和 Bobo 共用的 Catppuccin 主题。

主要文件：

- `packages/catppuccin-theme/styles/core.css`
  放 `data-theme` 会切换的 Catppuccin 颜色变量。
- `packages/catppuccin-theme/styles/fifa.css`
  放 Fifa 使用的 Tailwind 语义 token。
- `packages/catppuccin-theme/styles/bobo.css`
  放 Bobo 使用的 Tailwind 语义 token 和背景变量。
- `packages/catppuccin-theme/src/index.ts`
  导出主题名、默认主题、主题判断和 `data-theme` 写入函数。
- `packages/catppuccin-theme/src/palette.ts`
  导出四个主题的色板和主色读取函数。
- `packages/catppuccin-theme/src/color.ts`
  导出颜色转换和混色函数。
- `packages/catppuccin-theme/src/antd.ts`
  导出 Fifa 使用的 Ant Design 主题配置。

Fifa 引入：

```css
@import '@xdd-zone/catppuccin-theme/styles/fifa.css';
```

Bobo 引入：

```css
@import '@xdd-zone/catppuccin-theme/styles/bobo.css';
```

改主题变量时，先改这里，再到 Fifa 或 Bobo 页面确认实际显示。

检查命令：

```bash
pnpm --filter @xdd-zone/catppuccin-theme build
pnpm --filter @xdd-zone/catppuccin-theme type-check
pnpm --filter @xdd-zone/catppuccin-theme lint
pnpm --filter @xdd-zone/catppuccin-theme format:check
```

更多内容看：

- [packages/catppuccin-theme/README.md](../packages/catppuccin-theme/README.md)
- [topics/theme.md](./topics/theme.md)

## `packages/eslint-config`

`@xdd-zone/eslint-config` 放共享 ESLint 和 Prettier 配置。

主要文件：

- `packages/eslint-config/index.js`
  导出 ESLint 配置。
- `packages/eslint-config/prettier.config.js`
  导出 Prettier 配置。
- `packages/eslint-config/package.json`
  通过 `.` 和 `./prettier` 导出配置文件。

子包使用 ESLint 配置：

```js
import config from '@xdd-zone/eslint-config'

export default config
```

子包使用 Prettier 配置：

```js
export { default } from '@xdd-zone/eslint-config/prettier'
```

改这里会影响所有引用它的子包。先确认规则是否适合所有子包，再改配置。

检查命令：

```bash
pnpm --filter @xdd-zone/eslint-config lint
pnpm --filter @xdd-zone/eslint-config format:check
```

## 新增共享包

新增 `packages/<name>` 时，至少检查这些文件：

- `packages/<name>/package.json`
  写包名、导出入口和脚本。
- `pnpm-workspace.yaml`
  依赖版本优先放在 `catalog` 或 `catalogs`。
- 使用方的 `package.json`
  用 `workspace:*` 引入新包。
- `docs/packages.md`
  记录新包用途、入口文件和检查命令。
- `docs/index.md`
  如果新包有常用入口，在文档入口里补链接。

如果包会被多个 app 直接 import，给它补一个包内 README。
