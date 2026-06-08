import baseConfig from '@xdd-zone/eslint-config'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'

const consoleBoundaryPlugin = {
  rules: {
    'nexus-rpc-type-only': {
      create(context) {
        return {
          ImportDeclaration(node) {
            if (!node.source.value.startsWith('@xdd-zone/nexus')) return

            const isAllowedRpcTypeImport =
              node.source.value === '@xdd-zone/nexus/rpc' &&
              (node.importKind === 'type' || node.specifiers.every((specifier) => specifier.importKind === 'type'))

            if (isAllowedRpcTypeImport) return

            context.report({
              node,
              message: 'Console 只能用 import type 从 @xdd-zone/nexus/rpc 引入 Hono RPC 类型。',
            })
          },
        }
      },
    },
  },
}

export default baseConfig.append({
  files: ['**/*.{js,jsx,ts,tsx}'],
  ignores: ['dist', 'docs/**', '*.md', '*.tsbuildinfo'],
  plugins: {
    'console-boundary': consoleBoundaryPlugin,
    'react-hooks': pluginReactHooks,
    'react-refresh': pluginReactRefresh,
  },
  rules: {
    ...pluginReactHooks.configs.recommended.rules,
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'console-boundary/nexus-rpc-type-only': 'error',
    'no-console': ['off', { allow: ['warn', 'error', 'info'] }],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
})
