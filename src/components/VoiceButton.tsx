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
    >
      {listening ? '🔴' : '🎤'}
    </button>
  )
}
