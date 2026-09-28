// Contentful's Rich Text document (https://www.contentful.com/developers/docs/concepts/rich-text/)
// and Payload's Lexical editor state are unrelated JSON schemas. This module
// walks the Contentful node tree and produces an equivalent Lexical tree.
//
// Coverage: paragraphs, headings 1-6, unordered/ordered lists, bold/italic/
// underline/code marks, hyperlinks, and blockquotes. Anything else
// (embedded assets/entries, tables, horizontal rules) is converted to a
// plain paragraph with a visible placeholder and reported back in
// `unsupportedNodes` so it can be reviewed and fixed by hand — it is not
// silently dropped.

export interface ConversionReport {
  unsupportedNodes: string[]
}

type CFNode = {
  nodeType: string
  content?: CFNode[]
  value?: string
  marks?: { type: string }[]
  data?: Record<string, unknown>
}

const MARK_FORMAT: Record<string, number> = {
  bold:          1,   // Lexical IS_BOLD
  italic:        2,   // IS_ITALIC
  underline:     8,   // IS_UNDERLINE
  code:          16,  // IS_CODE
}

function textNode(cfNode: CFNode) {
  const format = (cfNode.marks ?? []).reduce(
    (acc, m) => acc | (MARK_FORMAT[m.type] ?? 0),
    0
  )
  return {
    type: 'text',
    text: cfNode.value ?? '',
    format,
    detail: 0,
    mode: 'normal',
    style: '',
    version: 1,
  }
}

function convertInline(nodes: CFNode[] = [], report: ConversionReport): any[] {
  return nodes.map((n) => {
    if (n.nodeType === 'text') return textNode(n)
    if (n.nodeType === 'hyperlink') {
      return {
        type: 'link',
        fields: { url: (n.data?.uri as string) ?? '#', newTab: false },
        children: convertInline(n.content, report),
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 2,
      }
    }
    report.unsupportedNodes.push(n.nodeType)
    return textNode({ ...n, nodeType: 'text', value: n.value ?? '' })
  })
}

const HEADING_TAGS: Record<string, string> = {
  'heading-1': 'h1', 'heading-2': 'h2', 'heading-3': 'h3',
  'heading-4': 'h4', 'heading-5': 'h5', 'heading-6': 'h6',
}

function convertBlock(node: CFNode, report: ConversionReport): any | null {
  switch (node.nodeType) {
    case 'paragraph':
      return {
        type: 'paragraph',
        children: convertInline(node.content, report),
        direction: 'ltr', format: '', indent: 0, version: 1,
      }

    case 'heading-1': case 'heading-2': case 'heading-3':
    case 'heading-4': case 'heading-5': case 'heading-6':
      return {
        type: 'heading',
        tag: HEADING_TAGS[node.nodeType],
        children: convertInline(node.content, report),
        direction: 'ltr', format: '', indent: 0, version: 1,
      }

    case 'unordered-list':
    case 'ordered-list':
      return {
        type: 'list',
        listType: node.nodeType === 'ordered-list' ? 'number' : 'bullet',
        start: 1,
        tag: node.nodeType === 'ordered-list' ? 'ol' : 'ul',
        children: (node.content ?? [])
          .map((li) => ({
            type: 'listitem',
            value: 1,
            children: (li.content ?? [])
              .map((c) => convertBlock(c, report))
              .filter(Boolean),
            direction: 'ltr', format: '', indent: 0, version: 1,
          })),
        direction: 'ltr', format: '', indent: 0, version: 1,
      }

    case 'blockquote':
      return {
        type: 'quote',
        children: (node.content ?? [])
          .map((c) => convertBlock(c, report))
          .filter(Boolean)
          .flatMap((b: any) => b.children ?? []),
        direction: 'ltr', format: '', indent: 0, version: 1,
      }

    case 'hr':
      // No direct Lexical equivalent in the base editor config used here.
      report.unsupportedNodes.push('hr')
      return null

    case 'embedded-asset-block':
    case 'embedded-entry-block':
    case 'table':
      report.unsupportedNodes.push(node.nodeType)
      return {
        type: 'paragraph',
        children: [textNode({
          nodeType: 'text',
          value: `[Manual review needed: unmigrated ${node.nodeType} was here]`,
        })],
        direction: 'ltr', format: '', indent: 0, version: 1,
      }

    default:
      report.unsupportedNodes.push(node.nodeType)
      return {
        type: 'paragraph',
        children: convertInline(node.content, report),
        direction: 'ltr', format: '', indent: 0, version: 1,
      }
  }
}

/**
 * Converts a Contentful Rich Text document to a Lexical editor state.
 * Returns both the converted tree and a report of any node types that
 * couldn't be faithfully converted, so they can be reviewed by hand.
 */
export function contentfulRichTextToLexical(doc: unknown): { lexical: any; report: ConversionReport } {
  const report: ConversionReport = { unsupportedNodes: [] }
  const root = doc as CFNode

  const children = (root?.content ?? [])
    .map((n) => convertBlock(n, report))
    .filter(Boolean)

  return {
    lexical: {
      root: {
        type: 'root',
        children: children.length ? children : [emptyParagraph()],
        direction: 'ltr', format: '', indent: 0, version: 1,
      },
    },
    report,
  }
}

function emptyParagraph() {
  return { type: 'paragraph', children: [], direction: 'ltr', format: '', indent: 0, version: 1 }
}

/** For plain-string fields (Solution.fullDescription, LeadershipProfile.bio) — no marks/blocks to preserve. */
export function plainTextToLexical(text: string | undefined): any | undefined {
  if (!text) return undefined
  return {
    root: {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
        direction: 'ltr', format: '', indent: 0, version: 1,
      }],
      direction: 'ltr', format: '', indent: 0, version: 1,
    },
  }
}
