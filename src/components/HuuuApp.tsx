'use client'

import { useState, useMemo, useEffect } from 'react'
import { AppContext } from '@/context/AppContext'
import { useThoughts } from '@/hooks/useThoughts'
import Header from './Header'
import ThoughtSection from './ThoughtSection'
import Onboarding from './Onboarding'
import Omnibar from './Omnibar'

export default function HuuuApp() {
  const { thoughts, sections, dispatch } = useThoughts()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFocusMode, setFocusMode] = useState(false)

  const contextValue = useMemo(
    () => ({ dispatch, thoughts, activeId, setActiveId, isSearchOpen, setIsSearchOpen, isFocusMode, setFocusMode }),
    [thoughts, activeId, isSearchOpen, isFocusMode]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setIsSearchOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setIsSearchOpen])

  return (
    <AppContext.Provider value={contextValue}>
      <div className="huuu-app">
        <Header />
        <main className="thought-stream">
          <div className="thought-list">
            {sections.map(([title, thoughts]) => (
              <ThoughtSection key={title} title={title} thoughts={thoughts} />
            ))}
          </div>
        </main>
        <Onboarding />
        <Omnibar />
      </div>
    </AppContext.Provider>
  )
}
