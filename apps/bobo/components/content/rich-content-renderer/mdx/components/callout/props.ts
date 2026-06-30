import type { MdxRawProps } from '../../types'

type CalloutTone = 'danger' | 'info' | 'success' | 'warning'

const DEFAULT_TONE: CalloutTone = 'info'
const CALLOUT_TONES = new Set<string>(['danger', 'info', 'success', 'warning'])

export function parseCalloutProps(rawProps: MdxRawProps): MdxRawProps {
  return {
    tone: parseTone(rawProps.tone),
  }
}

function parseTone(tone: string | undefined): CalloutTone {
  return tone && CALLOUT_TONES.has(tone) ? (tone as CalloutTone) : DEFAULT_TONE
}
