# bobo

个人站点项目，放在 monorepo 的 `apps/bobo`。

## 位置

- 页面入口在 `app/page.tsx`
- 全局布局在 `app/layout.tsx`
- 全局样式在 `app/globals.css`

## 用法

在 monorepo 根目录执行：

```bash
pnpm dev:bobo
```

开发环境默认使用 `4399` 端口，打开 [http://localhost:4399](http://localhost:4399) 即可查看页面。

生产模式可用下面两个命令：

```bash
pnpm build:bobo
pnpm --filter @xdd-zone/bobo start
```

`@xdd-zone/bobo` 的 `start` 脚本也会使用 `4399` 端口启动服务。

## 输入输出

- 输入：本地修改 `app/` 下的页面、布局和样式文件
- 输出：浏览器里实时看到更新后的站点内容
