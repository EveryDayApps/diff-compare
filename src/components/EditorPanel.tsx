import { useCallback, useRef, useState } from 'react'
import { Upload, X, Copy, Check, ShieldX } from 'lucide-react'
import { cn } from '../lib/utils'
import { type Theme } from '../hooks/useTheme'

/** MIME type prefixes that indicate non-text binary files */
const BLOCKED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'application/zip', 'application/x-rar', 'application/x-7z', 'application/gzip', 'application/octet-stream', 'application/pdf', 'application/x-executable', 'application/vnd.ms-', 'application/vnd.openxmlformats', 'font/']

/** File extensions that should never be accepted */
const BLOCKED_EXTENSIONS = new Set([
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif', 'avif', 'heic', 'heif',
  // Video
  'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp',
  // Audio
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus',
  // Archives
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'zst', 'lz', 'tgz',
  // Executables / binaries
  'exe', 'dll', 'so', 'dylib', 'bin', 'dmg', 'iso', 'msi', 'apk', 'deb', 'rpm',
  // Documents (binary)
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
  // Fonts
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  // Database / misc binary
  'db', 'sqlite', 'sqlite3', 'class', 'pyc', 'o', 'obj', 'wasm',
])

/** Returns an error message if the file is invalid, or null if OK. */
function validateFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return `Cannot open .${ext} files — only text files are supported`
  }
  const mime = file.type || ''
  if (BLOCKED_MIME_PREFIXES.some(prefix => mime.startsWith(prefix))) {
    return `Unsupported file type (${mime.split('/')[1] || mime})`
  }
  return null
}

interface EditorPanelProps {
  label: string
  value: string
  onChange: (val: string) => void
  fileName?: string
  onFileLoad?: (name: string, content: string) => void
  onFileError?: (msg: string) => void
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
  onFileError,
  onClear,
  side,
  theme,
}: EditorPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragInvalid, setIsDragInvalid] = useState(false)
  const isDark = theme !== 'light'

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (dragCounter.current === 1) {
      setIsDragOver(true)
      // Check if the dragged file is invalid by inspecting dataTransfer items
      const items = e.dataTransfer.items
      if (items && items.length > 0) {
        const item = items[0]
        const type = item.type || ''
        const isInvalid = BLOCKED_MIME_PREFIXES.some(p => type.startsWith(p))
        setIsDragInvalid(isInvalid)
      }
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragOver(false)
      setIsDragInvalid(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    setIsDragInvalid(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const error = validateFile(file)
    if (error) {
      onFileError?.(error)
      return
    }
    readFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const error = validateFile(file)
    if (error) {
      onFileError?.(error)
      e.target.value = ''
      return
    }
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
        'flex flex-col h-full overflow-hidden rounded-lg border-2 transition-all duration-200 relative',
        isDragOver
          ? isDragInvalid
            ? isDark
              ? 'bg-surface-raised border-red-500/60 ring-2 ring-red-500/20'
              : 'bg-red-50/50 border-red-400 ring-2 ring-red-400/20'
            : isDark
              ? 'bg-surface-raised border-blue-500/60 ring-2 ring-blue-500/20'
              : 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-400/20'
          : cn(
              'border',
              isDark
                ? 'bg-surface-raised border-surface-border'
                : 'bg-white border-surfaceLight-border'
            ),
        side === 'left' ? 'mr-0' : 'ml-0'
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
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
            <CopyButton value={value} side={side} isDark={isDark} />
          )}
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
        {/* Drag-over overlay */}
        {isDragOver && (
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 pointer-events-none rounded-b-lg',
              isDragInvalid
                ? isDark
                  ? 'bg-red-500/10 border-2 border-dashed border-red-500/40'
                  : 'bg-red-100/50 border-2 border-dashed border-red-400/60'
                : isDark
                  ? 'bg-blue-500/10 border-2 border-dashed border-blue-500/40'
                  : 'bg-blue-100/50 border-2 border-dashed border-blue-400/60'
            )}
          >
            {isDragInvalid ? (
              <>
                <ShieldX
                  size={32}
                  strokeWidth={1.5}
                  className={cn(
                    isDark ? 'text-red-400' : 'text-red-500'
                  )}
                />
                <p className={cn(
                  'text-sm font-medium',
                  isDark ? 'text-red-300' : 'text-red-600'
                )}>
                  Unsupported file type
                </p>
              </>
            ) : (
              <>
                <Upload
                  size={32}
                  strokeWidth={1.5}
                  className={cn(
                    'animate-bounce',
                    isDark ? 'text-blue-400' : 'text-blue-500'
                  )}
                />
                <p className={cn(
                  'text-sm font-medium',
                  isDark ? 'text-blue-300' : 'text-blue-600'
                )}>
                  Drop file here
                </p>
              </>
            )}
          </div>
        )}
        {isEmpty && !isDragOver && (
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

function CopyButton({ value, side, isDark }: { value: string; side: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      id={`copy-btn-${side}`}
      onClick={handleCopy}
      className={cn(
        'p-1 rounded-md transition-colors',
        isDark
          ? 'text-surface-muted hover:text-white hover:bg-surface-border'
          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
      )}
      title="Copy to clipboard"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  )
}
