import { useParams } from '@tanstack/react-router'

import { PostEditor } from './PostEditor'

/**
 * 编辑文章页。
 */
export function EditPost() {
  const { id } = useParams({ from: '/protected/app-layout/articles/$id/edit' })

  return <PostEditor mode="edit" postId={id} />
}
