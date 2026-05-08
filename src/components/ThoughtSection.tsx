'use client'

import { useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppContext } from '@/context/AppContext'
import ThoughtItem from './ThoughtItem'
import ThoughtInput from './ThoughtInput'
import type { Thought } from '@/lib/types'

interface ThoughtSectionProps {
  title: string
  thoughts: Thought[]
}

export default function ThoughtSection({ title, thoughts }: ThoughtSectionProps) {
  const { activeId, setActiveId } = useAppContext()
  const isToday = title === '今天'
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(thoughts.length)

  useEffect(() => {
    if (!isToday) return
    if (thoughts.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    prevLengthRef.current = thoughts.length
  }, [thoughts.length, isToday])

  return (
    <section className="thought-section" aria-label={title}>
      <h2>{title}</h2>
      {isToday && (
        <>
          <ThoughtInput />
          <hr className="thought-divider" />
        </>
      )}
      <AnimatePresence mode="popLayout">
        {thoughts.map(thought => (
          <ThoughtItem
            key={thought.id}
            thought={thought}
            isActive={activeId === thought.id}
            onActivate={() => setActiveId(thought.id)}
            onDeactivate={() => setActiveId(null)}
          />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </section>
  )
}
