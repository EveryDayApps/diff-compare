import { Plus, Minus, Equal, GitCompare } from 'lucide-react'
import { cn } from '../lib/utils'
import { type DiffStats } from '../lib/diff-utils'
import { type Theme } from '../hooks/useTheme'

interface DiffStatsBarProps {
  stats: DiffStats | null
  theme: Theme
}

export function DiffStatsBar({ stats, theme }: DiffStatsBarProps) {
  const isDark = theme !== 'light'

  if (!stats) return null

  const isEmpty = stats.total === 0
  const percentAdded = stats.total > 0 ? (stats.added / stats.total) * 100 : 0
  const percentRemoved = stats.total > 0 ? (stats.removed / stats.total) * 100 : 0
  const percentEqual = stats.total > 0 ? (stats.equal / stats.total) * 100 : 0

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-2.5 border-b shrink-0 transition-all animate-slide-up',
        isDark ? 'border-surface-border bg-surface-raised' : 'border-surfaceLight-border bg-gray-50'
      )}
    >
      <div className="flex items-center gap-1.5">
        <GitCompare size={13} className={isDark ? 'text-surface-muted' : 'text-gray-400'} />
        <span className={cn('text-xs font-medium', isDark ? 'text-surface-muted' : 'text-gray-400')}>
          Diff
        </span>
      </div>

      <div className="flex items-center gap-4 flex-1">
        {isEmpty ? (
          <span className={cn('text-xs', isDark ? 'text-surface-muted' : 'text-gray-400')}>
            No differences found
          </span>
        ) : (
          <>
            <StatBadge
              icon={<Plus size={11} />}
              value={stats.added}
              label="added"
              colorClass={isDark ? 'text-green-400' : 'text-green-600'}
              theme={theme}
            />
            <StatBadge
              icon={<Minus size={11} />}
              value={stats.removed}
              label="removed"
              colorClass={isDark ? 'text-red-400' : 'text-red-500'}
              theme={theme}
            />
            <StatBadge
              icon={<Equal size={11} />}
              value={stats.equal}
              label="unchanged"
              colorClass={isDark ? 'text-surface-muted' : 'text-gray-400'}
              theme={theme}
            />

            {/* Visual bar */}
            <div className="flex-1 max-w-[180px] h-1.5 rounded-full overflow-hidden flex gap-px">
              {percentAdded > 0 && (
                <div
                  className="bg-green-500/70 rounded-l-full"
                  style={{ width: `${percentAdded}%` }}
                />
              )}
              {percentEqual > 0 && (
                <div
                  className={cn(isDark ? 'bg-white/10' : 'bg-gray-200')}
                  style={{ width: `${percentEqual}%` }}
                />
              )}
              {percentRemoved > 0 && (
                <div
                  className="bg-red-500/70 rounded-r-full"
                  style={{ width: `${percentRemoved}%` }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface StatBadgeProps {
  icon: React.ReactNode
  value: number
  label: string
  colorClass: string
  theme: Theme
}

function StatBadge({ icon, value, label, colorClass, theme }: StatBadgeProps) {
  const isDark = theme !== 'light'
  return (
    <div className={cn('flex items-center gap-1', colorClass)}>
      {icon}
      <span className="text-xs font-mono font-medium">{value}</span>
      <span className={cn('text-xs hidden sm:inline', isDark ? 'text-surface-muted' : 'text-gray-400')}>
        {label}
      </span>
    </div>
  )
}
