import type { MdxRawProps } from '../../types'

export function parseFigureProps(rawProps: MdxRawProps): MdxRawProps {
  return {
    alt: rawProps.alt ?? '',
    caption: rawProps.caption,
    src: rawProps.src ?? '',
  }
}
