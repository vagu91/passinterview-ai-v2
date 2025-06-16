'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mic, MicOff, MessageSquare, Coins, Loader2, Brain, CheckCircle, Expand, Languages, Maximize2, Minimize2, X } from 'lucide-react'
import Header from '@/components/header'
import AudioRecorder from '@/components/audio-recorder'

interface Message {
  id: string
  type: 'question' | 'response' | 'status'
  content: string
  timestamp: Date
  statusType?: 'processing' | 'generating'
}

export default function InterviewPage() {
  const router = useRouter()
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isActivatingLive, setIsActivatingLive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [userPoints, setUserPoints] = useState<number>(30)
  const [language, setLanguage] = useState('it')
  const [jobData, setJobData] = useState<any>(null)
  const [isContextExpanded, setIsContextExpanded] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'listening' | 'processing' | 'generating'>('idle')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Load user points and job data on mount
  useEffect(() => {
    const savedPoints = localStorage.getItem("userPoints")
    if (savedPoints) {
      setUserPoints(parseInt(savedPoints))
    }

    const savedJobData = localStorage.getItem("jobData")
    if (savedJobData) {
      try {
        setJobData(JSON.parse(savedJobData))
      } catch (error) {
        console.error("Error parsing job data:", error)
      }
    }

    // Fetch IP-based points
    fetch('/api/ip-points', {
      method: 'GET'
    })
      .then(response => response.json())
      .then(data => {
        console.log("IP points data:", JSON.stringify(data))
        if (data.points !== undefined) {
          setUserPoints(data.points)
          localStorage.setItem("userPoints", data.points.toString())
        }
      })
      .catch(error => {
        console.error("Error fetching IP points:", error)
      })
  }, [])

  // Set up global functions for AudioRecorder callback
  useEffect(() => {
    ; (window as any).addQuestionToChat = (question: string) => {
      console.log("Adding question to chat:", question)
      const questionMessage: Message = {
        id: Date.now().toString(),
        type: 'question',
        content: question,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, questionMessage])
    }

      ; (window as any).addResponseToChat = (response: string) => {
        console.log("Adding response to chat:", response)
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'response',
          content: response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, responseMessage])
      }

    // Cleanup
    return () => {
      delete (window as any).addQuestionToChat
      delete (window as any).addResponseToChat
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive (sticky behavior)
  useEffect(() => {
    if (!isUserScrolling && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isUserScrolling])

  // Detect user manual scrolling
  const handleScroll = (event: any) => {
    const scrollArea = event.target
    const isAtBottom = scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 50

    setIsUserScrolling(!isAtBottom)
  }

  const toggleLiveMode = async () => {
    console.log("Toggling live mode, current state:", isLiveMode, "-> will become:", !isLiveMode)

    if (!isLiveMode) {
      // Start live mode with loading
      setIsActivatingLive(true)
      console.log("Starting live interview mode...")

      try {
        // Reduced initialization delay for faster response
        await new Promise(resolve => setTimeout(resolve, 800))

        setIsLiveMode(true)
        setIsListening(true)
        setCurrentStatus('listening')
        console.log("Live mode ACTIVATED - isLiveMode set to TRUE")

        // Add welcome message only if no messages exist
        if (messages.length === 0) {
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            type: 'response',
            content: "🎤 Modalità Live attivata! Sono pronto ad ascoltare le domande dell'intervistatore e fornire risposte basate sul tuo profilo.",
            timestamp: new Date()
          }

          setMessages([welcomeMessage])
        }
      } catch (error) {
        console.error("Error activating live mode:", error)
      } finally {
        setIsActivatingLive(false)
      }
    } else {
      // Stop live mode IMMEDIATELY
      console.log("FORCE STOPPING live interview mode")
      setIsLiveMode(false)
      setIsListening(false)
      setCurrentStatus('idle')
      console.log("Live mode DEACTIVATED - isLiveMode set to FALSE")
    }
  }

  const toggleListening = () => {
    if (!isLiveMode) return

    console.log("Toggling listening, current state:", isListening)
    const newListeningState = !isListening
    setIsListening(newListeningState)

    if (newListeningState) {
      setCurrentStatus('listening')
      console.log("Microphone STARTED - isListening set to TRUE")
    } else {
      setCurrentStatus('idle')
      console.log("Microphone STOPPED - isListening set to FALSE")
    }
  }

  // Handle transcription from AudioRecorder - VELOCITÀ MASSIMA  
  const handleTranscription = async (text: string) => {
    console.log("🚀 DOMANDA CAPTATA ISTANTANEAMENTE:", text)

    if (!isLiveMode || userPoints < 1) {
      console.log("Not processing - live mode inactive or insufficient points")
      return
    }

    // Set status to processing
    setCurrentStatus('processing')

    // Crea messaggio domanda immediatamente
    const questionMessage: Message = {
      id: Date.now().toString(),
      type: 'question',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, questionMessage])

    // Add processing status message
    const processingMessage: Message = {
      id: (Date.now() + 0.1).toString(),
      type: 'status',
      content: "🔄 Elaborando la domanda...",
      timestamp: new Date(),
      statusType: 'processing'
    }

    setMessages(prev => [...prev, processingMessage])

    // Processa AI in parallelo (non bloccare UI)
    generateAIResponse(text).catch(error => {
      console.error("Errore AI:", error)
      setCurrentStatus('listening')
      // Messaggio di fallback
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'response',
        content: "Errore nella generazione della risposta. Riprova.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, fallbackMessage])
    })
  }

  const generateAIResponse = async (question: string) => {
    if (userPoints < 1) {
      alert("Non hai abbastanza punti per continuare!")
      setCurrentStatus('listening')
      return
    }

    console.log("Generating AI response for:", question)

    setCurrentStatus('generating')

    try {
      // Deduct 1 point from IP-based system
      const pointsResponse = await fetch('/api/ip-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct', points: 1 })
      })

      const pointsData = await pointsResponse.json()
      console.log("Points deducted for response:", pointsData)

      const newPoints = pointsData.points
      setUserPoints(newPoints)
      localStorage.setItem("userPoints", newPoints.toString())
    } catch (error) {
      console.error("Error deducting points:", error)
      const newPoints = userPoints - 1
      setUserPoints(newPoints)
      localStorage.setItem("userPoints", newPoints.toString())
    }

    setCurrentStatus('generating')

    const generatingMessage: Message = {
      id: (Date.now() + 0.3).toString(),
      type: 'status',
      content: "🤖 Generating enhanced personalized response...",
      timestamp: new Date(),
      statusType: 'generating'
    }

    setMessages(prev => [...prev, generatingMessage])

    try {
      // Get user profile and job data
      const jobData = localStorage.getItem("jobData")
      const parsedJobData = jobData ? JSON.parse(jobData) : null

      // NEW: Get enhanced document analyses
      const documentAnalyses = localStorage.getItem("documentAnalyses")
      const parsedDocumentAnalyses = documentAnalyses ? JSON.parse(documentAnalyses) : []

      const userProfile = parsedJobData ?
        `Position: ${parsedJobData.jobTitle}\nBackground: ${parsedJobData.jobDescription}` :
        "Generic candidate"

      console.log("Sending enhanced request with document analyses:", {
        documentAnalysesCount: parsedDocumentAnalyses.length,
        userProfile: userProfile.substring(0, 100) + '...'
      })

      const response = await fetch('/api/interview-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userProfile,
          jobTitle: parsedJobData?.jobTitle || "Position not specified",
          language,
          // NEW: Pass document analyses to API
          documentAnalyses: parsedDocumentAnalyses
        }),
      })

      if (!response.ok) throw new Error('Response failed')

      // Remove status messages first
      setMessages(prev => prev.filter(msg => msg.type !== 'status'))

      // Create streaming response message
      const responseId = (Date.now() + 1).toString()
      let streamingResponse = ""

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'metadata') {
                  const initialResponseMessage: Message = {
                    id: responseId,
                    type: 'response',
                    content: "",
                    timestamp: new Date()
                  }
                  setMessages(prev => [...prev, initialResponseMessage])

                } else if (data.type === 'delta') {
                  streamingResponse += data.content

                  setMessages(prev => prev.map(msg =>
                    msg.id === responseId
                      ? { ...msg, content: streamingResponse }
                      : msg
                  ))

                } else if (data.type === 'clear') {
                  // Clear previous content for corrected responses
                  streamingResponse = ""
                  setMessages(prev => prev.map(msg =>
                    msg.id === responseId
                      ? { ...msg, content: "" }
                      : msg
                  ))

                } else if (data.type === 'done') {
                  console.log("Enhanced streaming completed:", streamingResponse)

                } else if (data.type === 'error') {
                  throw new Error(data.message)
                }
              } catch (parseError) {
                console.error("Error parsing chunk:", parseError)
              }
            }
          }
        }
      }

      setCurrentStatus('listening')

    } catch (error) {
      console.error("Error generating enhanced AI response:", error)

      setMessages(prev => prev.filter(msg => msg.type !== 'status'))

      const fallbackResponse = language === 'it' ?
        "Grazie per la domanda. Basandomi sulla mia esperienza e competenze estratte dai documenti, ritengo di poter contribuire significativamente a questa posizione." :
        "Thank you for the question. Based on my experience and skills extracted from the documents, I believe I can contribute significantly to this position."

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'response',
        content: fallbackResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, responseMessage])
      setCurrentStatus('listening')
    }
  }

  const endInterview = () => {
    console.log("Ending interview")
    setIsLiveMode(false)
    setIsListening(false)
    router.push("/")
  }

  const getStatusMessage = () => {
    switch (currentStatus) {
      case 'listening': return "🎧 In ascolto..."
      case 'processing': return "⚡ Elaborando..."
      case 'generating': return "🚀 Rispondendo..."
      default: return "💤 Inattivo"
    }
  }

  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <div className="min-h-screen bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea] dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900 px-4 py-8">
          <div className="max-w-6xl mx-auto">

            {/* Header with title and points */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
                PassInterview.AI - Live Session
              </h1>
              <div className="flex items-center justify-center gap-4">
                <Badge variant="secondary" className="gap-1 bg-gray-800 dark:bg-gray-700 text-white">
                  <Coins className="w-4 h-4" />
                  {userPoints} punti
                </Badge>
                <div className="inline-flex items-center bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  🤖 AI Assistant Ready
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="block lg:hidden space-y-4">

              {/* Mobile Quick Controls Bar */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {/* Microphone Control */}
                <div className="flex-shrink-0">
                  {!isLiveMode ? (
                    <Button
                      size="lg"
                      onClick={toggleLiveMode}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl whitespace-nowrap"
                      disabled={userPoints < 1 || isActivatingLive}
                    >
                      {isActivatingLive ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4" />
                          Inizia Ascolto
                        </div>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={toggleListening}
                      variant={isListening ? "destructive" : "default"}
                      className={`px-6 py-3 rounded-xl whitespace-nowrap ${isListening
                          ? ''
                          : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {isListening ? (
                          <>
                            <MicOff className="w-4 h-4" />
                            Ferma Ascolto
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            Riprendi Ascolto
                          </>
                        )}
                      </div>
                    </Button>
                  )}
                </div>

                {/* Language Selector */}
                <div className="flex-shrink-0 min-w-[120px]">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">🇮🇹 IT</SelectItem>
                      <SelectItem value="en">🇺🇸 EN</SelectItem>
                      <SelectItem value="es">🇪🇸 ES</SelectItem>
                      <SelectItem value="fr">🇫🇷 FR</SelectItem>
                      <SelectItem value="de">🇩🇪 DE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Context Expand Button */}
                {jobData && (
                  <Dialog open={isContextExpanded} onOpenChange={setIsContextExpanded}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-shrink-0 px-4 py-3 rounded-xl whitespace-nowrap"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Context
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Interview Context - Full View
                        </DialogTitle>
                      </DialogHeader>

                      <ScrollArea className="max-h-[70vh] pr-4">
                        <div className="space-y-6">
                          {/* Job Title */}
                          <div>
                            <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                              Posizione di Lavoro
                            </h4>
                            <p className="text-base font-medium">
                              {jobData.jobTitle || "Posizione non specificata"}
                            </p>
                          </div>

                          {/* Job Description */}
                          <div>
                            <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                              Descrizione e Contesto
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {jobData.jobDescription || "Nessuna descrizione fornita"}
                              </p>
                            </div>
                          </div>

                          {/* Uploaded Files */}
                          {jobData.uploadedFiles && jobData.uploadedFiles.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">
                                Documenti Analizzati dall'AI
                              </h4>
                              <div className="space-y-2">
                                {jobData.uploadedFiles.map((fileName: string, index: number) => (
                                  <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-600">📄</span>
                                      <span className="font-medium text-blue-800 dark:text-blue-200">
                                        {fileName}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {Math.floor(Math.random() * 200 + 100)}.{Math.floor(Math.random() * 90 + 10)} KB
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-6">
                                      Tipo: CV/Resume • Analizzato e processato dall'AI
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Analysis Summary */}
                          <div>
                            <h4 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                              Status Analisi AI
                            </h4>
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-800 dark:text-green-200">
                                  Profilo candidato completamente analizzato
                                </span>
                              </div>
                              <p className="text-sm text-green-700 dark:text-green-300">
                                L'AI è pronta a rispondere come te, utilizzando il tuo background e le tue esperienze dai documenti caricati.
                                Ogni risposta costerà 1 punto e sarà personalizzata in base al tuo profilo.
                              </p>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Mobile Chat Area - Fixed height, full scrollable */}
              <Card className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30" style={{ height: 'calc(100vh - 220px)' }}>
                <CardHeader className="flex-shrink-0 pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Interview Chat</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${currentStatus === 'listening' ? 'bg-green-500 animate-pulse' : currentStatus === 'idle' ? 'bg-gray-400' : 'bg-yellow-500'}`}></div>
                        <span className="text-xs font-medium">{getStatusMessage()}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4" style={{ height: 'calc(100vh - 320px)' }}>
                  <ScrollArea className="h-full w-full" onScrollCapture={handleScroll}>
                    <div className="space-y-4 pr-4">
                      {messages.map((message) => (
                        <div key={message.id}>
                          {message.type === 'question' ? (
                            <div className="flex justify-start mb-4">
                              <div className="max-w-[85%] bg-blue-100 dark:bg-blue-900/40 rounded-3xl rounded-bl-lg px-6 py-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <Mic className="w-4 h-4 text-blue-600" />
                                  <span className="font-semibold text-sm text-blue-800 dark:text-blue-200">Interviewer:</span>
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">{message.content}</p>
                              </div>
                            </div>
                          ) : message.type === 'status' ? (
                            <div className="flex justify-center mb-4">
                              <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-full px-4 py-2">
                                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-sm font-medium">{message.content}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end mb-4">
                              <div className="max-w-[85%] bg-green-100 dark:bg-green-900/40 rounded-3xl rounded-br-lg px-6 py-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <Brain className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold text-sm text-green-800 dark:text-green-200">Your AI Response:</span>
                                  <Badge className="bg-green-600 text-white text-xs">AI</Badge>
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">{message.content}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Invisible element to scroll to */}
                      <div ref={messagesEndRef} />

                      {messages.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">Ready for Interview</p>
                          <p className="text-sm">Click "Inizia Ascolto" to start listening for questions</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* New Session Button - Separate for Mobile */}
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white border-none py-3 rounded-xl mt-4"
              >
                🤖 Nuova Sessione
              </Button>
            </div>

            {/* Fullscreen Chat Dialog */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
              <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 rounded-xl [&>button]:hidden">{/* Hide default close button and round all corners */}
                <div className="h-full flex flex-col rounded-xl overflow-hidden">
                  {/* Fullscreen Header with centered controls - Sticky */}
                  <div className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-background/90 backdrop-blur-sm">
                    <h2 className="text-xl font-bold">Interview Chat - Full Screen</h2>

                    {/* Center controls: Language and Points */}
                    <div className="flex items-center gap-4">
                      {/* Language Selector */}
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="w-[120px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="it">🇮🇹 IT</SelectItem>
                            <SelectItem value="en">🇺🇸 EN</SelectItem>
                            <SelectItem value="es">🇪🇸 ES</SelectItem>
                            <SelectItem value="fr">🇫🇷 FR</SelectItem>
                            <SelectItem value="de">🇩🇪 DE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Points Display */}
                      <Badge variant="secondary" className="gap-1 bg-gray-800 dark:bg-gray-700 text-white px-3 py-1">
                        <Coins className="w-4 h-4" />
                        {userPoints} punti
                      </Badge>
                    </div>

                    {/* Right side: Status and Close */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${currentStatus === 'listening' ? 'bg-green-500 animate-pulse' : currentStatus === 'idle' ? 'bg-gray-400' : 'bg-yellow-500'}`}></div>
                        <span className="text-sm font-medium">{getStatusMessage()}</span>
                      </div>

                      {/* Close Button with red hover */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFullscreen(false)}
                        className="p-2 h-auto hover:bg-red-500 hover:text-white rounded-full transition-colors duration-200"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Fullscreen Chat Content - With proper height calculation */}
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full w-full p-4" onScrollCapture={handleScroll}>
                      <div className="space-y-4 pr-4 pb-20">
                        {messages.map((message) => (
                          <div key={message.id}>
                            {message.type === 'question' ? (
                              <div className="flex justify-start mb-4">
                                <div className="max-w-[70%] bg-blue-100 dark:bg-blue-900/40 rounded-3xl rounded-bl-lg px-6 py-4 shadow-sm">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Mic className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-blue-800 dark:text-blue-200">Interviewer:</span>
                                  </div>
                                  <p className="text-gray-800 dark:text-gray-100 leading-relaxed">{message.content}</p>
                                </div>
                              </div>
                            ) : message.type === 'status' ? (
                              <div className="flex justify-center mb-4">
                                <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-full px-4 py-2">
                                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm font-medium">{message.content}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-end mb-4">
                                <div className="max-w-[70%] bg-green-100 dark:bg-green-900/40 rounded-3xl rounded-br-lg px-6 py-4 shadow-sm">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-green-800 dark:text-green-200">Your AI Response:</span>
                                    <Badge className="bg-green-600 text-white text-xs">AI</Badge>
                                  </div>
                                  <p className="text-gray-800 dark:text-gray-100 leading-relaxed">{message.content}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {messages.length === 0 && (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl font-medium mb-2">Ready for Interview</p>
                            <p className="text-base">Use the controls below to start listening for questions</p>
                          </div>
                        )}

                        {/* Invisible element to scroll to */}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Fullscreen Controls Bar - Only Microphone - Sticky */}
                  <div className="sticky bottom-0 z-50 border-t bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-b-xl">
                    <div className="flex items-center justify-center">
                      {/* Microphone Control - Centered */}
                      {!isLiveMode ? (
                        <Button
                          size="lg"
                          onClick={toggleLiveMode}
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-medium"
                          disabled={userPoints < 1 || isActivatingLive}
                        >
                          {isActivatingLive ? (
                            <div className="flex items-center gap-3">
                              <Loader2 className="w-6 h-6 animate-spin" />
                              Starting...
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Mic className="w-6 h-6" />
                              Inizia Ascolto
                            </div>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl px-6 py-3">
                            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">Microfono {isListening ? "Attivo" : "Sospeso"}</span>
                            </div>
                          </div>

                          <Button
                            size="lg"
                            onClick={toggleListening}
                            variant={isListening ? "destructive" : "default"}
                            className={`px-8 py-4 rounded-xl text-lg font-medium ${isListening
                                ? ''
                                : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              {isListening ? (
                                <>
                                  <MicOff className="w-6 h-6" />
                                  Ferma Ascolto
                                </>
                              ) : (
                                <>
                                  <Mic className="w-6 h-6" />
                                  Riprendi Ascolto
                                </>
                              )}
                            </div>
                          </Button>
                        </div>
                      )}
                    </div>

                    {userPoints < 1 && (
                      <p className="text-sm text-red-600 text-center mt-3 font-medium">
                        Punti insufficienti per continuare!
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6">

              {/* Main Chat Area - Fixed height with proper scrolling */}
              <div className="lg:col-span-2">
                <Card className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30" style={{ height: 'calc(100vh - 180px)' }}>
                  <CardHeader className="flex-shrink-0 pb-3 pt-4 px-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">Interview Chat</CardTitle>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${currentStatus === 'listening' ? 'bg-green-500 animate-pulse' : currentStatus === 'idle' ? 'bg-gray-400' : 'bg-yellow-500'}`}></div>
                          <span className="text-sm font-medium">{getStatusMessage()}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 pb-6" style={{ height: 'calc(100vh - 280px)' }}>
                    <ScrollArea className="h-full w-full" onScrollCapture={handleScroll}>
                      <div className="space-y-4 pr-4">
                        {messages.map((message) => (
                          <div key={message.id}>
                            {message.type === 'question' ? (
                              <div className="flex justify-start mb-4">
                                <div className="max-w-[80%] bg-blue-100 dark:bg-blue-900/40 rounded-3xl rounded-bl-lg px-6 py-4 shadow-sm">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Mic className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-blue-800 dark:text-blue-200">Interviewer:</span>
                                  </div>
                                  <p className="text-gray-800 dark:text-gray-100 leading-relaxed">{message.content}</p>
                                </div>
                              </div>
                            ) : message.type === 'status' ? (
                              <div className="flex justify-center mb-4">
                                <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-full px-4 py-2">
                                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm font-medium">{message.content}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-end mb-4">
                                <div className="max-w-[80%] bg-green-100 dark:bg-green-900/40 rounded-3xl rounded-br-lg px-6 py-4 shadow-sm">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-green-800 dark:text-green-200">Your AI Response:</span>
                                    <Badge className="bg-green-600 text-white text-xs">AI</Badge>
                                  </div>
                                  <p className="text-gray-800 dark:text-gray-100 leading-relaxed">{message.content}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {messages.length === 0 && (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">Ready for Interview</p>
                            <p className="text-sm">Click "Inizia Ascolto" to start listening for questions</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Controls Sidebar */}
              <div className="space-y-6">

                {/* Microphone Control */}
                <Card className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-semibold mb-4">Controllo Microfono</h3>

                    {!isLiveMode ? (
                      <Button
                        size="lg"
                        onClick={toggleLiveMode}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4 rounded-xl"
                        disabled={userPoints < 1 || isActivatingLive}
                      >
                        {isActivatingLive ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Starting...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Mic className="w-5 h-5" />
                            Inizia Ascolto
                          </div>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3">
                          <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Microfono {isListening ? "Attivo" : "Sospeso"}</span>
                          </div>
                        </div>

                        <Button
                          size="lg"
                          onClick={toggleListening}
                          variant={isListening ? "destructive" : "default"}
                          className={`w-full py-4 rounded-xl ${isListening
                              ? ''
                              : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {isListening ? (
                              <>
                                <MicOff className="w-5 h-5" />
                                Ferma Ascolto
                              </>
                            ) : (
                              <>
                                <Mic className="w-5 h-5" />
                                Riprendi Ascolto
                              </>
                            )}
                          </div>
                        </Button>
                      </div>
                    )}

                    {userPoints < 1 && (
                      <p className="text-xs text-red-600 mt-2">
                        Punti insufficienti!
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Language Selection */}
                <Card className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      Lingua
                    </h3>

                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Interview Context (expandable) */}
                {jobData && (
                  <Card className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Context
                        </h3>
                        <Dialog open={isContextExpanded} onOpenChange={setIsContextExpanded}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Expand className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Interview Context - Full View
                              </DialogTitle>
                            </DialogHeader>

                            <ScrollArea className="max-h-[60vh] pr-4">
                              <div className="space-y-6">
                                {/* Job Title */}
                                <div>
                                  <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                                    Posizione di Lavoro
                                  </h4>
                                  <p className="text-base font-medium">
                                    {jobData.jobTitle || "Posizione non specificata"}
                                  </p>
                                </div>

                                {/* Job Description */}
                                <div>
                                  <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                                    Descrizione e Contesto
                                  </h4>
                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                      {jobData.jobDescription || "Nessuna descrizione fornita"}
                                    </p>
                                  </div>
                                </div>

                                {/* Uploaded Files */}
                                {jobData.uploadedFiles && jobData.uploadedFiles.length > 0 && (
                                  <div>
                                    <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">
                                      Documenti Analizzati dall'AI
                                    </h4>
                                    <div className="space-y-2">
                                      {jobData.uploadedFiles.map((fileName: string, index: number) => (
                                        <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-600">📄</span>
                                            <span className="font-medium text-blue-800 dark:text-blue-200">
                                              {fileName}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                              {Math.floor(Math.random() * 200 + 100)}.{Math.floor(Math.random() * 90 + 10)} KB
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-6">
                                            Tipo: CV/Resume • Analizzato e processato dall'AI
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* AI Analysis Summary */}
                                <div>
                                  <h4 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                                    Status Analisi AI
                                  </h4>
                                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                      <span className="font-medium text-green-800 dark:text-green-200">
                                        Profilo candidato completamente analizzato
                                      </span>
                                    </div>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                      L'AI è pronta a rispondere come te, utilizzando il tuo background e le tue esperienze dai documenti caricati.
                                      Ogni risposta costerà 1 punto e sarà personalizzata in base al tuo profilo.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <ScrollArea className="max-h-[200px] overflow-y-auto">
                        <div className="text-sm space-y-2 pr-2">
                          <p className="font-medium text-blue-600 dark:text-blue-400">
                            {jobData.jobTitle || "Position"}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {jobData.jobDescription || "No description"}
                          </p>

                          {jobData.uploadedFiles && jobData.uploadedFiles.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mt-3">
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                📄 {jobData.uploadedFiles.length} documento{jobData.uploadedFiles.length > 1 ? 'i' : ''} analizzato{jobData.uploadedFiles.length > 1 ? 'i' : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* New Session Button */}
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white border-none py-3 rounded-xl"
                >
                  🤖 Nuova Sessione
                </Button>

                {/* Audio Recorder (when active) */}
                {isLiveMode && (
                  <div className="hidden">
                    <AudioRecorder
                      onTranscription={handleTranscription}
                      isActive={isLiveMode && isListening}
                    />
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}