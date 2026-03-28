import { useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { type Theme } from '../hooks/useTheme'

interface EditorPanelProps {
  label: string
  value: string
  onChange: (val: string) => void
  fileName?: string
  onFileLoad?: (name: string, content: string) => void
  onClear?: () => void
  side: 'left' | 'right'
  theme: Theme
}

export function EditorPanel({
  label,
  value,
  onChange,
  fileName,
  onFileLoad,
  onClear,
  side,
  theme,
}: EditorPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDark = theme !== 'light'

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    readFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    readFile(file)
    e.target.value = ''
  }

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      onFileLoad?.(file.name, content)
    }
    reader.readAsText(file)
  }

  const isEmpty = value.trim() === ''

  return (
    <div
      className={cn(
        'flex flex-col h-full overflow-hidden rounded-lg border transition-colors',
        isDark
          ? 'bg-surface-raised border-surface-border'
          : 'bg-white border-surfaceLight-border',
        side === 'left' ? 'mr-0' : 'ml-0'
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2.5 border-b shrink-0',
          isDark ? 'border-surface-border' : 'border-surfaceLight-border'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'text-xs font-semibold uppercase tracking-widest',
              isDark ? 'text-surface-muted' : 'text-gray-400'
            )}
          >
            {label}
          </span>
          {fileName && (
            <span
              className={cn(
                'text-xs font-mono truncate max-w-[180px]',
                isDark ? 'text-white/60' : 'text-gray-600'
              )}
              title={fileName}
            >
              · {fileName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            id={`upload-btn-${side}`}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors font-medium',
              isDark
                ? 'text-surface-muted hover:text-white hover:bg-surface-border'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            )}
            title="Upload file"
          >
            <Upload size={12} />
            <span>Upload</span>
          </button>
          {!isEmpty && (
            <button
              id={`clear-btn-${side}`}
              onClick={onClear}
              className={cn(
                'p-1 rounded-md transition-colors',
                isDark
                  ? 'text-surface-muted hover:text-white hover:bg-surface-border'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              )}
              title="Clear"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="text/*,.json,.md,.ts,.tsx,.js,.jsx,.css,.html,.xml,.yaml,.yml,.toml,.go,.py,.rs,.rb,.java,.cpp,.c,.h,.sh,.env"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Textarea */}
      <div className="relative flex-1 overflow-hidden">
        {isEmpty && (
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none z-10 transition-opacity',
              isDark ? 'text-surface-muted' : 'text-gray-300'
            )}
          >
            <Upload size={28} strokeWidth={1.2} />
            <p className="text-sm">Paste text or drop a file here</p>
          </div>
        )}
        <textarea
          id={`editor-${side}`}
          className={cn(
            'panel-textarea absolute inset-0 p-4',
            isDark
              ? 'text-white/85 caret-white/60'
              : 'text-gray-800 caret-gray-600 placeholder:text-gray-300'
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>
    </div>
  )
}
