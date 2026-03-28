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

interface CommitDiffViewProps {
  files: CommitFileDiff[]
  viewMode: ViewMode
  displayMode: FileDisplayMode
  activeFileIndex: number
  onFileSelect: (index: number) => void
  showMinimap: boolean
  isDark: boolean
}

export function CommitDiffView({
  files,
  viewMode,
  displayMode,
  activeFileIndex,
  onFileSelect,
  showMinimap,
  isDark,
}: CommitDiffViewProps) {
  if (files.length === 0) return null

  if (displayMode === 'stacked') {
    return (
      <div className="h-full overflow-y-auto flex flex-col gap-3 p-3">
        {files.map((file) => (
          <FileSection key={file.filename} file={file} viewMode={viewMode} isDark={isDark} />
        ))}
      </div>
    )
  }

  const activeFile = files[displayMode === 'single' ? 0 : activeFileIndex] ?? files[0]

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

function FileSection({ file, viewMode, isDark }: {
  file: CommitFileDiff
  viewMode: ViewMode
  isDark: boolean
}) {
  const displayName = file.previousFilename
    ? `${file.previousFilename} → ${file.filename}`
    : file.filename

  return (
    <div className={cn(
      'rounded-lg border overflow-hidden',
      isDark ? 'border-surface-border' : 'border-surfaceLight-border'
    )}>
      <div className={cn(
        'flex items-center justify-between px-3 py-2 border-b text-xs',
        isDark ? 'bg-surface-raised border-surface-border' : 'bg-gray-50 border-surfaceLight-border'
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot status={file.status} />
          <span className={cn('font-mono truncate', isDark ? 'text-white/80' : 'text-gray-700')}>
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px]">
          {file.additions > 0 && <span className="text-green-400">+{file.additions}</span>}
          {file.deletions > 0 && <span className="text-red-400">-{file.deletions}</span>}
        </div>
      </div>
      {file.original === '' && file.modified === '' ? (
        <div className={cn(
          'px-4 py-3 text-xs italic',
          isDark ? 'text-white/30' : 'text-gray-400'
        )}>
          Binary file — no diff available
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <DiffContent file={file} viewMode={viewMode} showMinimap={false} />
        </div>
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
