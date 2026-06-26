import { useTabBarStore } from '@fifa/stores'
import { getTabFromMatch } from '@fifa/utils/routeUtils'

describe('fifa 标签页状态', () => {
  beforeEach(() => {
    useTabBarStore.getState().reset?.()
  })

  it('动态路由标签页使用完整路径生成唯一 ID', () => {
    const tab = getTabFromMatch({
      pathname: '/content/posts/post-1',
      staticData: {
        id: 'content.postEdit',
        title: 'menu.postEdit',
      },
    })

    expect(tab).toMatchObject({
      id: 'content-posts-post-1',
      label: 'menu.postEdit',
      path: '/content/posts/post-1',
      routeId: 'content.postEdit',
    })
  })

  it('多个编辑文章标签页只激活当前文章', () => {
    const store = useTabBarStore.getState()

    store.addOrActivateTab({
      id: 'content.postEdit',
      label: 'menu.postEdit',
      path: '/content/posts/post-1',
    })
    store.addOrActivateTab({
      id: 'content.postEdit',
      label: 'menu.postEdit',
      path: '/content/posts/post-2',
    })

    expect(useTabBarStore.getState().activeTabId).toBe('content-posts-post-2')
    expect(useTabBarStore.getState().tabs.map((tab) => tab.id)).toEqual([
      'home',
      'content-posts-post-1',
      'content-posts-post-2',
    ])

    useTabBarStore.getState().updateTabByPath('/content/posts/post-1', {
      description: 'hello-world / post-1',
      label: 'Hello World',
      translateLabel: false,
    })

    const postOneTab = useTabBarStore.getState().findTabByPath('/content/posts/post-1')
    const postTwoTab = useTabBarStore.getState().findTabByPath('/content/posts/post-2')

    expect(postOneTab).toMatchObject({
      description: 'hello-world / post-1',
      label: 'Hello World',
      translateLabel: false,
    })
    expect(postTwoTab).toMatchObject({
      label: 'menu.postEdit',
    })
  })
})
