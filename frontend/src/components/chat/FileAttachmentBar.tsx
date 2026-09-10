import React, { useRef, useState } from 'react'
import {
  Paperclip,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { api } from '@/config/api'
import { useChatSessionStore } from '@/store/chatSessionStore'
import type { SessionFileItem } from '@/types/api'
import { cn } from '@/utils/cn'

export interface FileAttachmentBarProps {
  sessionId: string
}

export function FileAttachmentBar({ sessionId }: FileAttachmentBarProps) {
  const { sessions, addFilesToSession, removeFileFromSession } = useChatSessionStore()
  const activeSession = sessions.find((s) => s.id === sessionId)
  const files = activeSession?.files || []

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return <ImageIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
    if (['json', 'yaml', 'yml'].includes(ext || '')) return <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
    return <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
  }

  const handleFilesSelected = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return
    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    const formData = new FormData()
    Array.from(selectedFiles).forEach((f) => {
      formData.append('files', f)
    })
    formData.append('session_id', sessionId)

    try {
      const res = await api.post<{ session_id: string; files: SessionFileItem[]; total_indexed: number }>(
        '/chat/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      )

      if (res.data?.files) {
        addFilesToSession(sessionId, res.data.files)
        setUploadSuccess(`Indexed ${res.data.files.length} file(s) into session RAG (${res.data.total_indexed} chunks)`)
        setTimeout(() => setUploadSuccess(null), 4000)
      }
    } catch (err: any) {
      console.error('File upload failed:', err)
      setUploadError(err.response?.data?.detail || err.message || 'File indexing failed')
      setTimeout(() => setUploadError(null), 5000)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="border-t border-[#23334d] bg-[#0c1220] p-2.5 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,.png,.jpg,.jpeg"
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 bg-[#18233a] hover:bg-[#23334d] text-slate-200 hover:text-white border border-[#2d4163] rounded-lg text-xs font-semibold shadow-2xs transition-all',
              isUploading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span>{isUploading ? 'Parsing & Indexing...' : 'Attach Documents'}</span>
          </button>

          <span className="text-[10px] text-slate-300 hidden sm:inline">
            PDF, DOCX, Excel/CSV tables, Schematics, TXT, JSON
          </span>
        </div>

        {uploadSuccess && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {uploadSuccess}
          </span>
        )}

        {uploadError && (
          <span className="flex items-center gap-1 text-[11px] text-rose-300 font-medium animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            {uploadError}
          </span>
        )}
      </div>

      {/* Chip list of attached files */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {files.map((file) => (
            <div
              key={file.filename}
              className="group flex items-center gap-1.5 px-2.5 py-1 bg-[#18233a] border border-[#2d4163] rounded-lg text-xs text-slate-100 shadow-2xs"
            >
              {getFileIcon(file.filename)}
              <span className="font-medium text-slate-100 truncate max-w-[140px]" title={file.filename}>
                {file.filename}
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-[#23334d] rounded text-slate-200 font-mono">
                {file.total_chunks} {file.total_chunks === 1 ? 'chunk' : 'chunks'}
              </span>
              {file.tables > 0 && (
                <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold">
                  {file.tables}T
                </span>
              )}
              {file.figures > 0 && (
                <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold">
                  {file.figures}F
                </span>
              )}
              <button
                type="button"
                onClick={() => removeFileFromSession(sessionId, file.filename)}
                className="text-slate-400 hover:text-rose-400 p-0.5 ml-0.5 transition-colors"
                title="Remove attached document from thread"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
