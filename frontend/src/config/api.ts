import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'
export const DEFAULT_MODEL_URL = import.meta.env.VITE_MODEL_URL || 'https://elmiest-julieta-unmelodramatically.ngrok-free.dev'
export const DEFAULT_API_KEY = import.meta.env.VITE_API_KEY || 'VAJRA-2026-SECRET'

export function getAssetUrl(path?: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  const auth = useAuthStore.getState?.()
  const apiBase = auth?.apiBase || DEFAULT_API_BASE
  const serverOrigin = apiBase.replace(/\/api\/v1\/?$/, '')
  return `${serverOrigin}${path.startsWith('/') ? '' : '/'}${path}`
}

export const api = axios.create({
  baseURL: DEFAULT_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'X-VAJRA-KEY': DEFAULT_API_KEY,
  },
  timeout: 30000,
})

// Dynamically attach current API base and VAJRA key
api.interceptors.request.use((config) => {
  try {
    const auth = useAuthStore.getState?.()
    if (auth?.apiBase && (!config.baseURL || config.baseURL === DEFAULT_API_BASE)) {
      config.baseURL = auth.apiBase
    }
    const key = auth?.apiKey || DEFAULT_API_KEY
    if (key) {
      config.headers['X-VAJRA-KEY'] = key
    }
    config.headers['ngrok-skip-browser-warning'] = 'true'

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
  } catch {
    // Ignore store lookup errors during early initialization
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)
