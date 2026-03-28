import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Play, Pause, RotateCcw } from 'lucide-react'
import { type DiffLine, type DiffStats } from '../lib/diff-utils'

// ─── Tunables ────────────────────────────────────────────────────────────────
const LINE_DELAY_MS = 80   // ms between each line appearing
const STATS_DELAY_MS = 200 // ms before stats start counting

import { type Theme } from '../hooks/useTheme'

interface AnimationModalProps {
  lines: DiffLine[]
  stats: DiffStats
  theme: Theme
  onClose: () => void
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-0.5 w-full bg-white/5 overflow-hidden">
      <div
        className="h-full bg-white/20 transition-none"
        style={{ width: `${progress * 100}%`, transition: 'width 50ms linear' }}
      />
    </div>
  )
}

// ─── Animated Stats ───────────────────────────────────────────────────────────
function AnimatedStats({ stats, progress }: { stats: DiffStats; progress: number }) {
  const added = Math.round(stats.added * Math.min(1, progress * 2))
  const removed = Math.round(stats.removed * Math.min(1, progress * 2))
  const equal = Math.round(stats.equal * Math.min(1, progress * 2))
  const total = stats.total || 1
  const barProgress = Math.min(1, progress * 1.5)

  return (
    <div className="flex flex-col gap-2" style={{ opacity: Math.min(1, progress * 4) }}>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-base font-semibold text-green-400">+{added}</span>
          <span className="text-xs text-white/40">added</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-base font-semibold text-red-400">−{removed}</span>
          <span className="text-xs text-white/40">removed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-base font-semibold text-white/40">={equal}</span>
          <span className="text-xs text-white/35">unchanged</span>
        </div>
      </div>
      {/* Color bar */}
      <div className="h-1 rounded-full overflow-hidden flex bg-white/5" style={{ width: 200 }}>
        <div
          className="bg-green-500/70 rounded-l-full transition-none"
          style={{ width: `${(stats.added / total) * 100 * barProgress}%` }}
        />
        <div
          className="bg-white/10"
          style={{ width: `${(stats.equal / total) * 100 * barProgress}%` }}
        />
        <div
          className="bg-red-500/70 rounded-r-full"
          style={{ width: `${(stats.removed / total) * 100 * barProgress}%` }}
        />
      </div>
    </div>
  )
}

