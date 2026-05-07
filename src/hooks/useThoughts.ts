'use client'

import { useReducer, useEffect, useMemo } from 'react'
import { getThoughts, saveThoughts } from '@/lib/storage'
import { groupThoughts } from '@/lib/dates'
import type { Thought, ThoughtsAction } from '@/lib/types'

export function thoughtsReducer(state: Thought[], action: ThoughtsAction): Thought[] {
  switch (action.type) {
    case 'LOAD':   return action.thoughts
    case 'ADD':    return [action.thought, ...state]
    case 'REMOVE': return state.filter(t => t.id !== action.id)
    case 'UPDATE': return state.map(t => t.id === action.id ? { ...t, value: action.value } : t)
    case 'RETIRE': return state.map(t => t.id === action.id ? { ...t, readOnly: true } : t)
    case 'CLEAR':  return []
    default:       return state
  }
}

export function useThoughts() {
  const [thoughts, dispatch] = useReducer(thoughtsReducer, [])

  // Load from localStorage on mount
  useEffect(() => {
    dispatch({ type: 'LOAD', thoughts: getThoughts() })
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    saveThoughts(thoughts)
  }, [thoughts])

  const sections = useMemo(() => groupThoughts(thoughts), [thoughts])

  return { thoughts, sections, dispatch }
}
