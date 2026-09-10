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
    <div className="p-6 bg-[#111927] border border-[#23334d] rounded-2xl shadow-card space-y-4">
      <h3 className="font-bold text-white text-base">Upload Equipment Inspection Document</h3>

      <label className="border-2 border-dashed border-[#23334d] hover:border-sky-500/60 bg-[#0c1220] hover:bg-[#152236] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
        <Upload className="w-8 h-8 text-sky-400 mb-2" />
        <span className="text-sm font-semibold text-slate-100">Click or drag &amp; drop document (PDF / DOCX)</span>
        <span className="text-xs text-slate-300 mt-1">Supports mechanical measurements &amp; CAD reports</span>
        <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="hidden" />
      </label>

      {file && (
        <div className="flex items-center justify-between p-3 bg-sky-950/40 border border-sky-500/40 rounded-xl text-xs font-semibold text-sky-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button onClick={() => setFile(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <Button
        variant="primary"
        onClick={handleUpload}
        disabled={!file || isPending}
        isLoading={isPending}
        className="w-full"
      >
        Verify Measurements &amp; Check Tolerances
      </Button>
    </div>
  )
}