// ─── Single Animated Line ─────────────────────────────────────────────────────
function AnimatedLine({
  line,
  visible,
  index,
}: {
  line: DiffLine
  visible: boolean
  index: number
}) {
  let bg = 'transparent'
  let textColor = 'rgba(255,255,255,0.7)'
  let borderColor = 'transparent'
  let prefix = '  '
  let translateX = '0px'

  if (line.type === 'added') {
    bg = 'hsla(142,60%,10%,1)'
    textColor = 'hsl(142,65%,62%)'
    borderColor = 'hsl(142,55%,28%)'
    prefix = '+ '
    translateX = '-16px'
  } else if (line.type === 'removed') {
    bg = 'hsla(0,60%,10%,1)'
    textColor = 'hsl(0,65%,62%)'
    borderColor = 'hsl(0,55%,28%)'
    prefix = '− '
    translateX = '16px'
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        minHeight: 28,
        background: visible ? bg : 'transparent',
        borderLeft: `2px solid ${visible ? borderColor : 'transparent'}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) translateY(0)' : `translateX(${translateX}) translateY(6px)`,
        transition: visible
          ? `opacity 220ms ease, transform 260ms cubic-bezier(0.34,1.56,0.64,1), background 180ms ease, border-color 180ms ease`
          : 'none',
      }}
    >
      {/* Line number */}
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          color: 'rgba(255,255,255,0.2)',
          minWidth: 44,
          paddingRight: 12,
          paddingLeft: 8,
          textAlign: 'right',
          lineHeight: '28px',
          userSelect: 'none',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}
      >
        {index + 1}
      </span>
      {/* Content */}
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          color: textColor,
          padding: '2px 16px',
          lineHeight: '24px',
          whiteSpace: 'pre',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {prefix}{line.content}
      </span>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function AnimationModal({ lines, stats, onClose }: AnimationModalProps) {
  const displayLines = lines.slice(0, 50)
  const totalDuration = STATS_DELAY_MS + displayLines.length * LINE_DELAY_MS + 600

  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(true)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number | null>(null)
  const pausedAtRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track which lines are visible
  const visibleCount = Math.max(0, Math.floor((elapsed - STATS_DELAY_MS) / LINE_DELAY_MS))
  const statsProgress = Math.min(1, Math.max(0, (elapsed - STATS_DELAY_MS * 0.3) / (totalDuration * 0.6)))
  const playProgress = elapsed / totalDuration

  const tick = useCallback((ts: number) => {
    if (startTimeRef.current === null) return
    const newElapsed = pausedAtRef.current + (ts - startTimeRef.current)
    setElapsed(Math.min(newElapsed, totalDuration))
    if (newElapsed < totalDuration) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      setPlaying(false)
    }
  }, [totalDuration])

  useEffect(() => {
    if (playing) {
      startTimeRef.current = performance.now()
      rafRef.current = requestAnimationFrame(tick)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      pausedAtRef.current = elapsed
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll the line list
  useEffect(() => {
    if (containerRef.current && visibleCount > 8) {
      const target = (visibleCount - 8) * 28
      containerRef.current.scrollTop = target
    }
  }, [visibleCount])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleReplay = () => {
    pausedAtRef.current = 0
    setElapsed(0)
    setPlaying(true)
  }

  const handlePlayPause = () => {
    if (!playing && elapsed >= totalDuration) {
      handleReplay()
    } else {
      if (!playing) {
        startTimeRef.current = performance.now()
        rafRef.current = requestAnimationFrame(tick)
      }
      setPlaying(p => !p)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-slide-up"
        style={{
          width: 820,
          maxWidth: '95vw',
          height: 520,
          maxHeight: '90vh',
          background: 'hsl(220,4%,6%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: playing ? 'hsl(142,70%,55%)' : 'hsl(45,85%,55%)',
                boxShadow: playing ? '0 0 6px hsl(142,70%,55%)' : '0 0 6px hsl(45,85%,55%)',
                transition: 'background 0.3s, box-shadow 0.3s',
              }}
            />
            <span className="font-semibold text-sm text-white/90">Diff Animation</span>
            <span className="text-xs text-white/35 font-mono">
              · {displayLines.length} lines
            </span>
          </div>
          <button
            id="close-animation-modal"
            onClick={onClose}
            className="p-1.5 rounded-md text-white/35 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Stats area */}
        <div className="px-5 py-3 border-b border-white/6 shrink-0">
          <AnimatedStats stats={stats} progress={statsProgress} />
        </div>

        {/* Diff lines */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden"
          style={{ overflowY: 'hidden' }}
        >
          {displayLines.map((line, i) => (
            <AnimatedLine
              key={i}
              line={line}
              visible={i < visibleCount}
              index={i}
            />
          ))}
        </div>

        {/* Bottom fade overlay */}
        <div
          className="absolute bottom-12 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, hsl(220,13%,9%))' }}
        />

        {/* Controls */}
        <div className="shrink-0 border-t border-white/8">
          <ProgressBar progress={playProgress} />
          <div className="flex items-center gap-3 px-5 py-2.5">
            <button
              id="play-pause-btn"
              onClick={handlePlayPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/8 hover:bg-white/14 text-white/80 hover:text-white transition-colors text-xs font-medium"
            >
              {playing ? <Pause size={12} /> : <Play size={12} className="fill-current" />}
              {playing ? 'Pause' : elapsed >= totalDuration ? 'Replay' : 'Play'}
            </button>
            <button
              id="replay-btn"
              onClick={handleReplay}
              className="p-1.5 rounded-md text-white/35 hover:text-white hover:bg-white/8 transition-colors"
              title="Replay from start"
            >
              <RotateCcw size={13} />
            </button>
            <div className="flex-1" />
            <span className="text-xs text-white/25 font-mono">
              {Math.round(elapsed / 1000 * 10) / 10}s / {Math.round(totalDuration / 100) / 10}s
            </span>
            <span className="text-xs text-white/20">·</span>
            <kbd className="px-1.5 py-0.5 rounded text-xs font-mono border border-white/10 text-white/30">
              Esc
            </kbd>
            <span className="text-xs text-white/20">to close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
