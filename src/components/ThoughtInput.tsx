'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppContext } from '@/context/AppContext'
import { getDraft, saveDraft, clearDraft } from '@/lib/storage'
import { generateId } from '@/lib/ids'
import VoiceButton from './VoiceButton'

const PLACEHOLDERS = [
  '写下此刻的想法…',
  '今天发生了什么？',
  '有什么困扰你？',
  '记录一个瞬间…',
  '说说你的感受…',
  '想对自己说什么？',
  '此刻你在想什么？',
]

export default function ThoughtInput() {
  const { dispatch } = useAppContext()
  const [value, setValue] = useState('')
  const [placeholder] = useState(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const draft = getDraft()
    if (draft) {
      setValue(draft)
      // Adjust height for restored draft
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
      }
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value
    setValue(newValue)
    saveDraft(newValue)

    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const trimmed = value.trim()
      if (!trimmed) return

      const thought = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        value: trimmed,
        readOnly: false,
      }

      dispatch({ type: 'ADD', thought })
      clearDraft()
      setValue('')

      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = 'auto'
      }
    }
  }

  return (
    <div>
      <textarea
        ref={textareaRef}
        className="thought-input"
        rows={1}
        style={{ height: 'auto' }}
        value={value}
        placeholder={placeholder}
        aria-label="写下你的想法"
        autoFocus
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <VoiceButton onResult={(text) => setValue((prev) => prev + text)} />
    </div>
  )
}
