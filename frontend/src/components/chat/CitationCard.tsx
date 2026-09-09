import React from 'react'
import { BookOpen, ExternalLink } from 'lucide-react'
import type { Citation } from '@/types/api'

export interface CitationCardProps {
  citation: Citation
}

export function CitationCard({ citation }: CitationCardProps) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
      <div className="flex items-center justify-between font-semibold text-slate-700">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span>{citation.machine_id} Manual</span>
        </div>
        <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-[10px]">
          Page {citation.source_page}
        </span>
      </div>
      <p className="text-slate-600 italic font-mono text-[11px] leading-relaxed">
        &ldquo;{citation.text_snippet}&rdquo;
      </p>
    </div>
  )
}
