const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

vi.mock('@fifa/api/momo-url', () => ({
  resolveMomoHttpUrl: (path: string) => new URL(`https://momo.test${path}`),
}))

describe('fifa sign out api', () => {
  afterEach(() => {
    fetchMock.mockReset()
  })

  it('登出时发送 JSON 请求体', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { signOut } = await import('@fifa/api/auth/sign-out.api')

    await expect(signOut()).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledWith(new URL('https://momo.test/api/auth/sign-out'), {
      body: '{}',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
  })
})
