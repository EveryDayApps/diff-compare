import { X } from 'lucide-react'
import { type CommitInfo, type FileDisplayMode } from '../lib/github-utils'
import { cn } from '../lib/utils'

interface CommitInfoBarProps {
  commitInfo: CommitInfo
  fileDisplayMode: FileDisplayMode
  onFileDisplayModeChange: (mode: FileDisplayMode) => void
  onClear: () => void
  isDark: boolean
}

export function CommitInfoBar({
  commitInfo,
  fileDisplayMode,
  onFileDisplayModeChange,
  onClear,
  isDark,
}: CommitInfoBarProps) {
  const firstLine = commitInfo.message.split('\n')[0]

  return (
    <div className={cn(
      'flex items-center gap-3 shrink-0 border-b px-4 py-2 min-w-0',
      isDark ? 'bg-surface border-surface-border' : 'bg-white border-surfaceLight-border'
    )}>
      {/* Platform icon */}
      {commitInfo.platform === 'github' ? (
        <GitHubIcon className={cn('shrink-0', isDark ? 'text-white/40' : 'text-gray-400')} />
      ) : (
        <GitLabIcon className="text-orange-400 shrink-0" />
      )}

      {/* SHA */}
      <span className={cn('font-mono text-xs shrink-0', isDark ? 'text-white/45' : 'text-gray-400')}>
        {commitInfo.shortSha}
      </span>

      <span className={cn('w-px h-3 shrink-0', isDark ? 'bg-white/15' : 'bg-gray-200')} />

      {/* Commit message */}
      <span className={cn('text-xs truncate min-w-0 flex-1', isDark ? 'text-white/75' : 'text-gray-700')}>
        {firstLine}
      </span>

      {/* File count */}
      <span className={cn('text-xs shrink-0', isDark ? 'text-white/35' : 'text-gray-400')}>
        {commitInfo.files.length} file{commitInfo.files.length !== 1 ? 's' : ''}
      </span>

      <span className={cn('w-px h-3 shrink-0', isDark ? 'bg-white/15' : 'bg-gray-200')} />

      {/* File display mode */}
      <div className={cn(
        'flex items-center rounded-lg p-0.5 gap-0.5 shrink-0',
        isDark ? 'bg-surface-border/50' : 'bg-gray-100'
      )}>
        {(['tabs', 'stacked'] as FileDisplayMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => onFileDisplayModeChange(mode)}
            className={cn(
              'px-2 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 capitalize',
              fileDisplayMode === mode
                ? isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'
                : isDark ? 'text-surface-muted hover:text-white' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Clear */}
      <button
        onClick={onClear}
        title="Clear commit"
        className={cn(
          'p-1 rounded-md transition-colors shrink-0',
          isDark ? 'text-white/35 hover:text-white hover:bg-white/8' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
        )}
      >
        <X size={13} />
      </button>
    </div>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

function GitLabIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 25 24" fill="currentColor" className={className}>
      <path d="M24.507 9.5l-.034-.09L21.082.506a.748.748 0 00-1.395.323l-2.096 6.452H7.41L5.314.83a.748.748 0 00-1.395-.323L.582 9.406l-.028.09A5.318 5.318 0 002.17 15.6l.01.007.03.022 4.256 3.188 2.107 1.594 1.28.967a.872.872 0 001.054 0l1.28-.967 2.107-1.594 4.286-3.213.012-.009a5.318 5.318 0 001.6-6.105z" />
    </svg>
  )
}
