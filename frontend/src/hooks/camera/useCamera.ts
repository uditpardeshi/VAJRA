import { useRef, useEffect, useState, useCallback } from 'react'

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  torch?: boolean;
  zoom?: number;
  frameRate?: number;
}

export interface CameraState {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  error: string | null;
  capabilities: MediaTrackCapabilities | null;
  settings: CameraOptions;
  start: (opts?: CameraOptions) => Promise<void>;
  stop: () => void;
  toggleTorch: () => Promise<void>;
  setZoom: (zoom: number) => Promise<void>;
  switchCamera: () => Promise<void>;
  takePhoto: (quality?: number) => string | null;
}

export function useCamera(): CameraState {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capabilities, setCapabilities] = useState<MediaTrackCapabilities | null>(null)
  const [settings, setSettings] = useState<CameraOptions>({ facingMode: 'environment', width: 1920, height: 1080, frameRate: 30 })
  const trackRef = useRef<MediaStreamTrack | null>(null)

  const start = useCallback(async (opts: CameraOptions = {}) => {
    setError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser')
      }
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: opts.facingMode || 'environment',
          width: { ideal: opts.width || 1920 },
          height: { ideal: opts.height || 1080 },
          frameRate: { ideal: opts.frameRate || 30 }
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      trackRef.current = stream.getVideoTracks()[0]
      if (trackRef.current.getCapabilities) {
        setCapabilities(trackRef.current.getCapabilities())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
      setSettings(prev => ({ ...prev, ...opts }))
      setIsActive(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Camera access denied'
      setError(msg)
      setIsActive(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
      trackRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
  }, [])

  const toggleTorch = useCallback(async () => {
    if (!trackRef.current) return
    try {
      const nextTorch = !settings.torch
      await trackRef.current.applyConstraints({ advanced: [{ torch: nextTorch } as any] })
      setSettings(s => ({ ...s, torch: nextTorch }))
    } catch (e) {
      console.warn('Torch toggle not supported:', e)
    }
  }, [settings.torch])

  const setZoom = useCallback(async (zoom: number) => {
    const caps = capabilities as any
    if (!trackRef.current || !caps?.zoom) return
    const max = caps.zoom.max || 5
    const clamped = Math.max(1, Math.min(max, zoom))
    try {
      await trackRef.current.applyConstraints({ advanced: [{ zoom: clamped } as any] })
      setSettings(s => ({ ...s, zoom: clamped }))
    } catch (e) {
      console.warn('Zoom not supported:', e)
    }
  }, [capabilities])

  const switchCamera = useCallback(async () => {
    stop()
    await start({ ...settings, facingMode: settings.facingMode === 'user' ? 'environment' : 'user' })
  }, [settings, start, stop])

  const takePhoto = useCallback((quality = 0.85) => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    return dataUrl.split(',')[1] || null
  }, [])

  useEffect(() => {
    return () => stop()
  }, [stop])

  return { stream: streamRef.current, videoRef, canvasRef, isActive, error, capabilities, settings, start, stop, toggleTorch, setZoom, switchCamera, takePhoto }
}
