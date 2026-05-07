'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { isOnboarded, setOnboarded } from '@/lib/storage'

const messages = [
  '欢迎来到 Huuu。',
  '这里是你的思维流。',
  '写下任何想法，按 Enter 发送。',
  '想法会在 5 分钟后自动淡出。',
  '开始写吧。',
]

export default function Onboarding() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null)
  const [visibleCount, setVisibleCount] = useState(0)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    if (isOnboarded()) {
      setHasOnboarded(true)
      return
    }
    setHasOnboarded(false)

    const timers: ReturnType<typeof setTimeout>[] = []
    messages.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), (i + 1) * 1200))
    })
    // Show button 2500ms after last message
    timers.push(setTimeout(() => setShowButton(true), messages.length * 1200 + 2500))
    return () => timers.forEach(clearTimeout)
  }, [])

  if (hasOnboarded === null || hasOnboarded === true) {
    return null
  }

  function handleStart() {
    setOnboarded()
    setHasOnboarded(true)
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-messages">
        {messages.map((msg, i) => (
          <motion.p
            key={i}
            className="onboarding-message"
            animate={{ opacity: i < visibleCount ? 1 : 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{ opacity: 0 }}
          >
            {msg}
          </motion.p>
        ))}
        <motion.button
          className="onboarding-btn"
          animate={{ opacity: showButton ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{ opacity: 0, pointerEvents: showButton ? 'auto' : 'none' }}
          onClick={handleStart}
        >
          开始使用
        </motion.button>
      </div>
    </div>
  )
}
