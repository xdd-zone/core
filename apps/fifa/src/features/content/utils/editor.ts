import type { ImageAsset } from '@xdd-zone/contracts'

export interface TextSelection {
  end: number
  start: number
}

export function insertTextAtSelection(value: string, snippet: string, selection: TextSelection) {
  return `${value.slice(0, selection.start)}${snippet}${value.slice(selection.end)}`
}

export function buildImageSnippet(asset: ImageAsset) {
  const alt = asset.alt ?? asset.fileName
  const src = asset.url ?? asset.storagePath

  return `\n<Figure src="${src}" alt="${alt}" />\n`
}
