import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@fifa': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    globals: true,
  },
})
