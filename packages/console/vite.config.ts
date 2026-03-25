import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * 从 node_modules 路径中提取包名
 */
function getPackageName(id: string): string | null {
  const normalizedId = id.replace(/\\/g, '/')
  const nodeModulesMarker = '/node_modules/'
  const nodeModulesIndex = normalizedId.lastIndexOf(nodeModulesMarker)

  if (nodeModulesIndex === -1) return null

  const packagePath = normalizedId.slice(nodeModulesIndex + nodeModulesMarker.length)
  const [scopeOrName, maybeName] = packagePath.split('/')

  if (!scopeOrName) return null

  if (scopeOrName.startsWith('@') && maybeName) {
    return `${scopeOrName}/${maybeName}`
  }

  return scopeOrName
}

export default defineConfig(({ mode }) => {
  // 载入 .env.[mode] 环境变量
  const env = loadEnv(mode, process.cwd())

  return {
    build: {
      // 静态资源目录
      assetsDir: 'assets',
      // chunk 大小警告限制
      chunkSizeWarningLimit: 1500,
      // CSS 代码分割
      cssCodeSplit: true,
      // 清理输出目录
      emptyOutDir: true,
      // 压缩器选择
      minify: 'esbuild',
      // 输出目录
      outDir: 'dist',
      // 启用 gzip 压缩大小报告
      reportCompressedSize: true,
      // rollup 打包配置
      rollupOptions: {
        output: {
          // 静态资源文件命名
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name || ''
            const ext = path.extname(info).slice(1)

            // CSS 文件
            if (ext === 'css') {
              return 'css/[name]-[hash][extname]'
            }
            // 图片文件
            if (/^(?:png|jpe?g|svg|gif|webp|avif|ico)$/.test(ext)) {
              return 'images/[name]-[hash][extname]'
            }
            // 字体文件
            if (/^(?:woff2?|eot|ttf|otf)$/.test(ext)) {
              return 'fonts/[name]-[hash][extname]'
            }
            // 其他静态资源
            return 'assets/[name]-[hash][extname]'
          },
          // chunk 文件命名
          chunkFileNames: 'js/[name]-[hash].js',
          // 入口文件命名
          entryFileNames: 'js/[name]-[hash].js',
          // 代码分割策略
          manualChunks: (id) => {
            const packageName = getPackageName(id)

            if (!packageName) return

            // React 运行时相关包放在一起，避免跨 chunk 循环依赖
            if (['react', 'react-dom', 'scheduler', 'react-is'].includes(packageName)) {
              return 'vendor-react'
            }
            // Ant Design 生态包统一归组
            if (
              packageName === 'antd' ||
              packageName.startsWith('@ant-design/') ||
              packageName.startsWith('@rc-component/') ||
              packageName.startsWith('rc-')
            ) {
              return 'vendor-antd'
            }
            // i18n 相关
            if (packageName === 'i18next' || packageName === 'react-i18next') {
              return 'vendor-i18n'
            }
            // Zustand 状态管理
            if (packageName === 'zustand') {
              return 'vendor-zustand'
            }
            // TanStack 相关包独立分组，减少首屏入口压力
            if (packageName.startsWith('@tanstack/')) {
              return 'vendor-tanstack'
            }
          },
        },
      },
      // 开发阶段建议开启 sourcemap，便于调试
      sourcemap: mode === 'development',
      // 构建目标
      target: 'es2020',
    },
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
      postcss: {
        plugins: [],
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@console': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // 允许通过域名访问（用于反向代理）
      allowedHosts: ['console.xdd.ink', '.xdd.ink'],
      host: true,
      open: true,
      port: 2333,
      proxy: {
        '/api': {
          changeOrigin: true,
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:7788',
        },
      },
    },
  }
})
