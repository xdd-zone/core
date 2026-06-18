import { createEslintConfig } from '@xdd-zone/eslint-config'

const fifaBoundaryPlugin = {
  rules: {
    'momo-rpc-type-only': {
      create(context) {
        return {
          ImportDeclaration(node) {
            if (!node.source.value.startsWith('@xdd-zone/momo')) return

            const isAllowedRpcTypeImport =
              node.source.value === '@xdd-zone/momo/rpc' &&
              (node.importKind === 'type' || node.specifiers.every((specifier) => specifier.importKind === 'type'))

            if (isAllowedRpcTypeImport) return

            context.report({
              node,
              message: 'Fifa 只能用 import type 从 @xdd-zone/momo/rpc 引入 Hono RPC 类型。',
            })
          },
        }
      },
    },
  },
}

export default createEslintConfig({ react: true }).append({
  files: ['**/*.{js,jsx,ts,tsx}'],
  ignores: ['dist', 'docs/**', '*.md', '*.tsbuildinfo'],
  plugins: {
    'fifa-boundary': fifaBoundaryPlugin,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'fifa-boundary/momo-rpc-type-only': 'error',
    'no-console': ['off', { allow: ['warn', 'error', 'info'] }],
    'react/dom-no-dangerously-set-innerhtml': 'off',
    'react/naming-convention-ref-name': 'off',
    'react/no-array-index-key': 'off',
    'react/no-context-provider': 'off',
    'react/no-forward-ref': 'off',
    'react/no-use-context': 'off',
    'react/set-state-in-effect': 'off',
  },
})
