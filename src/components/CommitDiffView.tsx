import { useState, useCallback, useEffect } from 'react'
import { type DiffLine, type DiffStats } from '../lib/diff-utils'
import { type CommitFile } from '../lib/github-utils'
import { cn } from '../lib/utils'
import { SideBySideDiffViewer, UnifiedDiffViewer } from './DiffViewer'
import { type FileDisplayMode } from '../lib/github-utils'
import { type ViewMode } from './Toolbar'

export interface CommitFileDiff extends CommitFile {
  lines: DiffLine[]
  leftLines: DiffLine[]
  rightLines: DiffLine[]
  stats: DiffStats
}

export type StackedControls = { toggle: () => void }

interface CommitDiffViewProps {
  files: CommitFileDiff[]
  viewMode: ViewMode
  displayMode: FileDisplayMode
  activeFileIndex: number
  onFileSelect: (index: number) => void
  showMinimap: boolean
  isDark: boolean
  stackedControlsRef?: { current: StackedControls | null }
  onStackedExpandedChange?: (allExpanded: boolean) => void
}

export function CommitDiffView({
  files,
  viewMode,
  displayMode,
  activeFileIndex,
  onFileSelect,
  showMinimap,
  isDark,
  stackedControlsRef,
  onStackedExpandedChange,
}: CommitDiffViewProps) {
  if (files.length === 0) return null

  if (displayMode === 'stacked') {
    return <StackedView files={files} viewMode={viewMode} isDark={isDark} controlsRef={stackedControlsRef} onExpandedChange={onStackedExpandedChange} />
  }

  const activeFile = files[activeFileIndex] ?? files[0]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {displayMode === 'tabs' && (
        <FileTabs
          files={files}
          activeIndex={activeFileIndex}
          onSelect={onFileSelect}
          isDark={isDark}
        />
      )}
      <div className="flex-1 overflow-hidden">
        <DiffContent file={activeFile} viewMode={viewMode} showMinimap={showMinimap} />
      </div>
    </div>
  )
}

function FileTabs({ files, activeIndex, onSelect, isDark }: {
  files: CommitFileDiff[]
  activeIndex: number
  onSelect: (i: number) => void
  isDark: boolean
}) {
  return (
    <div className={cn(
      'flex items-end overflow-x-auto shrink-0 px-2 pt-1',
      isDark ? 'border-b border-surface-border' : 'border-b border-surfaceLight-border',
    )}>
      {files.map((file, i) => {
        const name = file.filename.split('/').pop() ?? file.filename
        const isActive = i === activeIndex
        return (
          <button
            key={file.filename}
            onClick={() => onSelect(i)}
            title={file.filename}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-all whitespace-nowrap border-b-2 -mb-px rounded-t shrink-0',
              isActive
                ? isDark
                  ? 'text-white border-white/50 bg-white/5'
                  : 'text-gray-900 border-gray-700 bg-gray-50'
                : isDark
                  ? 'text-white/45 border-transparent hover:text-white/80 hover:bg-white/4'
                  : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50'
            )}
          >
            <StatusDot status={file.status} />
            <span className="max-w-[140px] truncate font-mono">{name}</span>
            <span className="flex items-center gap-1 text-[10px] opacity-70">
              {file.additions > 0 && <span className="text-green-400">+{file.additions}</span>}
              {file.deletions > 0 && <span className="text-red-400">-{file.deletions}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function StackedView({ files, viewMode, isDark, controlsRef, onExpandedChange }: {
  files: CommitFileDiff[]
  viewMode: ViewMode
  isDark: boolean
  controlsRef?: { current: StackedControls | null }
  onExpandedChange?: (allExpanded: boolean) => void
}) {
  const defaultOpen = files.length <= 4
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(files.map(f => [f.filename, defaultOpen]))
  )

  useEffect(() => {
    onExpandedChange?.(files.every(f => openMap[f.filename]))
  }, [openMap, files, onExpandedChange])

  const toggle = useCallback((filename: string) => {
    setOpenMap(prev => ({ ...prev, [filename]: !prev[filename] }))
  }, [])

  useEffect(() => {
    if (controlsRef) {
      controlsRef.current = {
        toggle: () => setOpenMap(prev => {
          const allOpen = files.every(f => prev[f.filename])
          return Object.fromEntries(files.map(f => [f.filename, !allOpen]))
        }),
      }
    }
  })

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col gap-2 p-3">
        {files.map((file) => (
          <FileSection
            key={file.filename}
            file={file}
            viewMode={viewMode}
            isDark={isDark}
            isOpen={!!openMap[file.filename]}
            onToggle={() => toggle(file.filename)}
          />
        ))}
      </div>
    </div>
  )
}

function FileSection({ file, viewMode, isDark, isOpen, onToggle }: {
  file: CommitFileDiff
  viewMode: ViewMode
  isDark: boolean
  isOpen: boolean
  onToggle: () => void
}) {
  const displayName = file.previousFilename
    ? `${file.previousFilename} → ${file.filename}`
    : file.filename

  const isBinary = file.original === '' && file.modified === ''

  return (
    <div className={cn(
      'rounded-lg border overflow-hidden',
      isDark ? 'border-surface-border' : 'border-surfaceLight-border'
    )}>
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors',
          isDark
            ? 'bg-surface-raised hover:bg-white/5'
            : 'bg-gray-50 hover:bg-gray-100',
          isOpen && (isDark ? 'border-b border-surface-border' : 'border-b border-surfaceLight-border')
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Chevron */}
          <svg
            className={cn('w-3 h-3 shrink-0 transition-transform', isDark ? 'text-white/30' : 'text-gray-400', isOpen && 'rotate-90')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <StatusDot status={file.status} />
          <span className={cn('font-mono truncate', isDark ? 'text-white/80' : 'text-gray-700')}>
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px]">
          {file.additions > 0 && <span className="text-green-400">+{file.additions}</span>}
          {file.deletions > 0 && <span className="text-red-400">-{file.deletions}</span>}
          {isBinary && (
            <span className={cn('italic', isDark ? 'text-white/30' : 'text-gray-400')}>binary</span>
          )}
        </div>
      </button>
      {isOpen && (
        isBinary ? (
          <div className={cn(
            'px-4 py-3 text-xs italic',
            isDark ? 'text-white/30' : 'text-gray-400'
          )}>
            Binary file — no diff available
          </div>
        ) : (
          <DiffContent file={file} viewMode={viewMode} showMinimap={false} />
        )
      )}
    </div>
  )
}

function DiffContent({ file, viewMode, showMinimap }: {
  file: CommitFileDiff
  viewMode: ViewMode
  showMinimap: boolean
}) {
  if (viewMode === 'unified') {
    return <UnifiedDiffViewer lines={file.lines} wrapLines={true} showMinimap={showMinimap} />
  }
  return (
    <SideBySideDiffViewer
      leftLines={file.leftLines}
      rightLines={file.rightLines}
      wrapLines={true}
      showMinimap={showMinimap}
    />
  )
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'added' ? 'bg-green-400' :
    status === 'removed' ? 'bg-red-400' :
    status === 'renamed' || status === 'copied' ? 'bg-blue-400' :
    'bg-yellow-400'

  return <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', color)} />
}
