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
      timers.push(setTimeout(() => setVisibleCount(i + 1), (i + 1) * 800))
    })
    // Show button 2000ms after last message
    timers.push(setTimeout(() => setShowButton(true), messages.length * 800 + 2000))
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
        {messages.slice(0, visibleCount).map((msg, i) => (
          <motion.p
            key={i}
            className="onboarding-message"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {msg}
          </motion.p>
        ))}
        {showButton && (
          <motion.button
            className="onboarding-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            onClick={handleStart}
          >
            开始使用
          </motion.button>
        )}
      </div>
    </div>
  )
}
