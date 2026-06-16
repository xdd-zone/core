import type { MdxComponent } from '@xdd-zone/contracts'

export const MDX_COMPONENTS = [
  {
    description: '提示块，用来放补充说明或注意事项。',
    name: 'Callout',
    snippet: '<Callout tone="info">这里写提示内容</Callout>',
  },
  {
    description: '图片展示块，用来放正文插图和说明。',
    name: 'Figure',
    snippet: '<Figure src="" alt="" caption="" />',
  },
  {
    description: '链接卡片，用来展示外部链接。',
    name: 'LinkCard',
    snippet: '<LinkCard href="" title="" description="" />',
  },
  {
    description: '主题预览块，用来展示 Catppuccin 主题效果。',
    name: 'ThemePreview',
    snippet: '<ThemePreview theme="latte" />',
  },
] satisfies MdxComponent[]

const mdxComponentNameSet = new Set(MDX_COMPONENTS.map((component) => component.name))
const componentNamePattern = /<([A-Z][A-Za-z0-9]*)\b/g

export function findUnknownMdxComponents(source: string): string[] {
  const unknownNames = new Set<string>()

  for (const match of source.matchAll(componentNamePattern)) {
    const name = match[1]

    if (!mdxComponentNameSet.has(name)) {
      unknownNames.add(name)
    }
  }

  return [...unknownNames].sort()
}
