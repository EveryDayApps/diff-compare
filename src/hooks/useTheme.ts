import { useState, useEffect } from 'react'

export type Theme = 'dark' | 'dracula' | 'ocean' | 'light' | 'skillz'

const ALL_THEMES: Theme[] = ['dark', 'dracula', 'ocean', 'light', 'skillz']

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('diff-theme') as Theme | null
    if (stored && ALL_THEMES.includes(stored)) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove(...ALL_THEMES)
    root.classList.add(theme)
    localStorage.setItem('diff-theme', theme)
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)

  return { theme, setTheme }
}
