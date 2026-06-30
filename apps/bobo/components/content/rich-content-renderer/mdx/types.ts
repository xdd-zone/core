import type { ReactNode } from 'react'

export type MdxComponentKind = 'paired' | 'selfClosing'

export type MdxRawProps = Record<string, string>

export interface MdxRenderInput<TProps> {
  props: TProps
  text: string
}

export interface MdxComponentDefinition<TName extends string = string> {
  kind: MdxComponentKind
  name: TName
  parseProps: (rawProps: MdxRawProps) => MdxRawProps
  render: (input: MdxRenderInput<MdxRawProps>) => ReactNode
}
