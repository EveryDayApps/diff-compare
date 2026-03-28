import { AlertCircle, Check, Info, Loader2, X } from 'lucide-react'
import { cn } from '../lib/utils'
import type { ToastItem, ToastType } from '../hooks/useToast'

const ICONS: Record<ToastType | 'loading', React.ReactNode> = {
  error: <AlertCircle size={15} />,
  success: <Check size={15} />,
  info: <Info size={15} />,
  loading: <Loader2 size={15} className="animate-spin" />,
}

const STYLES: Record<ToastType, { dark: string; light: string; icon: string }> = {
  error: {
    dark: 'bg-red-950/95 border-red-800/50 text-red-100',
    light: 'bg-white border-red-200 text-gray-900',
    icon: 'text-red-400',
  },
  success: {
    dark: 'bg-emerald-950/95 border-emerald-800/50 text-emerald-100',
    light: 'bg-white border-emerald-200 text-gray-900',
    icon: 'text-emerald-400',
  },
  info: {
    dark: 'bg-surface-raised/95 border-surface-border text-white/85',
    light: 'bg-white border-gray-200 text-gray-900',
    icon: 'text-blue-400',
  },
}

interface ToasterProps {
  toasts: ToastItem[]
  onRemove: (id: string) => void
  isDark: boolean
}

export function Toaster({ toasts, onRemove, isDark }: ToasterProps) {
  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(toast => {
        const s = STYLES[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 pl-4 pr-3 py-3 rounded-xl border shadow-2xl text-sm font-medium',
              'pointer-events-auto animate-toast-in backdrop-blur-sm w-80 max-w-[calc(100vw-2.5rem)]',
              isDark ? s.dark : s.light
            )}
          >
            <span className={cn('shrink-0 mt-px', s.icon)}>
              {ICONS[toast.type]}
            </span>
            <span className="flex-1 leading-snug break-words">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className={cn(
                'shrink-0 mt-px p-0.5 rounded transition-opacity',
                isDark ? 'opacity-40 hover:opacity-80 text-white' : 'opacity-40 hover:opacity-70 text-gray-700'
              )}
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
