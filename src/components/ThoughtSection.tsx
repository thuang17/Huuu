'use client'

import { AnimatePresence } from 'framer-motion'
import { useAppContext } from '@/context/AppContext'
import ThoughtItem from './ThoughtItem'
import type { Thought } from '@/lib/types'

interface ThoughtSectionProps {
  title: string
  thoughts: Thought[]
}

export default function ThoughtSection({ title, thoughts }: ThoughtSectionProps) {
  const { activeId, setActiveId } = useAppContext()

  return (
    <div className="thought-section">
      <h2>{title}</h2>
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
    </div>
  )
}
