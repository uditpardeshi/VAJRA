import { toast as sonnerToast } from 'sonner'

export interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
}

export function useToast() {
  const toastFn = (options: ToastOptions) => {
    if (options.variant === 'destructive') {
      sonnerToast.error(options.title, { description: options.description })
    } else if (options.variant === 'warning') {
      sonnerToast.warning(options.title, { description: options.description })
    } else {
      sonnerToast.success(options.title, { description: options.description })
    }
  }

  toastFn.toast = toastFn
  toastFn.success = (message: string, description?: string) => sonnerToast.success(message, { description })
  toastFn.error = (message: string, description?: string) => sonnerToast.error(message, { description })
  toastFn.info = (message: string, description?: string) => sonnerToast.info(message, { description })
  toastFn.warning = (message: string, description?: string) => sonnerToast.warning(message, { description })

  return toastFn
}
