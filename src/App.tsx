import { useState, useMemo, useCallback, useEffect } from 'react'
import { Maximize2, Minimize2, Map } from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import { computeLineDiff, computeSideBySide } from './lib/diff-utils'
import { Toolbar, type ViewMode } from './components/Toolbar'
import { DiffStatsBar } from './components/DiffStats'
import { EditorPanel } from './components/EditorPanel'
import { UnifiedDiffViewer, SideBySideDiffViewer } from './components/DiffViewer'
import { AnimationModal } from './components/AnimationModal'
import { cn } from './lib/utils'

// @ts-ignore - Vite specific
const rawFiles = import.meta.glob('../dump/examples/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const file1 = rawFiles['../dump/examples/file1.txt'] || ''
const file2 = rawFiles['../dump/examples/file2.txt'] || ''

export default function App() {
  const { theme, setTheme } = useTheme()
  const isDark = theme !== 'light'

  const [original, setOriginal] = useState(file1)
  const [modified, setModified] = useState(file2)
  const [originalFileName, setOriginalFileName] = useState<string>()
  const [modifiedFileName, setModifiedFileName] = useState<string>()

  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const [wrapLines, setWrapLines] = useState(true)
  const [showAnimation, setShowAnimation] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMinimap, setShowMinimap] = useState(true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setIsExpanded((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const shortcutText = useMemo(() => {
    if (typeof navigator !== 'undefined') {
      return /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? '⌘E' : 'Ctrl+E'
    }
    return '⌘E'
  }, [])

  const { lines, stats } = useMemo(
    () => computeLineDiff(original, modified, ignoreWhitespace),
    [original, modified, ignoreWhitespace]
  )

  const { left: leftLines, right: rightLines } = useMemo(
    () => computeSideBySide(lines),
    [lines]
  )

  const hasContent = original.trim() !== '' || modified.trim() !== ''

  const handleReset = () => {
    setOriginal('')
    setModified('')
    setOriginalFileName(undefined)
    setModifiedFileName(undefined)
  }

  const getDiffText = useCallback(() => {
    return lines
      .map((l) => {
        if (l.type === 'added') return '+ ' + l.content
        if (l.type === 'removed') return '- ' + l.content
        return '  ' + l.content
      })
      .join('\n')
  }, [lines])

  return (
    <div
      className={cn(
        'flex flex-col h-screen overflow-hidden transition-colors duration-300',
        isDark ? 'bg-surface text-white' : 'bg-surfaceLight text-gray-900'
      )}
    >
      <Toolbar
        theme={theme}
        onSetTheme={setTheme}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        ignoreWhitespace={ignoreWhitespace}
        onIgnoreWhitespaceChange={setIgnoreWhitespace}
        wrapLines={wrapLines}
        onWrapLinesChange={setWrapLines}
        onReset={handleReset}
        getDiffText={getDiffText}
        hasContent={hasContent}
        onAnimate={() => setShowAnimation(true)}
      />

      {hasContent && <DiffStatsBar stats={stats} theme={theme} />}

      {/* Input Panels */}
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
          onChange={setOriginal}
          fileName={originalFileName}
          onFileLoad={(name, content) => {
            setOriginalFileName(name)
            setOriginal(content)
          }}
          onClear={() => {
            setOriginal('')
            setOriginalFileName(undefined)
          }}
          side="left"
          theme={theme}
        />
        <EditorPanel
          label="Modified"
          value={modified}
          onChange={setModified}
          fileName={modifiedFileName}
          onFileLoad={(name, content) => {
            setModifiedFileName(name)
            setModified(content)
          }}
          onClear={() => {
            setModified('')
            setModifiedFileName(undefined)
          }}
          side="right"
          theme={theme}
        />
      </div>

      {/* Divider */}
      <div
        className={cn(
          'mx-4 shrink-0 transition-all duration-500 ease-in-out',
          isExpanded ? 'border-b-0 opacity-0' : cn('border-b', isDark ? 'border-surface-border' : 'border-surfaceLight-border')
        )}
      />

      {/* Diff Output */}
      <div className={cn('flex-1 overflow-hidden px-4 py-3 flex flex-col gap-1')}>
        <div className="flex justify-between items-center mb-1.5 px-0.5">
          <div
            className={cn(
              'text-xs font-semibold uppercase tracking-widest',
              isDark ? 'text-surface-muted' : 'text-gray-400'
            )}
          >
            {viewMode === 'unified' ? 'Unified Diff' : 'Split Diff'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors border",
                isDark 
                  ? "text-surface-muted hover:text-white hover:bg-surface-raised border-transparent hover:border-surfaceLight-border/20 bg-surface" 
                  : "text-gray-500 hover:text-gray-900 border-transparent hover:bg-gray-50 bg-white"
              )}
              title={showMinimap ? "Hide Minimap" : "Show Minimap"}
            >
              <Map size={13} /> Minimap
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
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
          </div>
        </div>

        <div
          className={cn(
            'flex flex-col flex-1 overflow-hidden rounded-lg border',
            isDark ? 'bg-surface-raised border-surface-border' : 'bg-white border-surfaceLight-border'
          )}
        >
          {viewMode === 'unified' ? (
            <UnifiedDiffViewer lines={lines} wrapLines={wrapLines} showMinimap={showMinimap} />
          ) : (
            <SideBySideDiffViewer
              leftLines={leftLines}
              rightLines={rightLines}
              wrapLines={wrapLines}
              showMinimap={showMinimap}
            />
          )}
        </div>
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
    </div>
  )
}
