'use client'

import { useEffect, useRef, useState } from 'react'

interface VoiceButtonProps {
  onResult: (text: string) => void
}

export default function VoiceButton({ onResult }: VoiceButtonProps) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    setSupported(true)

    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      onResult(event.results[0][0].transcript)
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
  }, [onResult])

  if (!supported) return null

  function handleClick() {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (listening) {
      recognition.stop()
      setListening(false)
    } else {
      recognition.start()
      setListening(true)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={listening ? '停止语音输入' : '开始语音输入'}
    >
      {listening ? '🔴' : '🎤'}
    </button>
  )
}
