'use client'

import { useEffect, useRef, useState } from 'react'

interface VoiceButtonProps {
  onResult: (text: string) => void
}

type SpeechRecognitionCtor = new () => SpeechRecognition

const SpeechRecognitionAPI: SpeechRecognitionCtor | null =
  typeof window !== 'undefined'
    ? ((window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null) as SpeechRecognitionCtor | null)
    : null

export default function VoiceButton({ onResult }: VoiceButtonProps) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if (!SpeechRecognitionAPI) return
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      onResult(event.results[0][0].transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
  }, [onResult])

  if (!SpeechRecognitionAPI) return null

  const handleClick = () => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setListening(true)
      } catch {
        // mic permission denied or unavailable
        setListening(false)
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={listening ? '停止语音输入' : '开始语音输入'}
      className="voice-btn"
    >
      {listening ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="6" fill="#ef4444" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      )}
    </button>
  )
}
