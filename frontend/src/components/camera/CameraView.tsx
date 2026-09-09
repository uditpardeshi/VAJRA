import React from 'react'
import { CameraOff } from 'lucide-react'

export interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  isActive: boolean
  error: string | null
}

export function CameraView({ videoRef, canvasRef, isActive, error }: CameraViewProps) {
  return (
    <div className="relative w-full h-full min-h-[350px] bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
      {error ? (
        <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <CameraOff className="w-12 h-12 mb-3 text-rose-500" />
          <p className="font-semibold text-slate-200 text-sm">{error}</p>
          <p className="text-xs text-slate-500 mt-1">Check camera permissions or select mock simulation</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />
        </>
      )}
    </div>
  )
}
