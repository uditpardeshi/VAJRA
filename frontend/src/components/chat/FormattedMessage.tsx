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
        <div key={key} className="my-2 overflow-x-auto rounded-xl border border-[#23334d] shadow-md bg-[#111927]">
          <table className="w-full text-left text-xs">
            {tableHeader.length > 0 && (
              <thead className="bg-[#18233a] border-b border-[#23334d] text-sky-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  {tableHeader.map((th, i) => (
                    <th key={i} className="px-2.5 py-1.5 font-bold">
                      {parseInlineFormatting(th.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-[#23334d]">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-[#111927]' : 'bg-[#0e1625]'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-2.5 py-1.5 font-mono text-[11px] text-slate-100">
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
        <div key={key} className="my-1.5 p-2.5 bg-[#0a0e17] text-sky-300 rounded-xl font-mono text-xs overflow-x-auto border border-[#23334d] shadow-inner">
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
      elements.push(<div key={`spacer-${index}`} className="h-1" />)
      return
    }

    // Horizontal rules (--- or ***)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={`hr-${index}`} className="my-2 border-slate-800" />)
      return
    }

    // Headings (### or ## or #)
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const headingText = trimmed.replace(/^#+\s*/, '')
      elements.push(
        <div key={`h-${index}`} className="pt-1.5 pb-0.5 flex items-center gap-1.5">
          <div className="w-1 h-3.5 bg-sky-400 rounded-full shrink-0" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight">
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
        <div key={`step-${index}`} className="flex items-start gap-2 my-1 p-2 rounded-lg bg-[#141d2f] border border-[#23334d] text-xs">
          <span className="w-4.5 h-4.5 rounded-full bg-sky-500/25 text-sky-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-sky-400/40">
            {stepNum}
          </span>
          <div className="flex-1 text-slate-100 leading-relaxed font-sans">
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
        <div key={`bullet-${index}`} className="flex items-start gap-2 my-0.5 text-xs text-slate-200 leading-relaxed pl-1">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
          <div className="flex-1 font-sans">
            {parseInlineFormatting(bulletText)}
          </div>
        </div>
      )
      return
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${index}`} className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans my-0.5 font-normal">
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
        <strong key={i} className="font-bold text-white font-sans">
          {boldText}
        </strong>
      )
    }

    // Code inline (`...`)
    if (part.startsWith('`') && part.endsWith('`')) {
      const codeText = part.slice(1, -1)
      return (
        <code key={i} className="px-1.5 py-0.2 rounded bg-slate-800 text-sky-300 font-mono text-[11px] border border-slate-700">
          {codeText}
        </code>
      )
    }

    return <span key={i}>{part}</span>
  })
}
