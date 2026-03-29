import { AlignLeft, Maximize2, Minimize2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimationModal } from './components/AnimationModal'
import { CommitDiffView, type CommitFileDiff } from './components/CommitDiffView'
import { CommitImportModal } from './components/CommitImportModal'
import { CommitInfoBar } from './components/CommitInfoBar'
import { DiffSettings, type DiffSettingsState } from './components/DiffSettings'
import { DiffStatsBar } from './components/DiffStats'
import { SideBySideDiffViewer, UnifiedDiffViewer } from './components/DiffViewer'
import { EditorPanel } from './components/EditorPanel'
import { TabBar } from './components/TabBar'
import { Toaster } from './components/Toaster'
import { Toolbar, type ViewMode } from './components/Toolbar'
import { useLocalStorage } from './hooks/useLocalStorage'
import { usePeerShare, type ShareState } from './hooks/usePeerShare'
import { useTheme } from './hooks/useTheme'
import { useToast } from './hooks/useToast'
import { computeLineDiff, computeSideBySide } from './lib/diff-utils'
import { type CommitInfo, type FileDisplayMode } from './lib/github-utils'
import { cn } from './lib/utils'

// @ts-expect-error - Vite specific
const rawFiles = import.meta.glob('../dump/examples/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const file1 = rawFiles['../dump/examples/file1.txt'] || ''
const file2 = rawFiles['../dump/examples/file2.txt'] || ''

interface DiffTabState {
  id: string
  original: string
  modified: string
  originalFileName?: string
  modifiedFileName?: string
  commitInfo: CommitInfo | null
  activeFileIndex: number
  fileDisplayMode: FileDisplayMode
}

function createTab(overrides?: Partial<Omit<DiffTabState, 'id'>>): DiffTabState {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    original: '',
    modified: '',
    originalFileName: undefined,
    modifiedFileName: undefined,
    commitInfo: null,
    activeFileIndex: 0,
    fileDisplayMode: 'tabs',
    ...overrides,
  }
}

function getTabLabel(tab: DiffTabState, index: number): string {
  if (tab.commitInfo) return tab.commitInfo.shortSha
  if (tab.originalFileName) return tab.originalFileName.split('/').pop() ?? tab.originalFileName
  if (tab.modifiedFileName) return tab.modifiedFileName.split('/').pop() ?? tab.modifiedFileName
  return `Diff ${index + 1}`
}

// Module-level initial tab so both useState calls can share the same ID
const _initialTab = createTab({ original: file1, modified: file2 })

