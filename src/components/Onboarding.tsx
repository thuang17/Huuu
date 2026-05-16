'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { isOnboarded, setOnboarded } from '@/lib/storage'

interface ThoughtConfig {
  text: string
  pos: CSSProperties
  fontSize: string
  blur: number
  opacity: number
}

const THOUGHTS: ThoughtConfig[] = [
  { text: '今天的会议让我很疲惫', pos: { top: '10%',    left:  '8%'  }, fontSize: '1.05rem', blur: 18, opacity: 0.07 },
  { text: '想去看那部电影来着...', pos: { top:  '8%',   right: '9%'  }, fontSize: '0.9rem',  blur: 11, opacity: 0.11 },
  { text: '为什么总是这样',       pos: { top: '28%',    left:  '4%'  }, fontSize: '1.3rem',  blur: 24, opacity: 0.05 },
  { text: '记得给妈妈打电话',     pos: { top: '22%',    right: '6%'  }, fontSize: '0.85rem', blur:  7, opacity: 0.14 },
  { text: '最近心情不太好',       pos: { bottom: '18%', left:  '7%'  }, fontSize: '1rem',    blur: 21, opacity: 0.06 },
  { text: '好像明白了什么',       pos: { bottom: '14%', right: '8%'  }, fontSize: '1.1rem',  blur:  9, opacity: 0.12 },
  { text: '也许应该试试',         pos: { top: '60%',    right: '12%' }, fontSize: '0.95rem', blur: 14, opacity: 0.09 },
  { text: '忘记了',              pos: { top: '45%',    left:  '3%'  }, fontSize: '1.6rem',  blur: 30, opacity: 0.04 },
]

export default function Onboarding() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null)
  const [exiting, setExiting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const entered = useRef(false)

  useEffect(() => {
    // ?reset clears the onboarded flag (dev convenience)
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('reset')) {
      localStorage.removeItem('__HUUU_HAS_ONBOARDED__')
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (isOnboarded()) { setHasOnboarded(true); return }
    setHasOnboarded(false)
  }, [])

  useEffect(() => {
    if (hasOnboarded !== false) return

    function handleEnter() {
      if (entered.current) return
      entered.current = true
      setExiting(true)
      setTimeout(() => {
        setOnboarded()
        setHasOnboarded(true)
      }, 800)
    }

    document.addEventListener('click', handleEnter)
    document.addEventListener('keydown', handleEnter)
    return () => {
      document.removeEventListener('click', handleEnter)
      document.removeEventListener('keydown', handleEnter)
    }
  }, [hasOnboarded])

  // Mouse parallax — direct DOM mutation to avoid re-renders
  useEffect(() => {
    if (hasOnboarded !== false) return
    const container = containerRef.current
    if (!container) return

    function handleMouseMove(e: MouseEvent) {
      if (entered.current) return
      const dx = (e.clientX - window.innerWidth  / 2) / (window.innerWidth  / 2)
      const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)
      container.querySelectorAll<HTMLElement>('[data-ob-thought]').forEach((el, i) => {
        const depth = (i % 3 + 1) * 5
        const dir   = i % 2 === 0 ? 1 : -1
        el.style.transform = `translate(${dx * depth * dir}px, ${dy * depth * dir}px)`
      })
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [hasOnboarded])

  if (hasOnboarded === null || hasOnboarded === true) return null

  return (
    <div
      ref={containerRef}
      className="ob-overlay"
      style={{ opacity: exiting ? 0 : 1 }}
    >
      {THOUGHTS.map((t, i) => (
        <div
          key={t.text}
          data-ob-thought
          style={{ position: 'absolute', ...t.pos, fontSize: t.fontSize, pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
        >
          <motion.span
            className="ob-thought-text"
            initial={{ opacity: 0, filter: 'blur(40px)' }}
            animate={{ opacity: t.opacity, filter: `blur(${t.blur}px)` }}
            transition={{ duration: 1.8, delay: 0.1 + i * 0.12, ease: 'easeOut' }}
          >
            {t.text}
          </motion.span>
        </div>
      ))}

      <motion.span
        className="ob-center"
        initial={{ opacity: 0, filter: 'blur(30px)' }}
        animate={{ opacity: 0.88, filter: 'blur(0px)' }}
        transition={{ duration: 1.2, delay: 1.0, ease: 'easeOut' }}
      >
        Huuu
      </motion.span>
    </div>
  )
}
