'use client'

import { useState, useMemo } from 'react'
import { AppContext } from '@/context/AppContext'
import { useThoughts } from '@/hooks/useThoughts'
import Header from './Header'
import ThoughtSection from './ThoughtSection'
import ThoughtInput from './ThoughtInput'
import Onboarding from './Onboarding'

export default function HuuuApp() {
  const { thoughts, sections, dispatch } = useThoughts()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const contextValue = useMemo(
    () => ({ dispatch, thoughts, activeId, setActiveId, isSearchOpen, setIsSearchOpen }),
    [thoughts, activeId, isSearchOpen]
  )

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
          <div className="input-area">
            <ThoughtInput />
          </div>
        </main>
        <Onboarding />
      </div>
    </AppContext.Provider>
  )
}
