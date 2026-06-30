import type { MdxRawProps } from '../../types'

export function parseLinkCardProps(rawProps: MdxRawProps): MdxRawProps {
  const href = rawProps.href ?? ''

  return {
    description: rawProps.description,
    href,
    title: rawProps.title ?? href,
  }
}
