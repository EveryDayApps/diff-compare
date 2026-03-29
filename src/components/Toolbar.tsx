import { DiffStats } from '@/lib/diff-utils'
import { ArrowLeftRight, Link2, Maximize2, Palette, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { type ShareState } from '../hooks/usePeerShare'
import { type Theme } from '../hooks/useTheme'
import { cn } from '../lib/utils'
import { SharePanel } from './SharePanel'

export type ViewMode = 'unified' | 'split'

interface ToolbarProps {
  theme: Theme
  selectedTheme?: Theme
  onSetTheme: (t: Theme) => void
  onSwap: () => void
  onReset: () => void
  hasContent: boolean
  onAnimate?: () => void
  stats?: DiffStats | null
  onOpenImport: () => void
  isCommitActive: boolean
  shareState: ShareState
  shareUrl: string | null
  shareErrorMessage: string | null
  onShare: () => void
  onStopShare: () => void
  isMaximized?: boolean
  onToggleMaximize?: () => void
  onNewTab: () => void
}

export function Toolbar({
  theme,
  selectedTheme,
  onSetTheme,
  onSwap,
  onReset,
  hasContent,
  onOpenImport,
  isCommitActive,
  shareState,
  shareUrl,
  shareErrorMessage,
  onShare,
  onStopShare,
  isMaximized,
  onToggleMaximize,
  onNewTab,
}: ToolbarProps) {
  const isDark = theme !== 'light'

  return (
    <header
      className={cn(
        'flex items-center justify-between px-5 py-3 border-b shrink-0 transition-colors',
        isDark ? 'border-surface-border bg-surface' : 'border-surfaceLight-border bg-white'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 w-48 shrink-0">
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
          DiffCompare
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex justify-end items-center gap-2 w-48 shrink-0">
        {hasContent && (
          <>
            <ToolbarIconButton
              id="swap-btn"
              onClick={onSwap}
              title="Swap original and modified"
              active={false}
              theme={theme}
            >
              <ArrowLeftRight size={14} />
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
          </>
        )}
        {onToggleMaximize && (
          <ToolbarIconButton
            id="maximize-btn"
            onClick={onToggleMaximize}
            title={isMaximized ? 'Exit fullscreen (Esc)' : 'Maximize view'}
            active={!!isMaximized}
            theme={theme}
          >
            <Maximize2 size={14} />
          </ToolbarIconButton>
        )}
        <ToolbarIconButton
          id="new-tab-btn"
          onClick={onNewTab}
          title="New tab"
          active={false}
          theme={theme}
        >
          <Plus size={14} />
        </ToolbarIconButton>
        <SharePanel
          shareState={shareState}
          shareUrl={shareUrl}
          errorMessage={shareErrorMessage}
          onShare={onShare}
          onStop={onStopShare}
          theme={theme}
        />


        {/* Import button */}
        <div className="relative group flex items-center justify-center">
          <button
            id="import-commit-btn"
            onClick={onOpenImport}
            className={cn(
              'relative p-2 rounded-md transition-colors duration-150',
              isCommitActive
                ? isDark ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100'
                : isDark ? 'text-surface-muted hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            <Link2 size={14} />
            {isCommitActive && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-400" />
            )}
          </button>
          <div className={cn(
            "absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none z-50 px-2.5 py-1.5 text-xs font-medium rounded-md opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 whitespace-nowrap shadow-xl border",
            isDark
              ? "bg-surface-raised border-surface-border text-surface-muted group-hover:text-white"
              : "bg-white border-surfaceLight-border text-gray-500 group-hover:text-gray-900"
          )}>
            {isCommitActive ? 'Change commit' : 'Import commit'}
          </div>
        </div>


        {/* Theme Picker */}
        <ThemePicker theme={theme} selectedTheme={selectedTheme || theme} onSetTheme={onSetTheme} />

        {/* GitHub */}
        <div className="relative group flex items-center justify-center">
          <a
            href="https://github.com/EveryDayApps/diff-compare#readme"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'p-2 rounded-md transition-colors duration-150',
              isDark
                ? 'text-surface-muted hover:text-white hover:bg-white/5'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            <GitHubIcon size={14} />
          </a>
          <div
            className={cn(
              'absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none z-50 px-2.5 py-1.5 text-xs font-medium rounded-md opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 whitespace-nowrap shadow-xl border',
              isDark
                ? 'bg-surface-raised border-surface-border text-surface-muted group-hover:text-white'
                : 'bg-white border-surfaceLight-border text-gray-500 group-hover:text-gray-900'
            )}
          >
            GitHub
          </div>
        </div>
      </div>
    </header>
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
    <div className="relative group flex items-center justify-center">
      <button
        id={id}
        onClick={onClick}
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
      {title && (
        <div 
          className={cn(
            "absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none z-50 px-2.5 py-1.5 text-xs font-medium rounded-md opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 whitespace-nowrap shadow-xl border",
            isDark 
              ? "bg-surface-raised border-surface-border text-surface-muted group-hover:text-white" 
              : "bg-white border-surfaceLight-border text-gray-500 group-hover:text-gray-900"
          )}
        >
          {title}
        </div>
      )}
    </div>
  )
}

const THEMES: { id: Theme; label: string; swatch: string; desc: string; isSystem?: boolean }[] = [
  { id: 'dark',    label: 'Dark',    swatch: 'hsl(220 4% 14%)',  desc: 'Default dark' },
  { id: 'void',    label: 'Void',    swatch: '#0A0908',          desc: 'Near-black' },
  { id: 'dracula', label: 'Dracula', swatch: 'hsl(265 89% 50%)', desc: 'Purple-tinted dark' },
  { id: 'ocean',   label: 'Ocean',   swatch: 'hsl(213 60% 40%)', desc: 'Deep blue dark' },
  { id: 'light',   label: 'White',   swatch: 'hsl(0 0% 90%)',    desc: 'Light mode' },
]

function ThemePicker({ theme, selectedTheme, onSetTheme }: { theme: Theme; selectedTheme: Theme; onSetTheme: (t: Theme) => void }) {
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

  return (
    <div ref={ref} className="relative group flex items-center justify-center">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'p-2 rounded-md transition-colors duration-150',
          open
            ? isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
            : isDark ? 'text-surface-muted hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
        )}
      >
        <Palette size={14} />
      </button>

      <div 
        className={cn(
          "absolute top-full mt-2 right-0 pointer-events-none z-50 px-2.5 py-1.5 text-xs font-medium rounded-md opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 whitespace-nowrap shadow-xl border origin-top-right",
          isDark 
            ? "bg-surface-raised border-surface-border text-surface-muted group-hover:text-white" 
            : "bg-white border-surfaceLight-border text-gray-500 group-hover:text-gray-900",
          open && "hidden"
        )}
      >
        Theme
      </div>

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
            const active = selectedTheme === id
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

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  )
}
