import baseConfig from '@xdd-zone/eslint-config'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'

export default baseConfig.append({
  files: ['**/*.{js,jsx,ts,tsx}'],
  ignores: ['dist', 'docs/**', '*.md', '*.tsbuildinfo'],
  plugins: {
    'react-hooks': pluginReactHooks,
    'react-refresh': pluginReactRefresh,
  },
  rules: {
    ...pluginReactHooks.configs.recommended.rules,
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-console': ['off', { allow: ['warn', 'error', 'info'] }],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
})
