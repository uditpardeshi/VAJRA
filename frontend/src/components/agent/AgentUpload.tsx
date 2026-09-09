import React, { useState } from 'react'
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react'
import { useAnalyzeDocument } from '@/hooks/api/useAgent'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import type { AgentRunResponse } from '@/types/api'

export interface AgentUploadProps {
  onSuccessRun?: (run: AgentRunResponse) => void
}

export function AgentUpload({ onSuccessRun }: AgentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const { mutateAsync: analyzeDoc, isPending } = useAnalyzeDocument()
  const toast = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || isPending) return
    try {
      const res = await analyzeDoc({ file })
      toast.success('Document analysis completed')
      if (onSuccessRun) onSuccessRun(res)
    } catch (e) {
      toast.error('Document analysis failed')
    }
  }

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-card space-y-4">
      <h3 className="font-bold text-slate-900 text-sm">Upload Equipment Inspection Document</h3>

      <label className="border-2 border-dashed border-slate-200 hover:border-primary-400 bg-slate-50 hover:bg-slate-100/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
        <Upload className="w-8 h-8 text-slate-400 mb-2" />
        <span className="text-sm font-semibold text-slate-700">Click or drag &amp; drop document (PDF / DOCX)</span>
        <span className="text-xs text-slate-400 mt-1">Supports mechanical measurements &amp; CAD reports</span>
        <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="hidden" />
      </label>

      {file && (
        <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl text-xs font-semibold text-primary-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button onClick={() => setFile(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      <Button
        variant="primary"
        onClick={handleUpload}
        disabled={!file || isPending}
        isLoading={isPending}
        className="w-full"
      >
        Execute Multi-Tool Agent Pipeline
      </Button>
    </div>
  )
}
