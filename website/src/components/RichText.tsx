import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

interface Props {
  data: unknown
  className?: string
}

export function RichText({ data, className }: Props) {
  if (!data || typeof data !== 'object') return null
  return <PayloadRichText data={data as SerializedEditorState} className={className} />
}
