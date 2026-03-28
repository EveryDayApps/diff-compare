import { Check, Copy, Loader2, Share2, WifiOff, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ShareState } from '../hooks/usePeerShare'
import type { Theme } from '../hooks/useTheme'
import { cn } from '../lib/utils'

interface SharePanelProps {
  shareState: ShareState
  shareUrl: string | null
  errorMessage: string | null
  onShare: () => void
  onStop: () => void
  theme: Theme
}

export function SharePanel({ shareState, shareUrl, errorMessage, onShare, onStop, theme }: SharePanelProps) {
  const isDark = theme !== 'light'
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (shareState === 'idle') return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onStop()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [shareState, onStop])

  const isActive = shareState !== 'idle' && shareState !== 'receiving' && shareState !== 'received'

  return (
    <div ref={ref} className="relative">
      <div className="relative group flex items-center justify-center">
        <button
          onClick={isActive ? undefined : onShare}
          className={cn(
            'p-2 rounded-md transition-colors duration-150',
            isActive
              ? isDark ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100'
              : isDark
              ? 'text-surface-muted hover:text-white hover:bg-white/5'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
          )}
        >
          {shareState === 'waiting'
            ? <Loader2 size={14} className="animate-spin" />
            : <Share2 size={14} />}
        </button>
        {!isActive && (
          <div className={cn(
            'absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none z-50 px-2.5 py-1.5 text-xs font-medium rounded-md opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 whitespace-nowrap shadow-xl border',
            isDark
              ? 'bg-surface-raised border-surface-border text-surface-muted group-hover:text-white'
              : 'bg-white border-surfaceLight-border text-gray-500 group-hover:text-gray-900'
          )}>
            Share diff
          </div>
        )}
      </div>

      {isActive && (
        <div className={cn(
          'absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-xl z-50 p-4',
          isDark ? 'bg-surface-raised border-surface-border' : 'bg-white border-gray-200'
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
              Share Diff
            </span>
            <button
              onClick={onStop}
              className={cn('p-1 rounded transition-colors', isDark ? 'text-surface-muted hover:text-white' : 'text-gray-400 hover:text-gray-700')}
            >
              <X size={12} />
            </button>
          </div>

          {shareState === 'waiting' && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Loader2 size={13} className="animate-spin text-blue-400 shrink-0" />
                <span className={cn('text-xs', isDark ? 'text-surface-muted' : 'text-gray-500')}>
                  Waiting for someone to open the link...
                </span>
              </div>
              {shareUrl && (
                <div className={cn(
                  'flex items-center gap-2 p-2 rounded-lg border',
                  isDark ? 'bg-surface border-surface-border' : 'bg-gray-50 border-gray-200'
                )}>
                  <span className={cn('flex-1 truncate font-mono text-[10px]', isDark ? 'text-surface-muted' : 'text-gray-500')}>
                    {shareUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={cn('shrink-0 p-1 rounded transition-colors', isDark ? 'hover:bg-white/10 text-surface-muted hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700')}
                  >
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                </div>
              )}
              <p className={cn('mt-2 text-[10px]', isDark ? 'text-surface-muted' : 'text-gray-400')}>
                Keep this tab open while the recipient opens the link.
              </p>
            </>
          )}

          {shareState === 'connected' && (
            <div className="flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-green-400 shrink-0" />
              <span className={cn('text-xs', isDark ? 'text-white' : 'text-gray-900')}>
                Connected! Sending diff...
              </span>
            </div>
          )}

          {shareState === 'sent' && (
            <div className="flex items-center gap-2">
              <Check size={13} className="text-green-400 shrink-0" />
              <span className={cn('text-xs', isDark ? 'text-white' : 'text-gray-900')}>
                Diff sent successfully!
              </span>
            </div>
          )}

          {shareState === 'error' && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <WifiOff size={13} className="text-red-400 shrink-0" />
                <span className={cn('text-xs', isDark ? 'text-white' : 'text-gray-900')}>
                  {errorMessage || 'Connection failed.'}
                </span>
              </div>
              <button
                onClick={onShare}
                className={cn(
                  'w-full py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                )}
              >
                Try again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
