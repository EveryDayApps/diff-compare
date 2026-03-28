import { useCallback, useRef, useState } from 'react'

export type ToastType = 'error' | 'success' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 10)
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      const timer = setTimeout(() => removeToast(id), duration)
      timers.current.set(id, timer)
    }
    return id
  }, [removeToast])

  return { toasts, addToast, removeToast }
}
