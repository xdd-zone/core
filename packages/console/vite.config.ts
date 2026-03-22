import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // 载入 .env.[mode] 环境变量
  const env = loadEnv(mode, process.cwd())

  return {
    build: {
      // 静态资源目录
      assetsDir: 'assets',
      // chunk 大小警告限制 (提高到 6000kb，Shiki 按需加载所有语言包会很大，这是正常的)
      chunkSizeWarningLimit: 6000,
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
            // React 相关库
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react'
            }
            // Ant Design
            if (id.includes('node_modules/antd')) {
              return 'vendor-antd'
            }
            // 路由相关
            if (id.includes('node_modules/react-router')) {
              return 'vendor-router'
            }
            // Shiki 语法高亮器 - 按语言分组
            if (id.includes('node_modules/shiki') || id.includes('node_modules/@shikijs')) {
              // 核心库
              if (id.includes('/core') || id.includes('/engine')) {
                return 'shiki-core'
              }
              // 语言包 - 按大小分组
              if (id.includes('/langs')) {
                // 大型语言包单独分离
                if (id.includes('cpp') || id.includes('emacs-lisp')) {
                  return 'langs-large'
                }
                // 其他语言包
                return 'langs'
              }
              // 主题
              if (id.includes('/themes')) {
                return 'shiki-themes'
              }
              return 'shiki'
            }
            // i18n 相关 - 单独分离避免动态导入警告
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
              return 'vendor-i18n'
            }
            // Zustand 状态管理
            if (id.includes('node_modules/zustand')) {
              return 'vendor-zustand'
            }
            // 其他大型依赖
            if (id.includes('node_modules')) {
              return 'vendor-other'
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
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // 允许通过域名访问（用于反向代理）
      allowedHosts: ['console.xdd.ink', '.xdd.ink'],
      host: true,
      open: true,
      port: 2333,
      // proxy 配置已移除，不再需要后端 API
    },
  }
})
