import { useState, useEffect } from 'react'
import { getTheme, saveTheme } from '@/lib/storage'
import type { Theme } from '@/lib/types'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    // Sync with stored preference
    setThemeState(getTheme())
  }, [])

  const setTheme = (newTheme: Theme) => {
    saveTheme(newTheme)
    setThemeState(newTheme)
    if (typeof window === 'undefined') return
    // Apply to DOM
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'
    } else {
      document.documentElement.dataset.theme = newTheme
    }
  }

  return { theme, setTheme }
}
