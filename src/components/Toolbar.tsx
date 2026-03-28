import { Copy, Check, RotateCcw, WrapText, AlignLeft, Play, Palette } from 'lucide-react'
import { cn } from '../lib/utils'
import { useState, useRef, useEffect } from 'react'
import { type Theme } from '../hooks/useTheme'

export type ViewMode = 'unified' | 'split'

interface ToolbarProps {
  theme: Theme
  onSetTheme: (t: Theme) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  ignoreWhitespace: boolean
  onIgnoreWhitespaceChange: (v: boolean) => void
  wrapLines: boolean
  onWrapLinesChange: (v: boolean) => void
  onReset: () => void
  getDiffText: () => string
  hasContent: boolean
  onAnimate?: () => void
}

export function Toolbar({
  theme,
  onSetTheme,
  viewMode,
  onViewModeChange,
  ignoreWhitespace,
  onIgnoreWhitespaceChange,
  wrapLines,
  onWrapLinesChange,
  onReset,
  getDiffText,
  hasContent,
  onAnimate,
}: ToolbarProps) {
  const isDark = theme !== 'light'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = getDiffText()
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header
      className={cn(
        'flex items-center justify-between px-5 py-3 border-b shrink-0 transition-colors',
        isDark ? 'border-surface-border bg-surface' : 'border-surfaceLight-border bg-white'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className={isDark ? 'text-white/80' : 'text-gray-800'}>
          <rect x="1" y="1" width="9" height="3" rx="1.5" fill="currentColor" opacity="0.9" />
          <rect x="1" y="6" width="6" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
          <rect x="1" y="11" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
          <rect x="12" y="1" width="9" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
          <rect x="12" y="6" width="9" height="3" rx="1.5" fill="currentColor" opacity="0.9" />
          <rect x="12" y="11" width="6" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
          <rect x="1" y="16" width="5" height="3" rx="1.5" className="text-green-400" fill="currentColor" />
          <rect x="12" y="16" width="9" height="3" rx="1.5" className="text-red-400" fill="currentColor" />
        </svg>
        <span className={cn('font-semibold text-sm tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
          DiffCheck
        </span>
      </div>

      {/* Center Controls */}
      <div className="flex items-center gap-1.5">
        {/* View Mode Toggle */}
        <div
          className={cn(
            'flex items-center rounded-lg p-0.5 gap-0.5',
            isDark ? 'bg-surface-border/50' : 'bg-gray-100'
          )}
        >
          <ToolbarButton
            id="view-unified"
            active={viewMode === 'unified'}
            onClick={() => onViewModeChange('unified')}
            theme={theme}
            title="Unified view"
          >
            <AlignLeft size={13} />
            <span className="text-xs hidden sm:inline">Unified</span>
          </ToolbarButton>
          <ToolbarButton
            id="view-split"
            active={viewMode === 'split'}
            onClick={() => onViewModeChange('split')}
            theme={theme}
            title="Split view"
          >
            <SplitIcon />
            <span className="text-xs hidden sm:inline">Split</span>
          </ToolbarButton>
        </div>

        <div className={cn('w-px h-5 mx-1', isDark ? 'bg-surface-border' : 'bg-gray-200')} />

        {/* Ignore Whitespace */}
        <ToggleChip
          id="toggle-whitespace"
          label="Ignore whitespace"
          active={ignoreWhitespace}
          onClick={() => onIgnoreWhitespaceChange(!ignoreWhitespace)}
          theme={theme}
        />

        {/* Wrap Lines */}
        <ToolbarIconButton
          id="toggle-wrap"
          onClick={() => onWrapLinesChange(!wrapLines)}
          title={wrapLines ? 'Disable line wrap' : 'Enable line wrap'}
          active={wrapLines}
          theme={theme}
        >
          <WrapText size={14} />
        </ToolbarIconButton>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5">
        {hasContent && onAnimate && (
          <button
            id="animate-btn"
            onClick={onAnimate}
            title="Animate diff"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150',
              isDark
                ? 'bg-white/8 text-white/80 hover:bg-white/14 hover:text-white border border-white/10'
                : 'bg-gray-900 text-white hover:bg-gray-700 border border-gray-800'
            )}
          >
            <Play size={11} className="fill-current" />
            <span>Animate</span>
          </button>
        )}
        {hasContent && onAnimate && <div className={cn('w-px h-5 mx-0.5', isDark ? 'bg-surface-border' : 'bg-gray-200')} />}
        {hasContent && (
          <>
            <ToolbarIconButton
              id="copy-diff"
              onClick={handleCopy}
              title="Copy diff"
              active={false}
              theme={theme}
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </ToolbarIconButton>
            <ToolbarIconButton
              id="reset-btn"
              onClick={onReset}
              title="Reset"
              active={false}
              theme={theme}
            >
              <RotateCcw size={14} />
            </ToolbarIconButton>
            <div className={cn('w-px h-5 mx-0.5', isDark ? 'bg-surface-border' : 'bg-gray-200')} />
          </>
        )}

        {/* Theme Picker */}
        <ThemePicker theme={theme} onSetTheme={onSetTheme} />
      </div>
    </header>
  )
}

function ToolbarButton({
  children,
  active,
  onClick,
  theme,
  title,
  id,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  theme: Theme
  title?: string
  id?: string
}) {
  const isDark = theme !== 'light'
  return (
    <button
      id={id}
      onClick={onClick}
      title={title}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
        active
          ? isDark
            ? 'bg-white/10 text-white'
            : 'bg-white text-gray-900 shadow-sm'
          : isDark
          ? 'text-surface-muted hover:text-white'
          : 'text-gray-500 hover:text-gray-900'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarIconButton({
  children,
  onClick,
  theme,
  title,
  active,
  id,
}: {
  children: React.ReactNode
  onClick: () => void
  theme: Theme
  title?: string
  active: boolean
  id?: string
}) {
  const isDark = theme !== 'light'
  return (
    <button
      id={id}
      onClick={onClick}
      title={title}
      className={cn(
        'p-2 rounded-md transition-colors duration-150',
        active
          ? isDark
            ? 'text-white bg-white/10'
            : 'text-gray-900 bg-gray-100'
          : isDark
          ? 'text-surface-muted hover:text-white hover:bg-white/5'
          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
      )}
    >
      {children}
    </button>
  )
}

function ToggleChip({
  label,
  active,
  onClick,
  theme,
  id,
}: {
  label: string
  active: boolean
  onClick: () => void
  theme: Theme
  id?: string
}) {
  const isDark = theme !== 'light'
  return (
    <button
      id={id}
      onClick={onClick}
      className={cn(
        'px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 hidden md:flex items-center gap-1',
        active
          ? isDark
            ? 'bg-white/10 text-white'
            : 'bg-gray-100 text-gray-900'
          : isDark
          ? 'text-surface-muted hover:text-white hover:bg-white/5'
          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full transition-colors',
          active ? (isDark ? 'bg-white' : 'bg-gray-700') : isDark ? 'bg-surface-muted' : 'bg-gray-300'
        )}
      />
      {label}
    </button>
  )
}

function SplitIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="0" y="0" width="5.5" height="13" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="7.5" y="0" width="5.5" height="13" rx="1.5" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

const THEMES: { id: Theme; label: string; swatch: string; desc: string }[] = [
  { id: 'dark',    label: 'Dark',    swatch: 'hsl(220 4% 14%)',  desc: 'Default dark' },
  { id: 'dracula', label: 'Dracula', swatch: 'hsl(265 89% 60%)', desc: 'Purple-tinted dark' },
  { id: 'ocean',   label: 'Ocean',   swatch: 'hsl(213 60% 40%)', desc: 'Deep blue dark' },
  { id: 'light',   label: 'Light',   swatch: 'hsl(0 0% 90%)',    desc: 'Light mode' },
  { id: 'skillz',  label: 'Skillz',  swatch: 'hsl(248 100% 71%)', desc: 'Electric dark' },
]

function ThemePicker({ theme, onSetTheme }: { theme: Theme; onSetTheme: (t: Theme) => void }) {
  const isDark = theme !== 'light'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = THEMES.find(t => t.id === theme)!

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Switch theme"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-150',
          open
            ? isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
            : isDark ? 'text-surface-muted hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
        )}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
          style={{ background: current.swatch }}
        />
        <Palette size={13} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1.5 w-44 rounded-xl border shadow-xl overflow-hidden z-50',
            isDark
              ? 'bg-surface-raised border-surface-border'
              : 'bg-white border-gray-200'
          )}
        >
          <div className={cn('px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest', isDark ? 'text-surface-muted' : 'text-gray-400')}>
            Theme
          </div>
          {THEMES.map(({ id, label, swatch, desc }) => {
            const active = theme === id
            return (
              <button
                key={id}
                onClick={() => { onSetTheme(id); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100',
                  active
                    ? isDark ? 'bg-white/8 text-white' : 'bg-gray-50 text-gray-900'
                    : isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 border border-white/15"
                  style={{ background: swatch }}
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-medium leading-none mb-0.5">{label}</span>
                  <span className={cn('block text-[10px] leading-none', isDark ? 'text-surface-muted' : 'text-gray-400')}>{desc}</span>
                </span>
                {active && (
                  <svg width="12" height="12" viewBox="0 0 12 12" className={isDark ? 'text-white/60' : 'text-gray-500'}>
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </button>
            )
          })}
          <div className={cn('h-2', isDark ? '' : '')} />
        </div>
      )}
    </div>
  )
}
