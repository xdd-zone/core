import en from '@fifa/i18n/locales/en'
import zh from '@fifa/i18n/locales/zh'

const llmKeys = [
  'apiFormat.chat_completions',
  'apiFormat.responses',
  'cancel',
  'providers.form.nameRequired',
  'providers.form.baseUrlRequired',
  'useCases.useCase.content.post.meta',
] as const

function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') {
      return undefined
    }

    return (current as Record<string, unknown>)[key]
  }, source)
}

describe('llm 设置页 i18n', () => {
  it.each([
    ['zh', zh],
    ['en', en],
  ])('%s 补齐页面使用的翻译 key', (_locale, resource) => {
    llmKeys.forEach((key) => {
      expect(readPath(resource.settings.llm, key)).toEqual(expect.any(String))
    })
  })
})
