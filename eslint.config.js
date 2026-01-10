import antfu from '@antfu/eslint-config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default antfu(
  {
    typescript: true,
    formatters: true,
    // Disable markdown and other file type checks
    markdown: false,
    // Disable Node.js-specific global preferences for Bun runtime
    node: false,
    rules: {
      // Bun provides process and buffer as globals (no need to require)
      'node/prefer-global/process': 'off',
      'node/prefer-global/buffer': 'off',
      // Don't check JSDoc params strictly
      'jsdoc/check-param-names': 'off',
      // Disable rules that conflict with Prettier
      'antfu/if-newline': 'off',
    },
    ignores: [
      // Dependencies
      'node_modules',
      'bun.lock',
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',

      // Build outputs
      'dist',
      'build',
      '.next',
      'out',
      '.output',

      // Generated files
      '*.generated.ts',
      '*.generated.js',
      'src/infrastructure/database/prisma/generated',

      // Environment files
      '.env',
      '.env.*',
      '!.env.example',

      // Logs
      'logs',
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',
      'lerna-debug.log*',

      // OS
      '.DS_Store',
      'Thumbs.db',

      // IDE
      '.vscode',
      '.idea',
      '*.swp',
      '*.swo',
      '*~',

      // Documentation
      '**/*.md',

      // Testing
      'coverage',
      '.nyc_output',

      // Misc
      '.cache',
      'temp',
      'tmp',
    ],
  },
  eslintConfigPrettier,
);
