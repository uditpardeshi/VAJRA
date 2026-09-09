import React from 'react'
import { X, Check, RotateCcw } from 'lucide-react'
import type { InspectResponse } from '@/types/api'
import type { ARObject } from '@/store/inspectionStore'
import { Button } from '@/components/ui/Button'

export interface CapturePreviewProps {
  imageBase64: string
  result?: InspectResponse | null
  arObjects?: ARObject[]
  onRetake: () => void
  onSave: () => void
  onClose: () => void
}

export function CapturePreview({
  imageBase64,
  result,
  arObjects = [],
  onRetake,
  onSave,
  onClose
}: CapturePreviewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4">
      <div className="flex items-center justify-between z-10">
        <span className="text-white font-bold text-sm">Inspection Capture Preview</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 my-4 flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800">
        <img
          src={`data:image/jpeg;base64,${imageBase64}`}
          alt="Capture preview"
          className="max-h-full max-w-full object-contain"
        />

        {/* Overlay defect box if present */}
        {result?.defect_location && (
          <div
            className="absolute border-4 border-rose-500 bg-rose-500/20 rounded-lg pointer-events-none"
            style={{
              left: `${result.defect_location.x * 100}%`,
              top: `${result.defect_location.y * 100}%`,
              width: `${result.defect_location.w * 100}%`,
              height: `${result.defect_location.h * 100}%`,
            }}
          >
            <span className="absolute -top-7 left-0 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
              Defect ({Math.round(result.confidence * 100)}%)
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 z-10">
        <Button variant="outline" onClick={onRetake} className="flex-1 bg-slate-900 text-white border-slate-700">
          <RotateCcw className="w-4 h-4 mr-2" /> Retake
        </Button>
        <Button variant="primary" onClick={onSave} className="flex-1">
          <Check className="w-4 h-4 mr-2" /> Save &amp; Log
        </Button>
      </div>
    </div>
  )
}