export default function App() {
  const { theme, selectedTheme, setTheme, isDark } = useTheme()

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [tabs, setTabs] = useState<DiffTabState[]>([_initialTab])
  const [activeTabId, setActiveTabId] = useState(_initialTab.id)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]

  const updateActiveTab = useCallback((updates: Partial<DiffTabState>) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t))
  }, [activeTabId])

  const addTab = useCallback(() => {
    const tab = createTab()
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
  }, [])

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      if (prev.length === 1) return prev
      const idx = prev.findIndex(t => t.id === id)
      const next = prev.filter(t => t.id !== id)
      if (id === activeTabId) {
        setActiveTabId(next[Math.max(0, idx - 1)].id)
      }
      return next
    })
  }, [activeTabId])

  // Destructure active tab for convenience
  const {
    original, modified,
    originalFileName, modifiedFileName,
    commitInfo, activeFileIndex, fileDisplayMode,
  } = activeTab

  // ── Global settings ────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('diffViewMode', 'split')
  const [diffSettings, setDiffSettings] = useLocalStorage<DiffSettingsState>('diffSettings', {
    ignoreWhitespace: false,
    ignoreCase: false,
    ignoreEmptyLines: false,
    ignoreLineEndings: false,
    showMinimap: false,
  })
  const [showAnimation, setShowAnimation] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // ── Commit helpers ─────────────────────────────────────────────────────────
  const handleCommitLoad = (commit: CommitInfo) => {
    updateActiveTab({ commitInfo: commit, activeFileIndex: 0 })
    setIsExpanded(false)
  }

  const handleCommitClear = () => {
    updateActiveTab({ commitInfo: null, activeFileIndex: 0 })
  }

  const commitFileDiffs = useMemo<CommitFileDiff[]>(() => {
    if (!commitInfo) return []
    return commitInfo.files.map(file => {
      const { lines, stats } = computeLineDiff(file.original, file.modified, diffSettings.ignoreWhitespace, diffSettings)
      const { left: leftLines, right: rightLines } = computeSideBySide(lines)
      return { ...file, lines, stats, leftLines, rightLines }
    })
  }, [commitInfo, diffSettings])

  // ── Maximize ───────────────────────────────────────────────────────────────
  const [isMaximized, setIsMaximized] = useState(false)
  const isMaximizedRef = useRef(false)
  const prevExpandedRef = useRef(false)

  const enterMaximize = useCallback(() => {
    prevExpandedRef.current = isExpanded
    isMaximizedRef.current = true
    setIsMaximized(true)
    setIsExpanded(true)
    document.documentElement.requestFullscreen?.().catch(() => {})
  }, [isExpanded])

  const exitMaximize = useCallback(() => {
    isMaximizedRef.current = false
    setIsMaximized(false)
    setIsExpanded(prevExpandedRef.current)
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  // ── Toast / Share ──────────────────────────────────────────────────────────
  const { toasts, addToast, removeToast } = useToast()
  const handleFileError = useCallback((msg: string) => addToast(msg, 'error'), [addToast])

  const { shareState, shareUrl, startSharing, stopSharing, errorMessage: shareErrorMessage } = usePeerShare({
    onReceive: (payload) => {
      updateActiveTab({
        original: payload.original,
        modified: payload.modified,
        originalFileName: payload.originalFileName,
        modifiedFileName: payload.modifiedFileName,
      })
      setDiffSettings(payload.diffSettings)
    },
  })

  const prevShareState = useRef<ShareState>('idle')
  const receivingToastId = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevShareState.current
    prevShareState.current = shareState

    if (shareState === 'receiving' && prev !== 'receiving') {
      receivingToastId.current = addToast('Receiving diff from peer…', 'info', 0)
    } else if (shareState === 'received') {
      if (receivingToastId.current) { removeToast(receivingToastId.current); receivingToastId.current = null }
      addToast('Diff loaded from peer!', 'success', 4000)
    } else if (shareState === 'sent') {
      addToast('Diff sent successfully!', 'success', 3000)
    } else if (shareState === 'error' && prev !== 'error') {
      addToast(shareErrorMessage || 'Connection failed.', 'error', 5000)
    }
  }, [shareState, shareErrorMessage, addToast, removeToast])

  const handleShare = () => {
    startSharing({ version: 1, original, modified, originalFileName, modifiedFileName, diffSettings })
  }

  // ── Keyboard / fullscreen ──────────────────────────────────────────────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isMaximizedRef.current) {
        isMaximizedRef.current = false
        setIsMaximized(false)
        setIsExpanded(prevExpandedRef.current)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setIsExpanded(prev => !prev)
      }
      if (e.key === 'Escape' && isMaximizedRef.current) exitMaximize()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [exitMaximize])

  const shortcutText = useMemo(() => {
    if (typeof navigator !== 'undefined') {
      return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent) ? '⌘E' : 'Ctrl+E'
    }
    return '⌘E'
  }, [])

  // ── Diff compute ───────────────────────────────────────────────────────────
  const { lines, stats } = useMemo(
    () => computeLineDiff(original, modified, diffSettings.ignoreWhitespace, diffSettings),
    [original, modified, diffSettings]
  )

  const { left: leftLines, right: rightLines } = useMemo(() => computeSideBySide(lines), [lines])

  const hasContent = commitInfo ? true : (original.trim() !== '' || modified.trim() !== '')

  const handleReset = () => {
    updateActiveTab({ original: '', modified: '', originalFileName: undefined, modifiedFileName: undefined })
  }

  const handleSwap = () => {
    updateActiveTab({ original: modified, modified: original, originalFileName: modifiedFileName, modifiedFileName: originalFileName })
  }

  const commitStats = commitInfo
    ? (fileDisplayMode === 'stacked'
        ? commitFileDiffs.reduce((acc, f) => ({
            added: acc.added + f.stats.added,
            removed: acc.removed + f.stats.removed,
            equal: acc.equal + f.stats.equal,
            total: acc.total + f.stats.total,
          }), { added: 0, removed: 0, equal: 0, total: 0 })
        : (commitFileDiffs[activeFileIndex]?.stats ?? null))
    : null

  // Tab labels
  const tabItems = tabs.map((t, i) => ({
    id: t.id,
    label: getTabLabel(t, i),
    isActive: t.id === activeTabId,
  }))

  return (
    <div
      className={cn(
        'flex flex-col h-screen overflow-hidden transition-colors duration-300',
        isDark ? 'bg-surface text-white' : 'bg-surfaceLight text-gray-900'
      )}
    >
      {!isMaximized && (
        <Toolbar
          theme={theme}
          selectedTheme={selectedTheme}
          onSetTheme={setTheme}
          onSwap={commitInfo ? () => {} : handleSwap}
          onReset={commitInfo ? handleCommitClear : handleReset}
          hasContent={hasContent}
          onAnimate={() => setShowAnimation(true)}
          onOpenImport={() => setShowImportModal(true)}
          isCommitActive={!!commitInfo}
          stats={commitInfo ? commitStats : stats}
          shareState={shareState}
          shareUrl={shareUrl}
          shareErrorMessage={shareErrorMessage}
          onShare={handleShare}
          onStopShare={stopSharing}
          isMaximized={isMaximized}
          onToggleMaximize={enterMaximize}
          onNewTab={addTab}
        />
      )}

      {/* Tab bar — always shown below toolbar */}
      {!isMaximized && (tabItems.length > 1) && (
        <TabBar
          tabs={tabItems}
          onSelect={setActiveTabId}
          onClose={closeTab}
          isDark={isDark}
        />
      )}

      {commitInfo && (
        <CommitInfoBar
          commitInfo={commitInfo}
          fileDisplayMode={fileDisplayMode}
          onFileDisplayModeChange={mode => updateActiveTab({ fileDisplayMode: mode })}
          onClear={handleCommitClear}
          isDark={isDark}
        />
      )}

      {/* Input Panels — hidden in commit mode */}
      {!commitInfo && (
        <>
          <div
            className={cn(
              'grid grid-cols-2 px-4 shrink-0 transition-all duration-500 ease-in-out overflow-hidden',
              isExpanded
                ? 'opacity-0 gap-0 pt-0 pb-0 pointer-events-none'
                : cn('gap-3 pt-4 opacity-100', viewMode === 'unified' ? 'pb-1' : 'pb-3')
            )}
            style={{ height: isExpanded ? '0px' : (viewMode === 'unified' ? '38%' : '46%') }}
          >
            <EditorPanel
              label="Original"
              value={original}
              onChange={v => updateActiveTab({ original: v })}
              fileName={originalFileName}
              onFileLoad={(name, content) => updateActiveTab({ originalFileName: name, original: content })}
              onClear={() => updateActiveTab({ original: '', originalFileName: undefined })}
              side="left"
              theme={theme}
              onFileError={handleFileError}
            />
            <EditorPanel
              label="Modified"
              value={modified}
              onChange={v => updateActiveTab({ modified: v })}
              fileName={modifiedFileName}
              onFileLoad={(name, content) => updateActiveTab({ modifiedFileName: name, modified: content })}
              onClear={() => updateActiveTab({ modified: '', modifiedFileName: undefined })}
              side="right"
              theme={theme}
              onFileError={handleFileError}
            />
          </div>
          <div
            className={cn(
              'mx-4 shrink-0 transition-all duration-500 ease-in-out',
              isExpanded ? 'border-b-0 opacity-0' : cn('border-b', isDark ? 'border-surface-border' : 'border-surfaceLight-border')
            )}
          />
        </>
      )}

      {showImportModal && (
        <CommitImportModal
          onLoad={handleCommitLoad}
          onClose={() => setShowImportModal(false)}
          isDark={isDark}
        />
      )}

      {/* Diff Output */}
      <div className={cn('flex-1 overflow-hidden px-4 py-3 flex flex-col gap-1')}>
        <div className="flex items-center mb-1.5 px-0.5">
          {/* Left: view mode toggle */}
          <div className="flex-1 flex items-center gap-1.5">
            <div
              className={cn(
                'flex items-center rounded-lg p-0.5 gap-0.5',
                isDark ? 'bg-surface-border/50' : 'bg-gray-100'
              )}
            >
              <button
                id="view-unified-diff"
                onClick={() => setViewMode('unified')}
                title="Unified view"
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-150',
                  viewMode === 'unified'
                    ? isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDark ? 'text-surface-muted hover:text-white' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                <AlignLeft size={12} />
                <span>Unified</span>
              </button>
              <button
                id="view-split-diff"
                onClick={() => setViewMode('split')}
                title="Split view"
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-150',
                  viewMode === 'split'
                    ? isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDark ? 'text-surface-muted hover:text-white' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                <SplitMiniIcon />
                <span>Split</span>
              </button>
            </div>
          </div>

          {/* Center: diff stats */}
          <div className="flex-1 flex justify-center">
            {hasContent && stats && <DiffStatsBar stats={stats} theme={theme} />}
          </div>

          {/* Right: expand/collapse + settings */}
          <div className="flex-1 flex justify-end items-center gap-2">
            {!commitInfo && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ display: isMaximized ? 'none' : undefined }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors",
                  isDark
                    ? "text-surface-muted hover:text-white hover:bg-surface-raised"
                    : "text-gray-500 hover:text-gray-900 border hover:bg-gray-50 bg-white"
                )}
                title={isExpanded ? "Collapse View (Cmd/Ctrl + E)" : "Expand View (Cmd/Ctrl + E)"}
              >
                {isExpanded ? (
                  <>
                    <Minimize2 size={13} /> Collapse
                    <kbd className={cn(
                      "ml-1 flex items-center justify-center px-1 py-0.5 rounded font-sans text-[9px] leading-none border",
                      isDark ? "bg-surface-raised border-surfaceLight-border/20 text-surface-muted" : "bg-gray-100 border-gray-200 text-gray-500"
                    )}>
                      {shortcutText}
                    </kbd>
                  </>
                ) : (
                  <>
                    <Maximize2 size={13} /> Expand
                    <kbd className={cn(
                      "ml-1 flex items-center justify-center px-1 py-0.5 rounded font-sans text-[9px] leading-none border",
                      isDark ? "bg-surface-raised border-surfaceLight-border/20 text-surface-muted" : "bg-gray-100 border-gray-200 text-gray-500"
                    )}>
                      {shortcutText}
                    </kbd>
                  </>
                )}
              </button>
            )}
            <DiffSettings
              settings={diffSettings}
              onChange={setDiffSettings}
              isDark={isDark}
            />
            {isMaximized && (
              <button
                onClick={exitMaximize}
                title="Exit fullscreen (Esc)"
                className={cn(
                  'p-1.5 rounded-md transition-colors duration-150',
                  isDark
                    ? 'text-surface-muted hover:text-white hover:bg-white/5'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                )}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {commitInfo ? (
          <div className={cn(
            'flex-1 overflow-hidden',
            fileDisplayMode !== 'stacked' && cn('rounded-lg border', isDark ? 'bg-surface-raised border-surface-border' : 'bg-white border-surfaceLight-border')
          )}>
            <CommitDiffView
              files={commitFileDiffs}
              viewMode={viewMode}
              displayMode={fileDisplayMode}
              activeFileIndex={activeFileIndex}
              onFileSelect={i => updateActiveTab({ activeFileIndex: i })}
              showMinimap={diffSettings.showMinimap}
              isDark={isDark}
            />
          </div>
        ) : (
          <div
            className={cn(
              'flex flex-col flex-1 overflow-hidden rounded-lg border',
              isDark ? 'bg-surface-raised border-surface-border' : 'bg-white border-surfaceLight-border'
            )}
          >
            {viewMode === 'unified' ? (
              <UnifiedDiffViewer lines={lines} wrapLines={true} showMinimap={diffSettings.showMinimap} />
            ) : (
              <SideBySideDiffViewer
                leftLines={leftLines}
                rightLines={rightLines}
                wrapLines={true}
                showMinimap={diffSettings.showMinimap}
              />
            )}
          </div>
        )}
      </div>

      {/* Remotion Animation Modal */}
      {showAnimation && (
        <AnimationModal
          lines={lines}
          stats={stats}
          theme={theme}
          onClose={() => setShowAnimation(false)}
        />
      )}

      <Toaster toasts={toasts} onRemove={removeToast} isDark={isDark} />
    </div>
  )
}

function SplitMiniIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
      <rect x="0" y="0" width="5.5" height="13" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="7.5" y="0" width="5.5" height="13" rx="1.5" fill="currentColor" opacity="0.7" />
    </svg>
  )
}
