import { useState, useCallback } from 'react'

// 定义SpeechRecognition接口
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceRecognitionReturn {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  error: string | null
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  const startListening = useCallback(() => {
    // 检查浏览器是否支持Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('您的浏览器不支持语音识别功能')
      return
    }

    try {
      // 创建语音识别实例
      const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) as new () => SpeechRecognition
      const newRecognition = new SpeechRecognition()
      
      newRecognition.continuous = false
      newRecognition.interimResults = false
      newRecognition.lang = 'zh-CN'
      newRecognition.maxAlternatives = 1

      newRecognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      newRecognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[0][0].transcript
        setTranscript(result)
      }

      newRecognition.onend = () => {
        setIsListening(false)
      }

      newRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false)
        setError(`语音识别错误: ${event.error}`)
      }

      newRecognition.start()
      setRecognition(newRecognition)
    } catch (err) {
      setError('初始化语音识别失败')
      console.error('语音识别错误:', err)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop()
      setIsListening(false)
    }
  }, [recognition])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error
  }
}