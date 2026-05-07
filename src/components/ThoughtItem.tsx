'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '@/context/AppContext'
import type { Thought } from '@/lib/types'

interface ThoughtItemProps {
  thought: Thought
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
}

type AgeState = 'fresh' | 'recent' | 'retiring' | 'retired'

function getAgeState(ageMs: number): AgeState {
  const FIVE_MIN = 5 * 60 * 1000
  const RETIRE_TRANSITION = FIVE_MIN + 2000

  if (ageMs < 60_000) return 'fresh'
  if (ageMs < FIVE_MIN) return 'recent'
  if (ageMs < RETIRE_TRANSITION) return 'retiring'
  return 'retired'
}

function getAgeStyle(state: AgeState): { filter: string; opacity: number } {
  switch (state) {
    case 'fresh':
      return { filter: 'none', opacity: 1 }
    case 'recent':
      return { filter: 'blur(1px)', opacity: 0.85 }
    case 'retiring':
      return { filter: 'blur(3px)', opacity: 0.5 }
    case 'retired':
      return { filter: 'blur(6px)', opacity: 0.3 }
  }
}

export default function ThoughtItem({ thought, isActive, onActivate, onDeactivate }: ThoughtItemProps) {
  const { dispatch } = useAppContext()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const ageMs = Date.now() - new Date(thought.timestamp).getTime()
  const ageState = getAgeState(ageMs)
  const ageStyle = getAgeStyle(ageState)

  useEffect(() => {
    const FIVE_MIN = 5 * 60 * 1000
    const msUntilRetire = FIVE_MIN - (Date.now() - new Date(thought.timestamp).getTime())

    if (msUntilRetire <= 0) {
      dispatch({ type: 'RETIRE', id: thought.id })
      return
    }

    const timer = setTimeout(() => {
      dispatch({ type: 'RETIRE', id: thought.id })
    }, msUntilRetire)

    return () => clearTimeout(timer)
  }, [thought.id, thought.timestamp, dispatch])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    dispatch({ type: 'UPDATE', id: thought.id, value: e.target.value })
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Backspace' && thought.value === '') {
      dispatch({ type: 'REMOVE', id: thought.id })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="thought-item" onClick={onActivate}>
        {isActive ? (
          <textarea
            ref={textareaRef}
            value={thought.value}
            onChange={handleChange}
            onBlur={onDeactivate}
            onKeyDown={handleKeyDown}
            autoFocus
            className="thought-input"
            style={{ height: 'auto' }}
          />
        ) : (
          <p
            className="thought-text"
            style={{ filter: ageStyle.filter, opacity: ageStyle.opacity }}
          >
            {thought.value}
          </p>
        )}
      </div>
    </motion.div>
  )
}
