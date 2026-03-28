import { useRef, useState, useEffect } from 'react'
import { Settings2 } from 'lucide-react'
import { cn } from '../lib/utils'

export interface DiffSettingsState {
  ignoreWhitespace: boolean
  ignoreCase: boolean
  ignoreEmptyLines: boolean
  ignoreLineEndings: boolean
  showMinimap: boolean
}

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  isDark: boolean
}

function ToggleRow({ label, description, checked, onChange, isDark }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group',
        isDark
          ? 'hover:bg-white/5'
          : 'hover:bg-gray-50'
      )}
    >
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium', isDark ? 'text-white' : 'text-gray-800')}>{label}</p>
        <p className={cn('text-[11px] mt-0.5 leading-tight', isDark ? 'text-surface-muted' : 'text-gray-400')}>{description}</p>
      </div>
      {/* Toggle pill */}
      <div
        className={cn(
          'relative mt-0.5 shrink-0 h-4 w-7 rounded-full border transition-all duration-200',
          checked
            ? isDark
              ? 'bg-indigo-500 border-indigo-400'
              : 'bg-indigo-500 border-indigo-400'
            : isDark
              ? 'bg-surface-border border-surface-border'
              : 'bg-gray-200 border-gray-200'
        )}
      >
        <span
          className={cn(
            'absolute top-[1px] left-[1px] h-[10px] w-[10px] rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[12px]' : 'translate-x-0'
          )}
        />
      </div>
    </button>
  )
}

interface DiffSettingsProps {
  settings: DiffSettingsState
  onChange: (settings: DiffSettingsState) => void
  isDark: boolean
}

export function DiffSettings({ settings, onChange, isDark }: DiffSettingsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const set = (key: keyof DiffSettingsState) => (value: boolean) => {
    onChange({ ...settings, [key]: value })
  }

  const activeCount = Object.values(settings).filter(Boolean).length

  return (
    <div ref={ref} className="relative">
      <button
        id="diff-settings-btn"
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Diff settings"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors border',
          open
            ? isDark
              ? 'bg-white/10 text-white border-white/10'
              : 'bg-gray-100 text-gray-900 border-gray-200'
            : isDark
              ? 'text-surface-muted hover:text-white hover:bg-surface-raised border-transparent hover:border-surfaceLight-border/20 bg-surface'
              : 'text-gray-500 hover:text-gray-900 border-transparent hover:bg-gray-50 bg-white'
        )}
      >
        <Settings2 size={13} className={cn('transition-transform duration-300', open && 'rotate-45')} />
        <span>Settings</span>
        {activeCount > 0 && (
          <span
            className={cn(
              'flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold leading-none',
              isDark ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'
            )}
          >
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1.5 w-64 rounded-xl border shadow-xl z-50 overflow-hidden',
            'animate-settings-in',
            isDark
              ? 'bg-surface-raised border-surface-border shadow-black/40'
              : 'bg-white border-gray-200 shadow-gray-200/80'
          )}
          style={{ transformOrigin: 'top right' }}
        >
          <div className={cn('px-3 py-2 border-b', isDark ? 'border-surface-border' : 'border-gray-100')}>
            <p className={cn('text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-surface-muted' : 'text-gray-400')}>
              Diff Options
            </p>
          </div>
          <div className="p-1.5 flex flex-col gap-0.5">
            <div className={cn('px-3 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-surface-muted/70' : 'text-gray-300')}>
              View
            </div>
            <ToggleRow
              label="Minimap"
              description="Show a scrollable overview of changes"
              checked={settings.showMinimap}
              onChange={set('showMinimap')}
              isDark={isDark}
            />
            <div className={cn('mx-3 my-1 border-t', isDark ? 'border-surface-border' : 'border-gray-100')} />
            <div className={cn('px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-wider', isDark ? 'text-surface-muted/70' : 'text-gray-300')}>
              Comparison
            </div>
            <ToggleRow
              label="Ignore Whitespace"
              description="Trim leading and trailing spaces on each line"
              checked={settings.ignoreWhitespace}
              onChange={set('ignoreWhitespace')}
              isDark={isDark}
            />
            <ToggleRow
              label="Ignore Case"
              description="Case-insensitive comparison"
              checked={settings.ignoreCase}
              onChange={set('ignoreCase')}
              isDark={isDark}
            />
            <ToggleRow
              label="Ignore Empty Lines"
              description="Skip blank lines when comparing"
              checked={settings.ignoreEmptyLines}
              onChange={set('ignoreEmptyLines')}
              isDark={isDark}
            />
            <ToggleRow
              label="Ignore Line Endings"
              description="Treat CRLF and LF as equal"
              checked={settings.ignoreLineEndings}
              onChange={set('ignoreLineEndings')}
              isDark={isDark}
            />
          </div>
        </div>
      )}
    </div>
  )
}
