import type { ImageAsset, PostSummary } from '@xdd-zone/contracts'

import { buildImageSnippet, insertTextAtSelection } from '@fifa/features/content/utils/editor'
import { filterContentPosts } from '@fifa/features/content/utils/post-list'
import { buildBoboPreviewUrl } from '@fifa/features/content/utils/preview-url'
import { ignoreAntdUploadRequest } from '@fifa/features/content/utils/upload'

const posts: PostSummary[] = [
  {
    coverAssetId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    excerpt: null,
    format: 'markdown',
    id: 'post-1',
    publishedAt: null,
    slug: 'hello-world',
    status: 'draft',
    title: 'Hello World',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    coverAssetId: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    excerpt: null,
    format: 'mdx',
    id: 'post-2',
    publishedAt: '2026-01-03T00:00:00.000Z',
    slug: 'theme-preview',
    status: 'published',
    title: 'Theme Preview',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
]

const imageAsset: ImageAsset = {
  alt: null,
  fileName: 'cover.png',
  id: 'asset-1',
  mimeType: 'image/png',
  size: 1024,
  storagePath: 'content/images/cover.png',
  url: 'https://cdn.example.com/cover.png',
}

describe('content 工具函数', () => {
  it('按关键词、状态和格式筛选文章列表', () => {
    expect(
      filterContentPosts(posts, { format: 'all', keyword: 'hello', status: 'all' }).map((post) => post.id),
    ).toEqual(['post-1'])
    expect(
      filterContentPosts(posts, { format: 'mdx', keyword: '', status: 'published' }).map((post) => post.id),
    ).toEqual(['post-2'])
  })

  it('按 Bobo 地址、文章 ID 和 token 拼预览地址', () => {
    expect(buildBoboPreviewUrl('post-1', 'token-1')).toBe('http://localhost:3000/preview/posts/post-1?token=token-1')
  })

  it('bobo 地址带 code-server 路径时保留代理前缀', () => {
    expect(buildBoboPreviewUrl('post-1', 'token-1', 'https://code.xdd.ink/absproxy/4399')).toBe(
      'https://code.xdd.ink/absproxy/4399/preview/posts/post-1?token=token-1',
    )
  })

  it('把 MDX 片段插入 textarea 当前光标位置', () => {
    expect(insertTextAtSelection('hello world', '<Callout />', { end: 5, start: 5 })).toBe('hello<Callout /> world')
  })

  it('按文章格式生成图片片段', () => {
    expect(buildImageSnippet('markdown', imageAsset)).toBe('\n![cover.png](https://cdn.example.com/cover.png)\n')
    expect(buildImageSnippet('mdx', imageAsset)).toBe(
      '\n<Figure src="https://cdn.example.com/cover.png" alt="cover.png" />\n',
    )
  })

  it('上传图片后返回 antd 的忽略标记，阻断默认上传请求', async () => {
    const file = new File(['image'], 'cover.png', { type: 'image/png' })
    const upload = vi.fn(async (_file: File) => {})

    await expect(ignoreAntdUploadRequest(file, upload, '__LIST_IGNORE__')).resolves.toBe('__LIST_IGNORE__')
    expect(upload).toHaveBeenCalledWith(file)
  })
})
