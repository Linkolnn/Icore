export interface ToastOptions {
  duration?: number
  position?: 'top' | 'bottom' | 'top-right' | 'bottom-right'
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  options?: ToastOptions
}

export const useToast = () => {
  const toasts = useState<Toast[]>('toasts', () => [])

  const show = (type: Toast['type'], message: string, options?: ToastOptions) => {
    const toast: Toast = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      options
    }

    toasts.value.push(toast)

    // Auto remove after duration
    const duration = options?.duration || 3000
    setTimeout(() => {
      remove(toast.id)
    }, duration)

    return toast.id
  }

  const remove = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, options?: ToastOptions) => 
    show('success', message, options)

  const error = (message: string, options?: ToastOptions) => 
    show('error', message, options)

  const warning = (message: string, options?: ToastOptions) => 
    show('warning', message, options)

  const info = (message: string, options?: ToastOptions) => 
    show('info', message, options)

  const clear = () => {
    toasts.value = []
  }

  return {
    toasts: readonly(toasts),
    show,
    remove,
    success,
    error,
    warning,
    info,
    clear
  }
}
