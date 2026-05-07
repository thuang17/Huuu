'use client'

import { createContext, useContext } from 'react'
import type { ThoughtsAction, Thought } from '@/lib/types'

interface AppContextValue {
  dispatch: React.Dispatch<ThoughtsAction>
  thoughts: Thought[]
  activeId: string | null
  setActiveId: (id: string | null) => void
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside HuuuApp')
  return ctx
}
