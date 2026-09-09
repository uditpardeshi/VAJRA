import React from 'react'

export interface ARCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function ARCanvas({ canvasRef }: ARCanvasProps) {
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  )
}
