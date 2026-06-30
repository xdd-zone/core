import {
  Blockquote,
  CodeBlock,
  Divider,
  Emphasis,
  HeadingFive,
  HeadingFour,
  HeadingOne,
  HeadingSix,
  HeadingThree,
  HeadingTwo,
  InlineCode,
  ListItem,
  MarkdownImage,
  MarkdownLink,
  OrderedList,
  Paragraph,
  Strikethrough,
  Strong,
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeader,
  TableRow,
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
  h4: {
    component: HeadingFour,
  },
  h5: {
    component: HeadingFive,
  },
  h6: {
    component: HeadingSix,
  },
  li: {
    component: ListItem,
  },
  strong: {
    component: Strong,
  },
  em: {
    component: Emphasis,
  },
  del: {
    component: Strikethrough,
  },
  table: {
    component: Table,
  },
  thead: {
    component: TableHead,
  },
  tbody: {
    component: TableBody,
  },
  tr: {
    component: TableRow,
  },
  th: {
    component: TableHeader,
  },
  td: {
    component: TableData,
  },
}
