'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '@/context/AppContext'
import { formatTimestamp } from '@/lib/dates'
import type { Thought } from '@/lib/types'

interface ThoughtItemProps {
  thought: Thought
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
}

type AgeState = 'fresh' | 'aging' | 'old' | 'retired'

const STAGE_FRESH_MS  =       30_000  // 30s
const STAGE_AGING_MS  =  2 * 60_000  // 2min
const STAGE_OLD_MS    =  4 * 60_000  // 4min
const RETIRE_DELAY_MS = STAGE_OLD_MS

function getAgeState(ageMs: number): AgeState {
  if (ageMs < STAGE_FRESH_MS) return 'fresh'
  if (ageMs < STAGE_AGING_MS) return 'aging'
  if (ageMs < STAGE_OLD_MS)   return 'old'
  return 'retired'
}

function getAgeStyle(state: AgeState): { filter: string; opacity: number } {
  switch (state) {
    case 'fresh':   return { filter: 'none',      opacity: 1.0  }
    case 'aging':   return { filter: 'blur(2px)', opacity: 0.65 }
    case 'old':     return { filter: 'blur(4px)', opacity: 0.4  }
    case 'retired': return { filter: 'blur(6px)', opacity: 0.2  }
  }
}

export default function ThoughtItem({ thought, isActive, onActivate, onDeactivate }: ThoughtItemProps) {
  const { dispatch } = useAppContext()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [renderTick, setRenderTick] = useState(0)

  const ageMs = Date.now() - new Date(thought.timestamp).getTime()
  const ageState = getAgeState(ageMs)
  const ageStyle = getAgeStyle(ageState)

  useEffect(() => {
    const msUntilRetire = RETIRE_DELAY_MS - (Date.now() - new Date(thought.timestamp).getTime())

    if (msUntilRetire <= 0) {
      dispatch({ type: 'RETIRE', id: thought.id })
      return
    }

    const timer = setTimeout(() => {
      dispatch({ type: 'RETIRE', id: thought.id })
    }, msUntilRetire)

    return () => clearTimeout(timer)
  }, [thought.id, thought.timestamp, dispatch])

  useEffect(() => {
    const ageMs = Date.now() - new Date(thought.timestamp).getTime()

    let msUntilNextBoundary: number | null = null

    if (ageMs < STAGE_FRESH_MS) {
      msUntilNextBoundary = STAGE_FRESH_MS - ageMs
    } else if (ageMs < STAGE_AGING_MS) {
      msUntilNextBoundary = STAGE_AGING_MS - ageMs
    } else if (ageMs < STAGE_OLD_MS) {
      msUntilNextBoundary = STAGE_OLD_MS - ageMs
    }

    if (msUntilNextBoundary === null) return

    const timer = setTimeout(() => {
      setRenderTick(t => t + 1)
    }, msUntilNextBoundary)

    return () => clearTimeout(timer)
  }, [thought.timestamp, renderTick])

  useEffect(() => {
    if (isActive && textareaRef.current) {
      const ta = textareaRef.current
      ta.style.height = 'auto'
      ta.style.height = ta.scrollHeight + 'px'
    }
  }, [isActive])

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

  // readOnly thoughts (retired) cannot be edited
  const editable = !thought.readOnly

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <div
        className={`thought-item${isActive ? ' thought-item--active' : ''}`}
        onClick={editable ? onActivate : undefined}
        style={{ cursor: editable && !isActive ? 'text' : 'default' }}
      >
        <span className="thought-timestamp">
          {formatTimestamp(thought.timestamp)}
        </span>
        {isActive && editable ? (
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
