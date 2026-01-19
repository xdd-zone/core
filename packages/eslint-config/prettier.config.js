/**
 * Prettier 配置文件
 * 详细文档：https://prettier.io/docs/en/options
 *
 * 统一配置说明：
 * - printWidth: 120 - 宽屏时代，120字符更合理
 * - semi: false - 现代JS/TS无需分号，更简洁
 * - singleQuote: true - 单引号更符合JS社区习惯
 * - trailingComma: all - 更好的git diff，减少无用变更
 */
/** @type {import('prettier').Config} */
export default {
  // 箭头函数参数总是使用括号 (a) => {} 而非 a => {}
  arrowParens: 'always',

  // 换行符类型（统一为LF，避免Windows CRLF问题）
  endOfLine: 'lf',

  // 每行最大字符数
  printWidth: 120,

  // 是否在语句末尾添加分号
  semi: false,

  // 使用单引号而非双引号
  singleQuote: true,

  // 缩进空格数
  tabWidth: 2,

  // 对象、数组等是否在末尾添加逗号
  // 'all' - 尽可能添加逗号（函数参数等）
  trailingComma: 'all',

  // 使用空格缩进（false）而非Tab缩进
  useTabs: false,
}
