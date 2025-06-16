'use client'

import { useState, useEffect, useRef } from 'react'

interface AudioRecorderProps {
  onTranscription: (text: string) => void
  isActive: boolean
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function AudioRecorder({ onTranscription, isActive }: AudioRecorderProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [language] = useState('it-IT')
  
  const recognitionRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const shouldRestartRef = useRef(false)

  // Inizializzazione
  useEffect(() => {
    console.log('AudioRecorder: Initializing speech recognition')
    const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    setIsSupported(supported)
  }, [])

  // Inizializza riconoscimento vocale
  const initSpeechRecognition = async () => {
    try {
      console.log('AudioRecorder: Requesting microphone access')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })
      
      streamRef.current = stream
      console.log('AudioRecorder: Microphone access granted')

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = language
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        console.log('AudioRecorder: Speech recognition started')
        setIsListening(true)
        setIsProcessing(false)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim()
        console.log('AudioRecorder: Transcript received:', transcript)
        
        if (transcript && transcript.length > 0) {
          setIsProcessing(true)
          console.log('AudioRecorder: Processing transcript...')
          
          // Invia subito la trascrizione
          onTranscription(transcript)
          setIsProcessing(false)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('AudioRecorder: Speech recognition error:', event.error)
        setIsProcessing(false)
        
        // Riavvia automaticamente per errori non critici
        if (shouldRestartRef.current && event.error !== 'not-allowed' && event.error !== 'aborted') {
          console.log('AudioRecorder: Attempting to restart after error...')
          setTimeout(() => {
            if (recognitionRef.current && shouldRestartRef.current) {
              try {
                recognitionRef.current.start()
                console.log('AudioRecorder: Recognition restarted after error')
              } catch (e) {
                console.log('AudioRecorder: Could not restart recognition after error')
              }
            }
          }, 1500)
        }
      }

      recognition.onend = () => {
        console.log('AudioRecorder: Speech recognition ended, shouldRestart:', shouldRestartRef.current)
        setIsListening(false)
        
        // Riavvia automaticamente SOLO se shouldRestart è true
        if (shouldRestartRef.current) {
          console.log('AudioRecorder: Attempting automatic restart...')
          setTimeout(() => {
            if (recognitionRef.current && shouldRestartRef.current) {
              try {
                console.log('AudioRecorder: Restarting recognition...')
                recognitionRef.current.start()
                console.log('AudioRecorder: Recognition restarted automatically')
              } catch (e) {
                console.log('AudioRecorder: Failed to restart recognition:', e)
                setIsListening(false)
              }
            }
          }, 1000)
        }
      }

      recognitionRef.current = recognition
      return true

    } catch (error) {
      console.error('AudioRecorder: Initialization failed:', error)
      setIsProcessing(false)
      return false
    }
  }

  // Avvia ascolto
  const startListening = async () => {
    console.log('AudioRecorder: Starting listening...')
    shouldRestartRef.current = true
    
    if (!recognitionRef.current) {
      const success = await initSpeechRecognition()
      if (!success) return
    }

    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('AudioRecorder: Failed to start recognition:', error)
      setIsProcessing(false)
    }
  }

  // Ferma ascolto
  const stopListening = () => {
    console.log('AudioRecorder: Stopping listening...')
    shouldRestartRef.current = false
    
    setIsListening(false)
    setIsProcessing(false)
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.log('AudioRecorder: Error stopping recognition:', error)
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Auto-start/stop quando cambia isActive
  useEffect(() => {
    console.log('AudioRecorder: isActive changed to:', isActive)
    
    if (isActive && !isListening) {
      // Avvia automaticamente quando diventa attivo
      console.log('AudioRecorder: Auto-starting listening...')
      setTimeout(() => startListening(), 100)
    } else if (!isActive) {
      // Ferma quando non più attivo
      console.log('AudioRecorder: Stopping due to isActive=false')
      stopListening()
    }
  }, [isActive])

  if (!isSupported) {
    return (
      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-700">❌ Riconoscimento vocale non supportato</p>
        <p className="text-sm text-red-600 mt-1">Usa Chrome, Edge o Safari</p>
      </div>
    )
  }

  return null // AudioRecorder ora è completamente controllato dal parent
}