import { useState, useEffect } from 'react'

export type Theme = 'dark' | 'dracula' | 'ocean' | 'light' | 'void'

const ALL_THEMES: Theme[] = ['dark', 'dracula', 'ocean', 'light', 'void']

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [selectedTheme, setSelected] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem('diff-theme')
    if (stored === 'system') return getSystemTheme()
    if (stored && ALL_THEMES.includes(stored as Theme)) return stored as Theme
    return getSystemTheme()
  })

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement
      root.classList.remove('dark', 'dracula', 'ocean', 'light', 'void')
      root.classList.add(selectedTheme)
      localStorage.setItem('diff-theme', selectedTheme)
    }

    applyTheme()
  }, [selectedTheme])

  const setTheme = (t: Theme) => setSelected(t)

  return { theme: selectedTheme, selectedTheme, setTheme, isDark: selectedTheme !== 'light' }
}
