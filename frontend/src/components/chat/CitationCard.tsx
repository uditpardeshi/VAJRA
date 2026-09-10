import React, { useState } from 'react'
import { BookOpen, Image as ImageIcon, Table as TableIcon, Maximize2, X, ZoomIn } from 'lucide-react'
import type { Citation } from '@/types/api'
import { getAssetUrl } from '@/config/api'

export interface CitationCardProps {
  citation: Citation
}

export function CitationCard({ citation }: CitationCardProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const isFigure = citation.modality === 'figure' || Boolean(citation.image_snippet_url)
  const isTable = citation.modality === 'table' || Boolean(citation.table_data)

  const imageUrl = citation.image_snippet_url ? getAssetUrl(citation.image_snippet_url) : undefined

  return (
    <>
      <div className="p-3 bg-slate-50 hover:bg-slate-100/70 transition-colors border border-slate-200/90 rounded-xl space-y-2 text-xs">
        {/* Header bar */}
        <div className="flex items-center justify-between font-semibold text-slate-700">
          <div className="flex items-center gap-1.5 min-w-0">
            {isFigure ? (
              <ImageIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ) : isTable ? (
              <TableIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            <span className="truncate max-w-[200px]" title={citation.source_file || citation.machine_id}>
              {citation.source_file || `${citation.machine_id} Manual`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isFigure && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-semibold tracking-wider uppercase">
                Schematic
              </span>
            )}
            {isTable && (
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[9px] font-semibold tracking-wider uppercase">
                Spec Table
              </span>
            )}
            <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-[10px] font-medium">
              p. {citation.source_page}
            </span>
          </div>
        </div>

        {/* Visual diagram / schematic preview if available */}
        {isFigure && imageUrl && (
          <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white">
            <div
              className="cursor-pointer relative overflow-hidden max-h-44 flex items-center justify-center bg-slate-900/5"
              onClick={() => setIsImageModalOpen(true)}
            >
              <img
                src={imageUrl}
                alt={`Schematic diagram from page ${citation.source_page}`}
                className="w-full h-auto object-contain max-h-44 transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  // If image fails to load gracefully hide
                  const target = e.currentTarget.parentElement
                  if (target) target.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-[11px] font-medium backdrop-blur-[1px]">
                <ZoomIn className="w-4 h-4" />
                <span>Expand Schematic</span>
              </div>
            </div>
            <div className="px-2 py-1 bg-slate-100/90 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between items-center">
              <span>Multimodal Diagram Extract</span>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="text-primary hover:underline flex items-center gap-0.5 font-medium"
              >
                <Maximize2 className="w-2.5 h-2.5" /> Full view
              </button>
            </div>
          </div>
        )}

        {/* Structured table preview if present */}
        {isTable && citation.table_data && (
          <div className="rounded-lg border border-slate-200 bg-white p-2 overflow-x-auto">
            <pre className="font-mono text-[10px] text-slate-700 leading-tight whitespace-pre-wrap">
              {citation.table_data}
            </pre>
          </div>
        )}

        {/* Text snippet */}
        {citation.text_snippet && (
          <p className="text-slate-600 italic font-mono text-[11px] leading-relaxed">
            &ldquo;{citation.text_snippet}&rdquo;
          </p>
        )}
      </div>

      {/* Fullscreen Lightbox Modal for Diagram */}
      {isImageModalOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
                  {citation.source_file || `${citation.machine_id} Manual`} &bull; p.{citation.source_page}
                </span>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 sm:p-4 overflow-auto flex items-center justify-center bg-slate-900/5">
              <img
                src={imageUrl}
                alt={`Full schematic ${citation.machine_id} page ${citation.source_page}`}
                className="max-h-[65vh] sm:max-h-[75vh] w-auto object-contain rounded shadow-xs"
              />
            </div>
            {citation.text_snippet && (
              <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 font-mono">
                {citation.text_snippet}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
