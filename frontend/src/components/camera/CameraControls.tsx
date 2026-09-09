import React from 'react'
import { Camera, Zap, RefreshCw, ZoomIn } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CameraControlsProps {
  onCapture: () => void
  onTorch?: () => void
  onZoom?: (zoom: number) => void
  onSwitch?: () => void
  torch?: boolean
  zoom?: number
  disabled?: boolean
  className?: string
}

export function CameraControls({
  onCapture,
  onTorch,
  onZoom,
  onSwitch,
  torch,
  zoom = 1,
  disabled,
  className
}: CameraControlsProps) {
  return (
    <div className={cn('flex items-center gap-6 p-4 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-2xl', className)}>
      {onTorch && (
        <button
          onClick={onTorch}
          disabled={disabled}
          className={cn(
            'p-3 rounded-full transition-all text-white hover:bg-white/20',
            torch && 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/50'
          )}
        >
          <Zap className="w-5 h-5" />
        </button>
      )}

      <button
        onClick={onCapture}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-accent border-4 border-white flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
      >
        <Camera className="w-8 h-8" />
      </button>

      {onSwitch && (
        <button
          onClick={onSwitch}
          disabled={disabled}
          className="p-3 rounded-full text-white hover:bg-white/20 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
