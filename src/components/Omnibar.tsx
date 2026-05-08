'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppContext } from '@/context/AppContext'

interface OmnibarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Omnibar({ isOpen, onClose }: OmnibarProps) {
  const { thoughts } = useAppContext()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const matchCount = query.trim()
    ? thoughts.filter(t =>
        t.value.toLowerCase().includes(query.toLowerCase())
      ).length
    : thoughts.length

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="omnibar"
      data-active={isOpen}
      role="search"
      aria-label="搜索想法"
    >
      <input
        ref={inputRef}
        className="omnibar-input"
        type="text"
        placeholder="搜索..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="搜索"
      />
      <span className="omnibar-count" aria-live="polite">
        {query.trim() ? `${matchCount} / ${thoughts.length}` : thoughts.length}
      </span>
    </div>
  )
}
