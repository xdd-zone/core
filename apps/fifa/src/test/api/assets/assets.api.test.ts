import type { ApiResponse, AssetListResponse, ImageAssetResponse } from '@xdd-zone/contracts'

const rpcMocks = vi.hoisted(() => ({
  listAssets: vi.fn(),
  updateAsset: vi.fn(),
  uploadImage: vi.fn(),
}))

vi.mock('@fifa/api/client', () => ({
  momoClient: {
    rpc: {
      assets: {
        $get: rpcMocks.listAssets,
        ':id': {
          $patch: rpcMocks.updateAsset,
        },
        images: {
          $post: rpcMocks.uploadImage,
        },
      },
    },
  },
}))

describe('assets api 封装', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('读取素材列表时调用 /rpc/assets', async () => {
    const responseBody: ApiResponse<AssetListResponse> = {
      ok: true,
      data: {
        assets: [],
        page: 1,
        pageSize: 24,
        total: 0,
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.listAssets.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { listAssets } = await import('@fifa/api/assets/assets.api')

    await expect(listAssets({ keyword: 'cover', page: 1, pageSize: 24 })).resolves.toEqual(responseBody)
    expect(rpcMocks.listAssets).toHaveBeenCalledWith({
      query: {
        keyword: 'cover',
        mimeType: undefined,
        page: '1',
        pageSize: '24',
      },
    })
  })

  it('更新素材说明时传入素材 id 和请求体', async () => {
    const responseBody: ApiResponse<ImageAssetResponse> = {
      ok: true,
      data: {
        asset: {
          alt: '封面',
          createdAt: '2026-01-01T00:00:00.000Z',
          fileName: 'cover.png',
          fileUrl: 'https://momo.test/rpc/assets/asset-1/file',
          id: 'asset-1',
          mimeType: 'image/png',
          size: 5,
          storagePath: 'content/images/cover.png',
          updatedAt: '2026-01-01T00:00:00.000Z',
          url: null,
        },
      },
      meta: {
        requestId: 'request-1',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    }
    rpcMocks.updateAsset.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    })
    const { updateAsset } = await import('@fifa/api/assets/assets.api')

    await expect(updateAsset('asset-1', { alt: '封面' })).resolves.toEqual(responseBody)
    expect(rpcMocks.updateAsset).toHaveBeenCalledWith({
      json: {
        alt: '封面',
      },
      param: {
        id: 'asset-1',
      },
    })
  })

  it('上传图片时使用 file 字段', async () => {
    const file = new File(['image'], 'cover.png', { type: 'image/png' })
    rpcMocks.uploadImage.mockResolvedValue({
      json: () =>
        Promise.resolve({
          ok: true,
          data: {
            asset: {
              alt: null,
              createdAt: '2026-01-01T00:00:00.000Z',
              fileName: 'cover.png',
              fileUrl: 'https://momo.test/rpc/assets/asset-1/file',
              id: 'asset-1',
              mimeType: 'image/png',
              size: 5,
              storagePath: 'content/images/cover.png',
              updatedAt: '2026-01-01T00:00:00.000Z',
              url: null,
            },
          },
          meta: {
            requestId: 'request-1',
            timestamp: '2026-01-01T00:00:00.000Z',
          },
        }),
    })
    const { uploadAssetImage } = await import('@fifa/api/assets/assets.api')

    await uploadAssetImage(file)
    expect(rpcMocks.uploadImage).toHaveBeenCalledWith({
      form: {
        file,
      },
    })
  })
})
