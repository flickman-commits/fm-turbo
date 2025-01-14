import { toast as sonnerToast } from 'sonner'
import { ReactNode } from 'react'

interface ToastOptions {
  description?: ReactNode
  duration?: number
  position?: 'top-center' | 'bottom-center'
  className?: string
}

export const toast = {
  success: (title: string, options?: ToastOptions) => {
    sonnerToast(title, {
      ...options,
      className: "rainbow-gradient-border",
      duration: options?.duration || 3000,
    })
  },
  error: (title: string, options?: ToastOptions) => {
    sonnerToast.error(title, {
      ...options,
      className: "rainbow-gradient-border border-red-500",
      duration: options?.duration || 3000,
    })
  },
  loading: (title: string, options?: ToastOptions) => {
    return sonnerToast.loading(title, {
      ...options,
      className: "rainbow-gradient-border",
      duration: options?.duration || 3000,
    })
  },
  dismiss: (toastId: string | number) => {
    sonnerToast.dismiss(toastId)
  },
  message: (title: string, options?: ToastOptions): string | number => {
    return sonnerToast(title, {
      ...options,
      className: options?.className || "rainbow-gradient-border",
      duration: options?.duration || 3000,
    })
  }
} 