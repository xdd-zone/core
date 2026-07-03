import type { ImageAsset, PostSummary } from '@xdd-zone/contracts'

import { buildImageSnippet, insertTextAtSelection } from '@fifa/features/content/utils/editor'
import { filterContentPosts } from '@fifa/features/content/utils/post-list'
import { buildBoboPreviewUrl, buildBoboTargetPreviewUrl } from '@fifa/features/content/utils/preview-url'
import { ignoreAntdUploadRequest } from '@fifa/features/content/utils/upload'

const posts: PostSummary[] = [
  {
    createdAt: '2026-01-01T00:00:00.000Z',
    draft: {
      category: {
        description: null,
        id: 'category-1',
        name: 'Notes',
        slug: 'notes',
      },
      coverAssetId: null,
      excerpt: null,
      slug: 'hello-world',
      tags: [],
      title: 'Hello World',
    },
    id: 'post-1',
    published: {
      category: null,
      coverAssetId: null,
      excerpt: null,
      publishedAt: null,
      slug: null,
      tags: [],
      title: null,
    },
    status: 'draft',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    createdAt: '2026-01-02T00:00:00.000Z',
    draft: {
      category: null,
      coverAssetId: null,
      excerpt: null,
      slug: 'theme-preview',
      tags: [
        {
          id: 'tag-1',
          name: 'Theme',
          slug: 'theme',
        },
      ],
      title: 'Theme Preview',
    },
    id: 'post-2',
    published: {
      category: null,
      coverAssetId: null,
      excerpt: null,
      publishedAt: '2026-01-03T00:00:00.000Z',
      slug: 'theme-preview',
      tags: [
        {
          id: 'tag-1',
          name: 'Theme',
          slug: 'theme',
        },
      ],
      title: 'Theme Preview',
    },
    status: 'published',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
]

const imageAsset: ImageAsset = {
  alt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  fileName: 'cover.png',
  fileUrl: 'https://cdn.example.com/cover.png',
  id: 'asset-1',
  mimeType: 'image/png',
  size: 1024,
  storagePath: 'content/images/cover.png',
  updatedAt: '2026-01-01T00:00:00.000Z',
  url: 'https://cdn.example.com/cover.png',
}

describe('content 工具函数', () => {
  it('按关键词和状态筛选文章列表', () => {
    expect(filterContentPosts(posts, { keyword: 'hello', status: 'all' }).map((post) => post.id)).toEqual(['post-1'])
    expect(filterContentPosts(posts, { keyword: '', status: 'published' }).map((post) => post.id)).toEqual(['post-2'])
  })

  it('按 Bobo 地址、文章 ID 和 token 拼预览地址', () => {
    expect(buildBoboPreviewUrl('post', 'post-1', 'token-1')).toBe(
      'http://localhost:3000/preview/post/post-1?token=token-1',
    )
  })

  it('bobo 地址带路径前缀时保留前缀', () => {
    expect(buildBoboPreviewUrl('post', 'post-1', 'token-1', 'https://example.xdd.ink/bobo')).toBe(
      'https://example.xdd.ink/bobo/preview/post/post-1?token=token-1',
    )
  })

  it('按目标类型拼通用预览地址', () => {
    expect(buildBoboTargetPreviewUrl('projects', 'project-1', 'token-1', 'https://example.xdd.ink/bobo')).toBe(
      'https://example.xdd.ink/bobo/preview/project/project-1?token=token-1',
    )
  })

  it('把 MDX 片段插入 textarea 当前光标位置', () => {
    expect(insertTextAtSelection('hello world', '<Callout />', { end: 5, start: 5 })).toBe('hello<Callout /> world')
  })

  it('生成图片组件片段', () => {
    expect(buildImageSnippet(imageAsset)).toBe('\n<Figure src="https://cdn.example.com/cover.png" alt="cover.png" />\n')
  })

  it('上传图片后返回 antd 的忽略标记，阻断默认上传请求', async () => {
    const file = new File(['image'], 'cover.png', { type: 'image/png' })
    const upload = vi.fn(async (_file: File) => {})

    await expect(ignoreAntdUploadRequest(file, upload, '__LIST_IGNORE__')).resolves.toBe('__LIST_IGNORE__')
    expect(upload).toHaveBeenCalledWith(file)
  })
})
