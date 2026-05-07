'use client'

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

  return (
    <section className="thought-section" aria-label={title}>
      <h2>{title}</h2>
      {title === '今天' && (
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
    </section>
  )
}
