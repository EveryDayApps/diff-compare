import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'

function maskToken(token: string): string {
  if (token.length <= 4) return '••••'
  return '•'.repeat(Math.min(12, token.length - 4)) + token.slice(-4)
}

async function validateGitHubToken(token: string): Promise<void> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
  })
  if (!res.ok) throw new Error('Invalid token or insufficient permissions')
}

async function validateGitLabToken(baseUrl: string, token: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/v4/user`, {
    headers: { 'PRIVATE-TOKEN': token },
  })
  if (!res.ok) throw new Error('Invalid token or insufficient permissions')
}

function getStoredHosts(): string[] {
  try { return JSON.parse(localStorage.getItem('gl_hosts') || '[]') } catch { return [] }
}

function StatusBadge({ connected, isDark }: { connected: boolean; isDark: boolean }) {
  return connected ? (
    <span className="flex items-center gap-1 text-[10px] font-medium text-green-400">
      <CheckCircle2 size={10} /> Connected
    </span>
  ) : (
    <span className={cn('text-[10px] font-medium', isDark ? 'text-white/25' : 'text-gray-400')}>
      Public only
    </span>
  )
}

function TokenSection({
  title,
  icon,
  saved,
  input,
  editing,
  validating,
  error,
  isDark,
  onEdit,
  onCancel,
  onInputChange,
  onSave,
  onClear,
  helpText,
  helpLink,
  placeholder,
}: {
  title: string
  icon: React.ReactNode
  saved: string
  input: string
  editing: boolean
  validating: boolean
  error: string | null
  isDark: boolean
  onEdit: () => void
  onCancel: () => void
  onInputChange: (v: string) => void
  onSave: () => void
  onClear: () => void
  helpText: string
  helpLink?: { label: string; url: string }
  placeholder: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className={cn('text-xs font-medium', isDark ? 'text-white' : 'text-gray-900')}>{title}</span>
        </div>
        <StatusBadge connected={!!saved} isDark={isDark} />
      </div>

      {saved && !editing ? (
        <div className={cn('flex items-center justify-between px-3 py-2 rounded-lg', isDark ? 'bg-surface-raised' : 'bg-gray-50')}>
          <span className={cn('text-xs font-mono', isDark ? 'text-white/40' : 'text-gray-500')}>{maskToken(saved)}</span>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className={cn('text-xs transition-colors', isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-700')}>
              Change
            </button>
            <button onClick={onClear} className={cn('p-0.5 transition-colors', isDark ? 'text-white/25 hover:text-red-400' : 'text-gray-300 hover:text-red-500')}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ) : editing ? (
        <div>
          <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2', isDark ? 'bg-surface-raised border-surface-border' : 'bg-gray-50 border-gray-200')}>
            <input
              type="password"
              value={input}
              onChange={e => onInputChange(e.target.value)}
              placeholder={placeholder}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') onSave() }}
              className={cn('flex-1 bg-transparent text-xs outline-none', isDark ? 'text-white placeholder:text-white/25' : 'text-gray-900 placeholder:text-gray-400')}
            />
          </div>
          {error && (
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-red-400">
              <AlertCircle size={11} className="shrink-0" /> {error}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button onClick={onCancel} className={cn('text-xs px-2 py-1 rounded transition-colors', isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-700')}>
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={validating || !input.trim()}
              className={cn('flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-medium transition-all disabled:opacity-40', isDark ? 'bg-white text-gray-900 hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-700')}
            >
              {validating && <Loader2 size={10} className="animate-spin" />}
              Save & Verify
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onEdit}
          className={cn('flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors w-full', isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')}
        >
          <Plus size={12} /> Add token
        </button>
      )}
      <p className={cn('text-[11px] mt-1.5 ml-0.5', isDark ? 'text-white/20' : 'text-gray-400')}>{helpText}</p>
      {helpLink && (
        <a href={helpLink.url} target="_blank" rel="noopener noreferrer" className={cn('text-[11px] ml-0.5 transition-colors', isDark ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600')}>
          {helpLink.label}
        </a>
      )}
    </div>
  )
}

export function TokensContent({ isDark, authError }: { isDark: boolean; authError?: string }) {
  const [ghSaved, setGhSaved] = useState(() => localStorage.getItem('gh_token') || '')
  const [ghInput, setGhInput] = useState('')
  const [ghEditing, setGhEditing] = useState(false)
  const [ghValidating, setGhValidating] = useState(false)
  const [ghError, setGhError] = useState<string | null>(null)

  const [glSaved, setGlSaved] = useState(() => localStorage.getItem('gl_token_gitlab.com') || '')
  const [glInput, setGlInput] = useState('')
  const [glEditing, setGlEditing] = useState(false)
  const [glValidating, setGlValidating] = useState(false)
  const [glError, setGlError] = useState<string | null>(null)

  const [savedHosts, setSavedHosts] = useState<string[]>(getStoredHosts)
  const [showAddHost, setShowAddHost] = useState(false)
  const [newHostname, setNewHostname] = useState('')
  const [newHostToken, setNewHostToken] = useState('')
  const [hostValidating, setHostValidating] = useState(false)
  const [hostError, setHostError] = useState<string | null>(null)

  const handleSaveGh = async () => {
    const token = ghInput.trim()
    if (!token) return
    setGhValidating(true); setGhError(null)
    try {
      await validateGitHubToken(token)
      localStorage.setItem('gh_token', token)
      setGhSaved(token); setGhInput(''); setGhEditing(false)
    } catch (e) {
      setGhError(e instanceof Error ? e.message : 'Validation failed')
    } finally { setGhValidating(false) }
  }

  const handleSaveGl = async () => {
    const token = glInput.trim()
    if (!token) return
    setGlValidating(true); setGlError(null)
    try {
      await validateGitLabToken('https://gitlab.com', token)
      localStorage.setItem('gl_token_gitlab.com', token)
      setGlSaved(token); setGlInput(''); setGlEditing(false)
    } catch (e) {
      setGlError(e instanceof Error ? e.message : 'Validation failed')
    } finally { setGlValidating(false) }
  }

  const handleSaveHost = async () => {
    const hostname = newHostname.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    const token = newHostToken.trim()
    if (!hostname || !token) return
    setHostValidating(true); setHostError(null)
    try {
      await validateGitLabToken(`https://${hostname}`, token)
      localStorage.setItem(`gl_token_${hostname}`, token)
      const updated = Array.from(new Set([...savedHosts, hostname]))
      localStorage.setItem('gl_hosts', JSON.stringify(updated))
      setSavedHosts(updated); setNewHostname(''); setNewHostToken(''); setShowAddHost(false)
    } catch (e) {
      setHostError(e instanceof Error ? e.message : 'Validation failed')
    } finally { setHostValidating(false) }
  }

  const handleClearHost = (hostname: string) => {
    localStorage.removeItem(`gl_token_${hostname}`)
    const updated = savedHosts.filter(h => h !== hostname)
    localStorage.setItem('gl_hosts', JSON.stringify(updated))
    setSavedHosts(updated)
  }

  const handleClearAll = () => {
    localStorage.removeItem('gh_token')
    localStorage.removeItem('gl_token_gitlab.com')
    savedHosts.forEach(h => localStorage.removeItem(`gl_token_${h}`))
    localStorage.removeItem('gl_hosts')
    setGhSaved(''); setGlSaved(''); setSavedHosts([])
    setGhEditing(false); setGlEditing(false)
  }

  const hasAnyToken = !!(ghSaved || glSaved || savedHosts.length > 0)

  return (
    <>
      {authError && (
        <div className="flex items-center gap-2 mx-5 mt-4 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle size={13} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">{authError}</p>
        </div>
      )}
      {/* Scrollable body */}
      <div className="px-5 py-4 space-y-5 max-h-[55vh] overflow-y-auto">
        <TokenSection
          title="GitHub"
          icon={<GHIcon />}
          saved={ghSaved} input={ghInput} editing={ghEditing} validating={ghValidating} error={ghError}
          isDark={isDark}
          onEdit={() => { setGhEditing(true); setGhError(null) }}
          onCancel={() => { setGhEditing(false); setGhInput(''); setGhError(null) }}
          onInputChange={v => { setGhInput(v); setGhError(null) }}
          onSave={handleSaveGh}
          onClear={() => { localStorage.removeItem('gh_token'); setGhSaved(''); setGhInput(''); setGhEditing(false); setGhError(null) }}
          helpText="Requires repo scope (classic) or contents:read (fine-grained)"
          helpLink={{ label: 'Create token on GitHub →', url: 'https://github.com/settings/tokens/new' }}
          placeholder="ghp_xxxxxxxxxxxx"
        />

        <div className={cn('border-t', isDark ? 'border-surface-border' : 'border-gray-100')} />

        <TokenSection
          title="GitLab.com"
          icon={<GLIcon />}
          saved={glSaved} input={glInput} editing={glEditing} validating={glValidating} error={glError}
          isDark={isDark}
          onEdit={() => { setGlEditing(true); setGlError(null) }}
          onCancel={() => { setGlEditing(false); setGlInput(''); setGlError(null) }}
          onInputChange={v => { setGlInput(v); setGlError(null) }}
          onSave={handleSaveGl}
          onClear={() => { localStorage.removeItem('gl_token_gitlab.com'); setGlSaved(''); setGlInput(''); setGlEditing(false); setGlError(null) }}
          helpText="Requires read_repository scope"
          helpLink={{ label: 'Create token on GitLab →', url: 'https://gitlab.com/-/user_settings/personal_access_tokens' }}
          placeholder="glpat-xxxxxxxxxxxx"
        />

        <div className={cn('border-t', isDark ? 'border-surface-border' : 'border-gray-100')} />

        {/* Self-hosted GitLab */}
        <div>
          <div className={cn('text-xs font-medium mb-2.5', isDark ? 'text-white' : 'text-gray-900')}>
            Self-hosted GitLab
          </div>
          {savedHosts.map(hostname => {
            const token = localStorage.getItem(`gl_token_${hostname}`) || ''
            return (
              <div key={hostname} className={cn('flex items-center justify-between px-3 py-2 rounded-lg mb-1.5', isDark ? 'bg-surface-raised' : 'bg-gray-50')}>
                <div className="min-w-0 flex-1">
                  <div className={cn('text-xs font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{hostname}</div>
                  <div className={cn('text-[11px] font-mono', isDark ? 'text-white/30' : 'text-gray-400')}>{maskToken(token)}</div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <StatusBadge connected isDark={isDark} />
                  <button onClick={() => handleClearHost(hostname)} className={cn('p-1 rounded transition-colors', isDark ? 'text-white/30 hover:text-red-400' : 'text-gray-400 hover:text-red-500')}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
          {showAddHost ? (
            <div className={cn('rounded-lg border p-3 mt-1', isDark ? 'border-surface-border bg-surface-raised' : 'border-gray-200 bg-gray-50')}>
              <input
                type="text"
                value={newHostname}
                onChange={e => { setNewHostname(e.target.value); setHostError(null) }}
                placeholder="git.company.com"
                className={cn('w-full bg-transparent text-xs outline-none mb-2 pb-2 border-b', isDark ? 'text-white placeholder:text-white/25 border-surface-border' : 'text-gray-900 placeholder:text-gray-400 border-gray-200')}
              />
              <input
                type="password"
                value={newHostToken}
                onChange={e => { setNewHostToken(e.target.value); setHostError(null) }}
                placeholder="Personal access token"
                onKeyDown={e => { if (e.key === 'Enter') handleSaveHost() }}
                className={cn('w-full bg-transparent text-xs outline-none', isDark ? 'text-white placeholder:text-white/25' : 'text-gray-900 placeholder:text-gray-400')}
              />
              {hostError && (
                <div className="flex items-center gap-1 mt-2 text-[11px] text-red-400">
                  <AlertCircle size={11} className="shrink-0" /> {hostError}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => { setShowAddHost(false); setHostError(null); setNewHostname(''); setNewHostToken('') }} className={cn('text-xs px-2 py-1 rounded transition-colors', isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-700')}>
                  Cancel
                </button>
                <button
                  onClick={handleSaveHost}
                  disabled={hostValidating || !newHostname.trim() || !newHostToken.trim()}
                  className={cn('flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-medium transition-all disabled:opacity-40', isDark ? 'bg-white text-gray-900 hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-700')}
                >
                  {hostValidating && <Loader2 size={10} className="animate-spin" />}
                  Save & Verify
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddHost(true)} className={cn('flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors w-full', isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')}>
              <Plus size={12} /> Add self-hosted instance
            </button>
          )}
        </div>
      </div>

      {/* Footer row */}
      <div className={cn('flex items-center justify-between px-5 py-3 border-t', isDark ? 'border-surface-border' : 'border-gray-100')}>
        <p className={cn('text-[11px]', isDark ? 'text-white/20' : 'text-gray-400')}>
          Stored in localStorage — never shared
        </p>
        {hasAnyToken && (
          <button onClick={handleClearAll} className={cn('text-[11px] transition-colors', isDark ? 'text-white/30 hover:text-red-400' : 'text-gray-400 hover:text-red-500')}>
            Clear all tokens
          </button>
        )}
      </div>
    </>
  )
}

function GHIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-white/60 shrink-0">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

function GLIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 25 24" fill="currentColor" className="text-orange-400 shrink-0">
      <path d="M24.507 9.5l-.034-.09L21.082.506a.748.748 0 00-1.395.323l-2.096 6.452H7.41L5.314.83a.748.748 0 00-1.395-.323L.582 9.406l-.028.09A5.318 5.318 0 002.17 15.6l.01.007.03.022 4.256 3.188 2.107 1.594 1.28.967a.872.872 0 001.054 0l1.28-.967 2.107-1.594 4.286-3.213.012-.009a5.318 5.318 0 001.6-6.105z" />
    </svg>
  )
}
