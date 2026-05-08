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

type AgeState = 'fresh' | 'recent' | 'retiring' | 'retired'

const RETIRE_DELAY_MS = 5 * 60 * 1000
const RETIRE_ANIM_MS = 2000 // the "retiring" transition window

function getAgeState(ageMs: number): AgeState {
  const RETIRE_TRANSITION = RETIRE_DELAY_MS + RETIRE_ANIM_MS

  if (ageMs < 60_000) return 'fresh'
  if (ageMs < RETIRE_DELAY_MS) return 'recent'
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

    // Compute next boundary (ms until next state change)
    let msUntilNextBoundary: number | null = null

    if (ageMs < 60_000) {
      // fresh → recent at 60s
      msUntilNextBoundary = 60_000 - ageMs
    } else if (ageMs < RETIRE_DELAY_MS) {
      // recent → retiring at 5min
      msUntilNextBoundary = RETIRE_DELAY_MS - ageMs
    } else if (ageMs < RETIRE_DELAY_MS + RETIRE_ANIM_MS) {
      // retiring → retired at 5min+2s
      msUntilNextBoundary = RETIRE_DELAY_MS + RETIRE_ANIM_MS - ageMs
    }
    // already retired: no more boundaries

    if (msUntilNextBoundary === null) return

    const timer = setTimeout(() => {
      // Force re-render by updating a counter state
      setRenderTick(t => t + 1)
    }, msUntilNextBoundary)

    return () => clearTimeout(timer)
  }, [thought.timestamp, renderTick]) // re-schedule after each tick

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
