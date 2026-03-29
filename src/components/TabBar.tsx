import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../lib/utils'

export interface TabItem {
  id: string
  label: string
  isActive: boolean
}

interface TabBarProps {
  tabs: TabItem[]
  onSelect: (id: string) => void
  onClose: (id: string) => void
  isDark: boolean
}

export function TabBar({ tabs, onSelect, onClose, isDark }: TabBarProps) {
  return (
    <div className={cn(
      'flex items-end overflow-x-auto shrink-0 px-2',
      isDark ? 'border-b border-surface-border bg-surface' : 'border-b border-surfaceLight-border bg-white'
    )}>
      {tabs.map(tab => (
        <Tab
          key={tab.id}
          tab={tab}
          isOnly={tabs.length === 1}
          onSelect={onSelect}
          onClose={onClose}
          isDark={isDark}
        />
      ))}
    </div>
  )
}

function Tab({
  tab,
  isOnly,
  onSelect,
  onClose,
  isDark,
}: {
  tab: TabItem
  isOnly: boolean
  onSelect: (id: string) => void
  onClose: (id: string) => void
  isDark: boolean
}) {
  const [animate, setAnimate] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setAnimate(false), 240)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      onClick={() => onSelect(tab.id)}
      className={cn(
        'group flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer select-none transition-all whitespace-nowrap border-b-2 -mb-px shrink-0',
        animate && 'animate-tab-in',
        tab.isActive
          ? isDark
            ? 'text-white border-white/50 bg-white/5'
            : 'text-gray-900 border-gray-700 bg-gray-50'
          : isDark
            ? 'text-white/45 border-transparent hover:text-white/80 hover:bg-white/[0.04]'
            : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50'
      )}
    >
      <span className="max-w-[140px] truncate">{tab.label}</span>
      {!isOnly && (
        <button
          onClick={e => { e.stopPropagation(); onClose(tab.id) }}
          className={cn(
            'ml-0.5 rounded p-0.5 transition-opacity',
            tab.isActive ? 'opacity-50 hover:opacity-100' : 'opacity-0 group-hover:opacity-50 hover:!opacity-100',
            isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-500'
          )}
        >
          <X size={10} />
        </button>
      )}
    </div>
  )
}
