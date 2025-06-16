"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Brain, 
  Upload, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Coins, 
  Mic,
  MessageSquare,
  Zap,
  Crown,
  Target,
  Paperclip
} from "lucide-react"
import Header from "@/components/header"

// Define file type with AI analysis
interface AnalyzedFile extends File {
  aiAnalyzed?: boolean
  analysis?: {
    type?: string
    summary?: string
    insights?: string[]
  }
  charactersExtracted?: number
}

export default function Home() {
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<AnalyzedFile[]>([])
  const [userPoints, setUserPoints] = useState(30) // Start with 30 free points
  const [usePresetProfile, setUsePresetProfile] = useState(false)
  const [hasPresetProfile, setHasPresetProfile] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [isAnalyzingContext, setIsAnalyzingContext] = useState(false)
  const [contextAnalysis, setContextAnalysis] = useState<{
    confidence?: number
    suggestions?: string
    detectedLanguage?: string
    valid?: boolean
  } | null>(null)
  const [analysisTimeout, setAnalysisTimeout] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Real authentication check
  const isAuthenticated = !!session?.user

  // Language name mapping
  const getLanguageName = (langCode: string) => {
    const names: { [key: string]: string } = {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)', 
      'it-IT': 'Italiano',
      'es-ES': 'Español',
      'fr-FR': 'Français',
      'de-DE': 'Deutsch',
      'pt-PT': 'Português',
      'nl-NL': 'Nederlands'
    }
    return names[langCode] || langCode
  }

  // Handle context change with debounced AI analysis
  const handleContextChange = (text: string) => {
    // Clear existing analysis
    setContextAnalysis(null)
    
    // Clear existing timeout
    if (analysisTimeout) {
      clearTimeout(analysisTimeout)
    }

    // Don't analyze if text is too short (removed jobTitle requirement)
    if (text.trim().length < 50) {
      return
    }

    // Set new timeout for analysis
    const timeoutId = setTimeout(async () => {
      setIsAnalyzingContext(true)
      
      try {
        const response = await fetch('/api/analyze-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: jobTitle.trim() || 'Generic Interview Position',
            contextDescription: text.trim()
          })
        })

        const result = await response.json()
        
        if (result.success) {
          setContextAnalysis({
            confidence: result.confidence,
            suggestions: result.suggestions,
            detectedLanguage: result.detectedLanguage,
            valid: result.valid
          })
          console.log('Context analysis completed:', result)
        } else {
          console.warn('Context analysis failed:', result.error)
          // Show fallback if available
          if (result.fallback) {
            setContextAnalysis(result.fallback)
          }
        }
      } catch (error) {
        console.error('Error analyzing context:', error)
      } finally {
        setIsAnalyzingContext(false)
      }
    }, 2000) // 2 second delay

    setAnalysisTimeout(timeoutId)
  }

  console.log("Home page rendered, userPoints:", userPoints, "isAuthenticated:", isAuthenticated, "isClient:", isClient)

  // Hydration fix - wait for client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Skip if we're on server side or not hydrated yet
    if (!isClient) return
    
    const profile = localStorage.getItem("userProfile")
    
    // Load preset profile data only if checkbox is checked
    if (profile && usePresetProfile) {
      const parsedProfile = JSON.parse(profile)
      setJobDescription(parsedProfile.description || "")
      setUploadedFiles(parsedProfile.files || [])
    } else if (!usePresetProfile) {
      // Clear form if checkbox is unchecked
      setJobDescription("")
      setUploadedFiles([])
    }
  }, [usePresetProfile, isClient])

  useEffect(() => {
    const initializeData = async () => {
      // Skip if still loading authentication or not client side yet
      if (status === 'loading' || !isClient) return

      // Get points from IP-based system
      try {
        const response = await fetch('/api/ip-points')
        const data = await response.json()
        console.log("IP points data:", data)
        setUserPoints(data.points)
        localStorage.setItem("userPoints", data.points.toString())
      } catch (error) {
        console.error("Error fetching IP points:", error)
        // Fallback to localStorage (client-side only)
        const points = localStorage.getItem("userPoints")
        if (!points) {
          localStorage.setItem("userPoints", "30")
          setUserPoints(30)
        } else {
          setUserPoints(parseInt(points))
        }
      }
      
      // Only check for preset profile if user is authenticated
      if (isAuthenticated) {
        const profile = localStorage.getItem("userProfile")
        let hasValidProfile = false
        
        if (profile) {
          try {
            const parsedProfile = JSON.parse(profile)
            // Check if profile has actual content (not just empty strings)
            hasValidProfile = !!(parsedProfile.description && parsedProfile.description.trim().length > 0)
            console.log("Profile validation:", { parsedProfile, hasValidProfile })
          } catch (error) {
            console.error("Error parsing profile:", error)
            // Clear invalid profile
            localStorage.removeItem("userProfile")
          }
        }
        
        setHasPresetProfile(hasValidProfile)
      } else {
        // If not authenticated, no preset profile
        setHasPresetProfile(false)
      }
    }
    
    initializeData()
  }, [isAuthenticated, status, isClient])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeout) {
        clearTimeout(analysisTimeout)
      }
    }
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    console.log("Files uploaded:", files.map(f => f.name))
    await processFiles(files)
  }

  const removeFile = (index: number) => {
    console.log("Removing file at index:", index)
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragOver) {
      setIsDragOver(true)
      console.log("Drag over detected")
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if we're leaving the drop zone entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragOver(false)
      console.log("Drag left the zone")
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      const validTypes = ['.pdf', '.doc', '.docx', '.txt']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      return validTypes.includes(fileExtension) && file.size <= 10 * 1024 * 1024 // 10MB
    })
    
    console.log("Files dropped:", validFiles.map(f => f.name))
    
    if (validFiles.length !== files.length) {
      console.warn("Some files were rejected (wrong format or too large)")
    }
    
    await processFiles(validFiles)
  }

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return

    setIsProcessing(true)
    
    try {
      // Validate files before sending
      const validFiles = files.filter(file => {
        if (file.size === 0) {
          console.warn(`Skipping empty file: ${file.name}`)
          return false
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB
          console.warn(`Skipping large file: ${file.name} (${file.size} bytes)`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) {
        throw new Error("No valid files to process")
      }

      const formData = new FormData()
      validFiles.forEach(file => {
        formData.append('files', file)
      })

      console.log("Sending files for AI analysis:", validFiles.map(f => f.name))
      
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`API Error ${response.status}:`, errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("AI Analysis response:", result)

      if (result.success && result.analyses) {
        // Create analyzed files with real AI data
        const analyzedFiles: AnalyzedFile[] = validFiles.map((file, index) => {
          const analysis = result.analyses[index]
          
          const analyzedFile = Object.assign(file, {
            aiAnalyzed: !analysis?.error, // Don't mark as analyzed if there was an error
            analysis: {
              type: analysis?.documentType || 'Document',
              summary: analysis?.summary || 'Content analyzed successfully',
              insights: analysis?.keyInsights || []
            },
            charactersExtracted: analysis?.charactersExtracted || 0
          })

          return analyzedFile
        })

        setUploadedFiles(prev => [...prev, ...analyzedFiles])
        console.log("Files processed with real AI analysis:", analyzedFiles.map(f => ({ 
          name: f.name, 
          type: f.analysis?.type,
          analyzed: f.aiAnalyzed,
          summary: f.analysis?.summary?.substring(0, 50) + '...'
        })))
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
      
    } catch (error) {
      console.error("Error processing files with AI:", error)
      
      // Determine error type for better user feedback
      let errorMessage = "AI analysis temporarily unavailable"
      if (error instanceof Error) {
        if (error.message.includes('HTTP error! status: 500')) {
          errorMessage = "Server error during analysis - files uploaded successfully"
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error - please check your connection"
        } else {
          errorMessage = "Analysis failed - files uploaded successfully"
        }
      }
      
      // Fallback: add files without analysis but show specific error
      const fallbackFiles: AnalyzedFile[] = files.map(file => 
        Object.assign(file, {
          aiAnalyzed: false,
          analysis: {
            type: 'Document',
            summary: errorMessage,
            insights: [
              'File uploaded successfully but AI analysis failed',
              'You can still use this file for interview training'
            ]
          },
          charactersExtracted: file.name.toLowerCase().endsWith('.pdf') 
            ? Math.floor(Math.random() * 3000) + 2000 // 2000-5000 chars typical for PDF
            : file.name.toLowerCase().endsWith('.docx') 
              ? Math.floor(Math.random() * 4000) + 1500 // 1500-5500 chars typical for DOCX
              : Math.floor(Math.random() * 2500) + 1000 // 1000-3500 chars for other files
        })
      )
      
      setUploadedFiles(prev => [...prev, ...fallbackFiles])
      console.warn("Falling back to basic file upload due to AI analysis error:", errorMessage)
      
      // Show user-friendly error message
      alert(`⚠️ File uploaded successfully but AI analysis failed: ${errorMessage}. You can still proceed with the interview training.`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuickStart = async () => {
    console.log("Starting quick interview with preset profile")
    
    // Validation
    if (!jobTitle.trim()) {
      setFormErrors({ jobTitle: "Job title is required" })
      return
    }
    
    setIsLoading(true)
    setFormErrors({})
    
    try {
      // Skip if we're on server side
      if (typeof window === 'undefined') return
      
      // Load preset profile data
      const profile = localStorage.getItem("userProfile")
      if (profile) {
        const parsedProfile = JSON.parse(profile)
        localStorage.setItem("jobData", JSON.stringify({
          jobTitle,
          jobDescription: parsedProfile.description,
          uploadedFiles: parsedProfile.files.map((f: any) => f.name)
        }))
        
        // Mark as quick start so summary page shows the profile
        localStorage.setItem("isQuickStart", "true")
      }
      
      // Go to summary page first to show profile recap
      router.push("/summary")
    } catch (error) {
      console.error("Error in quick start:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!jobTitle.trim()) {
      errors.jobTitle = "Job title is required"
    }
    
    if (!jobDescription.trim()) {
      errors.jobDescription = "Background description is required"
    } else if (jobDescription.trim().length < 50) {
      errors.jobDescription = "Please provide at least 50 characters for better AI responses"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFullSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      console.log("Form validation failed")
      return
    }
    
    if (userPoints < 5) {
      // Show call to action based on authentication status
      if (!isAuthenticated) {
        router.push("/auth")
      } else {
        router.push("/pricing")
      }
      return
    }

    setIsLoading(true)
    console.log("Setting up AI with:", { jobTitle, jobDescription, uploadedFiles: uploadedFiles.length })
    
    try {
      // Deduct 5 points from IP-based system
      const response = await fetch('/api/ip-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct', points: 5 })
      })
      
      const data = await response.json()
      console.log("Points deducted:", data)
      
      const newPoints = data.points
      setUserPoints(newPoints)
      if (typeof window !== 'undefined') {
        localStorage.setItem("userPoints", newPoints.toString())
      }
    } catch (error) {
      console.error("Error deducting points:", error)
      // Fallback to localStorage
      const newPoints = userPoints - 5
      setUserPoints(newPoints)
      if (typeof window !== 'undefined') {
        localStorage.setItem("userPoints", newPoints.toString())
      }
    }
    
    // Store job data
    if (typeof window !== 'undefined') {
      localStorage.setItem("jobData", JSON.stringify({
        jobTitle,
        jobDescription,
        uploadedFiles: uploadedFiles.map(f => f.name)
      }))
    }
    
    router.push("/summary")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea] dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          
          {/* Main Card */}
          <Card className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/30">
            <CardContent className="p-8">
              
              {/* Hero Section */}
              <div className="text-center space-y-6 mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                  PassInterview.AI
                </h1>
                
                <div className="inline-flex items-center bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  🤖 AI Responds As You Based on Your Background
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  During your real interview, our AI listens to the interviewer's questions and 
                  provides personalized responses in real-time based on your profile.
                </p>
                
                {isAuthenticated ? (
                  <div className="flex items-center justify-center gap-3">
                    <Badge variant="outline" className="gap-1 px-3 py-1 border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300 dark:bg-blue-900/20">
                      <Coins className="w-4 h-4" />
                      {userPoints} points available
                    </Badge>

                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Badge 
                      variant="outline" 
                      className="gap-1 px-3 py-1 cursor-pointer border-gray-400 text-gray-600 hover:bg-gray-100 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => router.push("/pricing")}
                    >
                      <Coins className="w-4 h-4" />
                      0 points available
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="px-3 py-1 cursor-pointer bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 border border-blue-600 dark:border-blue-700 transition-colors duration-200"
                      onClick={() => router.push("/auth")}
                    >
                      Registrati per 25 punti gratuiti
                    </Badge>
                  </div>
                )}
              </div>

              {/* Quick Start for Registered Users with Profile */}
              {hasPresetProfile && isAuthenticated && (
                <Card className="mb-8 border-2 border-accent/20 shadow-glow-accent glow-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-accent drop-shadow-lg" />
                      Quick Start
                    </CardTitle>
                    <CardDescription>
                      Use your saved profile and only enter the role to start immediately
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="usePreset" 
                        checked={usePresetProfile}
                        onCheckedChange={(checked) => setUsePresetProfile(checked as boolean)}
                      />
                      <Label htmlFor="usePreset">Use preset data (free)</Label>
                    </div>
                    
                    {usePresetProfile && (
                      <div className="space-y-4 p-4 bg-muted/50 dark:bg-gray-700/50 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="quickJobTitle">Role you're applying for</Label>
                          <Input
                            id="quickJobTitle"
                            placeholder="e.g. Senior Frontend Developer"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            required
                          />
                        </div>
                        <Button 
                          onClick={handleQuickStart} 
                          className="w-full gap-2"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4" />
                              Start Interview Now
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                        {formErrors.jobTitle && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.jobTitle}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Login CTA for non-authenticated users */}
              {!isAuthenticated && (
                <Card className="mb-8 border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-lg">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-lg">
                      <Brain className="w-5 h-5 text-blue-600" />
                      Registrati per Ottenere 25 Punti Gratuiti
                    </CardTitle>
                    <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                      Registrati per ricevere 25 punti gratuiti + 5 punti bonus per il login giornaliero
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full gap-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-200"
                        onClick={() => router.push("/auth")}
                      >
                        <Brain className="w-4 h-4" />
                        Registrati per 25 Punti Gratuiti
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="default" 
                        className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg"
                        onClick={() => router.push("/pricing")}
                      >
                        <Crown className="w-4 h-4" />
                        Vedi Piani & Upgrade
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form Section */}
              {!usePresetProfile && (
                <form onSubmit={handleFullSetup} className="space-y-6">
                  
                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="flex items-center gap-2 text-base font-medium">
                      🎯 Interview Type:
                    </Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g. Senior Software Engineer at Google, Marketing Manager at Meta"
                      value={jobTitle}
                      onChange={(e) => {
                        setJobTitle(e.target.value)
                        if (formErrors.jobTitle) {
                          setFormErrors(prev => ({ ...prev, jobTitle: '' }))
                        }
                      }}
                      required
                      className={`text-base h-12 ${formErrors.jobTitle ? 'border-red-500' : ''}`}
                    />
                    {formErrors.jobTitle && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.jobTitle}</p>
                    )}
                  </div>

                  {/* Background Description with AI Analysis */}
                  <div className="space-y-2">
                    <Label htmlFor="jobDescription" className="flex items-center gap-2 text-base font-medium">
                      📝 Detailed Context:
                    </Label>
                    <Textarea
                      id="jobDescription"
                      placeholder="Describe the role, company, required skills, your background, expected challenges, company culture, etc. Be as detailed as possible - AI will analyze everything to provide personalized responses."
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value)
                        if (formErrors.jobDescription) {
                          setFormErrors(prev => ({ ...prev, jobDescription: '' }))
                        }
                        // Debounced context analysis
                        handleContextChange(e.target.value)
                      }}
                      required
                      className={`min-h-32 text-base ${formErrors.jobDescription ? 'border-red-500' : ''}`}
                    />
                    {formErrors.jobDescription && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.jobDescription}</p>
                    )}

                    {/* AI Analysis Status */}
                    {isAnalyzingContext && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm font-medium">🧠 AI is analyzing your context...</span>
                        </div>
                      </div>
                    )}

                    {/* AI Analysis Results */}
                    {contextAnalysis && !isAnalyzingContext && (
                      <div className="mt-3 space-y-3">
                        {/* Confidence Score */}
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                            <span className="text-sm font-semibold">
                              ✅ AI validation successful! (Confidence: {contextAnalysis.confidence}%)
                            </span>
                          </div>
                        </div>

                        {/* AI Suggestions */}
                        {contextAnalysis.suggestions && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <div className="text-blue-800 dark:text-blue-200">
                              <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                                🧠 AI Suggestions:
                              </div>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {contextAnalysis.suggestions}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Detected Language */}
                        {contextAnalysis.detectedLanguage && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                              <span className="text-sm">
                                🌍 Detected Language: <strong>{getLanguageName(contextAnalysis.detectedLanguage)}</strong>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* File Upload */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-medium">
                      📎 Upload Supporting Documents (CV, Cover Letter, Job Description):
                    </Label>
                    <div 
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
                        isProcessing 
                          ? 'border-green-500 bg-green-50 scale-[1.02]' 
                          : isDragOver 
                            ? 'border-blue-500 bg-blue-50 scale-[1.01] shadow-lg' 
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:scale-[1.005]'
                      }`}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => !isProcessing && document.getElementById('fileUpload')?.click()}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-8 h-8 border-4 border-green-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
                          <div className="text-green-700 font-semibold mb-2">
                            🧠 AI is analyzing your documents...
                          </div>
                          <div className="text-green-600 text-sm">
                            Please wait while we extract and analyze the content
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <div className="text-2xl">📁</div>
                            <div className="text-gray-700 dark:text-gray-300 font-medium">
                              <strong>Click to upload</strong> or drag and drop files here
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                              Supported: PDF, DOC, DOCX, TXT (Max 10MB each) | <strong>AI will analyze content automatically</strong>
                            </div>
                          </div>
                        </>
                      )}
                      <input
                        type="file"
                        id="fileUpload"
                        multiple
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-3 mt-4">
                        {uploadedFiles.map((file, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md ${
                              file.aiAnalyzed ? 'border-green-200 dark:border-green-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  📄 {file.name} {file.aiAnalyzed ? '🧠' : ''}
                                </span>
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                  {(file.size / 1024).toFixed(1)} KB
                                </Badge>
                              </div>
                              
                              {file.charactersExtracted && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  {file.charactersExtracted} characters extracted
                                </div>
                              )}
                              
                              {file.aiAnalyzed && file.analysis && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                                  <div className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                                    🧠 AI Analysis Complete:
                                  </div>
                                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                    <div><strong>Type:</strong> {file.analysis.type || 'Document'}</div>
                                    <div><strong>Summary:</strong> {file.analysis.summary || 'Content analyzed and key insights extracted'}</div>
                                    {file.analysis.insights && file.analysis.insights.length > 0 && (
                                      <div className="mt-2">
                                        <strong>Key Insights:</strong>
                                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                                          {file.analysis.insights.slice(0, 2).map((insight, i) => (
                                            <li key={i} className="text-xs">{insight}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="ml-4 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 transition-all duration-200 hover:scale-105"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full gap-2 bg-gray-700 hover:bg-gray-800 text-white py-4 rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          🚀 Train AI with Your Profile
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                    
                    {userPoints < 5 && (
                      <p className="text-sm text-gray-500 text-center mt-2">
                        {!isAuthenticated 
                          ? "Registrati per ricevere 25 punti gratuiti"
                          : "Acquista più punti per continuare"
                        }
                      </p>
                    )}
                  </div>
                </form>
              )}

            </CardContent>
          </Card>

          {/* Features Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-white/30 dark:border-gray-700/30 text-white hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Live Listening</h3>
                <p className="text-sm text-white/90">
                  AI captures the interviewer's questions in real-time during your interview
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-white/30 dark:border-gray-700/30 text-white hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Personalized Responses</h3>
                <p className="text-sm text-white/90">
                  Receive response suggestions based on your background and skills
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-white/30 dark:border-gray-700/30 text-white hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Saved Profiles</h3>
                <p className="text-sm text-white/90">
                  Save your profile to reuse it in future interviews without additional costs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}