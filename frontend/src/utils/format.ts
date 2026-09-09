import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm')
  } catch {
    return dateString
  }
}

export function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'N/A'
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch {
    return dateString
  }
}

export function formatConfidence(score?: number): string {
  if (score === undefined || score === null) return 'N/A'
  return `${Math.round(score * 100)}%`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
