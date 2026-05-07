'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAppContext } from '@/context/AppContext'

export default function Omnibar() {
  const { thoughts, isSearchOpen, setIsSearchOpen } = useAppContext()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('')
    }
  }, [isSearchOpen])

  if (!isSearchOpen) return null

  const filteredThoughts = thoughts.filter(t =>
    t.value.toLowerCase().includes(query.toLowerCase())
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false)
      setQuery('')
    }
  }

  return createPortal(
    <div className="omnibar-overlay" onClick={() => setIsSearchOpen(false)}>
      <div className="omnibar-container" onClick={e => e.stopPropagation()}>
        <input
          className="omnibar-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索想法…"
          autoFocus
          aria-label="搜索"
          onKeyDown={handleKeyDown}
        />
        <div className="omnibar-results">
          {filteredThoughts.map(thought => (
            <div key={thought.id} className="omnibar-result-item">
              {thought.value}
            </div>
          ))}
          {filteredThoughts.length === 0 && query.length > 0 && (
            <p className="omnibar-empty">没有找到相关想法</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
