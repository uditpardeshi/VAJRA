import React from 'react'
import { CheckCircle2, ChevronRight, Hash } from 'lucide-react'

interface FormattedMessageProps {
  content: string
}

export function FormattedMessage({ content }: FormattedMessageProps) {
  if (!content) return null

  // Split lines to process markdown elements cleanly
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  let inTable = false
  let tableHeader: string[] = []
  let tableRows: string[][] = []
  let inCodeBlock = false
  let codeBlockContent: string[] = []

  const flushTable = (key: string) => {
    if (tableHeader.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={key} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs bg-white">
          <table className="w-full text-left text-xs">
            {tableHeader.length > 0 && (
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  {tableHeader.map((th, i) => (
                    <th key={i} className="px-3 py-2">
                      {parseInlineFormatting(th.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 font-mono text-[11px] text-slate-800">
                      {parseInlineFormatting(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableHeader = []
      tableRows = []
      inTable = false
    }
  }

  const flushCode = (key: string) => {
    if (codeBlockContent.length > 0) {
      elements.push(
        <div key={key} className="my-2 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
          <pre>{codeBlockContent.join('\n')}</pre>
        </div>
      )
      codeBlockContent = []
      inCodeBlock = false
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCode(`code-${index}`)
      } else {
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      return
    }

    // Handle Markdown Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())

      // Check if it's separator row (e.g. |---|---|)
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        inTable = true
        return
      }

      if (!inTable && tableHeader.length === 0) {
        tableHeader = cells
        inTable = true
      } else {
        tableRows.push(cells)
      }
      return
    } else if (inTable) {
      flushTable(`table-${index}`)
    }

    // Empty lines
    if (!trimmed) {
      elements.push(<div key={`spacer-${index}`} className="h-1.5" />)
      return
    }

    // Horizontal rules (--- or ***)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={`hr-${index}`} className="my-2.5 border-slate-200/80" />)
      return
    }

    // Headings (### or ## or #)
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const headingText = trimmed.replace(/^#+\s*/, '')
      elements.push(
        <div key={`h-${index}`} className="pt-2 pb-1 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-primary rounded-full shrink-0" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
            {parseInlineFormatting(headingText)}
          </h4>
        </div>
      )
      return
    }

    // Numbered step lists (e.g. "1. Step description", "2. ...")
    const stepMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (stepMatch) {
      const stepNum = stepMatch[1]
      const stepText = stepMatch[2]
      elements.push(
        <div key={`step-${index}`} className="flex items-start gap-2.5 my-1.5 p-2 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs">
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {stepNum}
          </span>
          <div className="flex-1 text-slate-800 leading-relaxed font-sans">
            {parseInlineFormatting(stepText)}
          </div>
        </div>
      )
      return
    }

    // Bullet lists (- or * or •)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const bulletText = trimmed.replace(/^[-*•]\s*/, '')
      elements.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 my-1 text-xs text-slate-700 leading-relaxed pl-1">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
          <div className="flex-1 font-sans">
            {parseInlineFormatting(bulletText)}
          </div>
        </div>
      )
      return
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${index}`} className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans my-1">
        {parseInlineFormatting(trimmed)}
      </p>
    )
  })

  if (inTable) flushTable('table-final')
  if (inCodeBlock) flushCode('code-final')

  return <div className="space-y-0.5">{elements}</div>
}

/**
 * Helper to parse inline markdown: **bold**, `code`, and clean metric values
 */
function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex to match **bold** and `code`
  const regex = /(\*\*.*?\*\*|`.*?`)/g
  const parts = text.split(regex)

  return parts.map((part, i) => {
    if (!part) return null

    // Bold text (**...**)
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      return (
        <strong key={i} className="font-bold text-slate-900 font-sans">
          {boldText}
        </strong>
      )
    }

    // Code inline (`...`)
    if (part.startsWith('`') && part.endsWith('`')) {
      const codeText = part.slice(1, -1)
      return (
        <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200/60">
          {codeText}
        </code>
      )
    }

    return <span key={i}>{part}</span>
  })
}
