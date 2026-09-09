import { useRef, useEffect, useCallback, useState } from 'react'
import type { ARObject } from '@/store/inspectionStore'

export function useAROverlay(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  objects: ARObject[],
  enabled = true
) {
  const animationRef = useRef<number>()
  const [fps, setFps] = useState(60)
  const lastFrameRef = useRef(performance.now())

  const draw = useCallback((timestamp: number) => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !enabled) {
      animationRef.current = requestAnimationFrame(draw)
      return
    }

    const now = performance.now()
    const delta = now - lastFrameRef.current
    if (delta > 0) {
      setFps(Math.round(1000 / delta))
    }
    lastFrameRef.current = now

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      animationRef.current = requestAnimationFrame(draw)
      return
    }

    if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
      canvas.width = video.clientWidth || 640
      canvas.height = video.clientHeight || 480
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 3
    ctx.font = '14px Inter, system-ui'
    ctx.textBaseline = 'top'

    const pulsePhase = (timestamp % 2000) / 2000

    for (const obj of objects) {
      const x = obj.x * canvas.width
      const y = obj.y * canvas.height
      const w = obj.w * canvas.width
      const h = obj.h * canvas.height

      const baseColor = obj.color || '#e94560'
      const pulseAlpha = obj.animated ? 0.4 + 0.5 * Math.sin(pulsePhase * Math.PI * 2) : 1
      ctx.globalAlpha = pulseAlpha

      switch (obj.type) {
        case 'box': {
          ctx.strokeStyle = baseColor
          ctx.fillStyle = baseColor + '33'
          ctx.beginPath()
          ctx.roundRect(x, y, w, h, 8)
          ctx.stroke()
          ctx.fill()
          if (obj.label) {
            ctx.fillStyle = baseColor
            ctx.fillRect(x, y - 24, ctx.measureText(obj.label).width + 12, 22)
            ctx.fillStyle = '#ffffff'
            ctx.fillText(obj.label, x + 6, y - 20)
          }
          if (obj.confidence !== undefined) {
            const confText = `${Math.round(obj.confidence * 100)}%`
            ctx.fillStyle = baseColor
            ctx.fillText(confText, x + w - 40, y - 20)
          }
          break
        }
        case 'pulse': {
          const radius = Math.max(w, h) / 2 * (0.8 + 0.4 * Math.sin(pulsePhase * Math.PI * 2))
          ctx.strokeStyle = baseColor
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2)
          ctx.stroke()
          break
        }
      }
      ctx.globalAlpha = 1
    }

    animationRef.current = requestAnimationFrame(draw)
  }, [videoRef, canvasRef, objects, enabled])

  useEffect(() => {
    if (!enabled) return
    animationRef.current = requestAnimationFrame(draw)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [draw, enabled])

  return { fps }
}
