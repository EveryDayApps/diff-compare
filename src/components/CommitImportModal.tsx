import { AlertCircle, Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { detectPlatform, fetchCommit, type CommitInfo } from '../lib/github-utils'
import { cn } from '../lib/utils'

interface CommitImportModalProps {
  onLoad: (commit: CommitInfo) => void
  onClose: () => void
  isDark: boolean
}

export function CommitImportModal({ onLoad, onClose, isDark }: CommitImportModalProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const platform = url.trim() ? detectPlatform(url) : null

  const handleLoad = async () => {
    const trimmed = url.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const commit = await fetchCommit(trimmed)
      onLoad(commit)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load commit')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLoad()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={cn(
        'w-full max-w-lg mx-4 rounded-2xl border shadow-2xl',
        isDark ? 'bg-surface border-surface-border' : 'bg-white border-gray-200'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 pt-5 pb-4 border-b',
          isDark ? 'border-surface-border' : 'border-gray-100'
        )}>
          <div>
            <h2 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
              Import Commit
            </h2>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-white/40' : 'text-gray-400')}>
              Supports GitHub and GitLab public repositories
            </p>
          </div>
          <div className="flex items-center gap-3">
            <GitHubIcon className={cn(platform === 'github' ? (isDark ? 'text-white' : 'text-gray-800') : (isDark ? 'text-white/20' : 'text-gray-200'))} />
            <GitLabIcon className={cn(platform === 'gitlab' ? 'text-orange-400' : (isDark ? 'text-white/20' : 'text-gray-200'))} />
            <button
              onClick={onClose}
              className={cn(
                'p-1.5 rounded-md transition-colors ml-1',
                isDark ? 'text-white/40 hover:text-white hover:bg-white/8' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <div className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
            isDark
              ? 'bg-surface-raised border-surface-border focus-within:border-white/20'
              : 'bg-gray-50 border-gray-200 focus-within:border-gray-300'
          )}>
            {platform === 'github' && <GitHubIcon className={isDark ? 'text-white/50 shrink-0' : 'text-gray-400 shrink-0'} />}
            {platform === 'gitlab' && <GitLabIcon className="text-orange-400 shrink-0" />}
            {!platform && <LinkIcon className={isDark ? 'text-white/25 shrink-0' : 'text-gray-300 shrink-0'} />}
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(null) }}
              onKeyDown={handleKeyDown}
              placeholder="https://github.com/owner/repo/commit/abc1234"
              className={cn(
                'flex-1 bg-transparent text-sm outline-none min-w-0',
                isDark ? 'text-white placeholder:text-white/25' : 'text-gray-900 placeholder:text-gray-400'
              )}
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-red-400">
              <AlertCircle size={12} className="shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          'flex items-center justify-end gap-2 px-5 pb-5'
        )}>
          <button
            onClick={onClose}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              isDark ? 'text-white/50 hover:text-white hover:bg-white/8' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleLoad}
            disabled={loading || !url.trim()}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              isDark
                ? 'bg-white text-gray-900 hover:bg-white/90'
                : 'bg-gray-900 text-white hover:bg-gray-700'
            )}
          >
            {loading && <Loader2 size={11} className="animate-spin" />}
            Load Commit
          </button>
        </div>
      </div>
    </div>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" className={cn('transition-colors', className)}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

function GitLabIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 25 24" fill="currentColor" className={cn('transition-colors', className)}>
      <path d="M24.507 9.5l-.034-.09L21.082.506a.748.748 0 00-1.395.323l-2.096 6.452H7.41L5.314.83a.748.748 0 00-1.395-.323L.582 9.406l-.028.09A5.318 5.318 0 002.17 15.6l.01.007.03.022 4.256 3.188 2.107 1.594 1.28.967a.872.872 0 001.054 0l1.28-.967 2.107-1.594 4.286-3.213.012-.009a5.318 5.318 0 001.6-6.105z" />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}
