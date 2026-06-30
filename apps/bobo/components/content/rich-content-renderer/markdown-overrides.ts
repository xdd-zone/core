import {
  Blockquote,
  CodeBlock,
  Divider,
  HeadingOne,
  HeadingThree,
  HeadingTwo,
  InlineCode,
  MarkdownImage,
  MarkdownLink,
  OrderedList,
  Paragraph,
  UnorderedList,
} from './markdown-components'

export const markdownOverrides = {
  a: {
    component: MarkdownLink,
  },
  blockquote: {
    component: Blockquote,
  },
  code: {
    component: InlineCode,
  },
  h1: {
    component: HeadingOne,
  },
  h2: {
    component: HeadingTwo,
  },
  h3: {
    component: HeadingThree,
  },
  hr: {
    component: Divider,
  },
  img: {
    component: MarkdownImage,
  },
  ol: {
    component: OrderedList,
  },
  p: {
    component: Paragraph,
  },
  pre: {
    component: CodeBlock,
  },
  ul: {
    component: UnorderedList,
  },
}
