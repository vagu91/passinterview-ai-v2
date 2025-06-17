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
  Paperclip,
  Loader2,
  AlertCircle
} from "lucide-react"
import Header from "@/components/header"

// Enhanced interface to store complete document analysis
interface AnalyzedFile extends File {
  aiAnalyzed?: boolean
  analysis?: {
    type?: string
    summary?: string
    insights?: string[]
    // NEW: Enhanced extracted data for display
    extractedSkills?: string[]
    experienceYears?: string
    keyAchievements?: string[]
  }
  charactersExtracted?: number
  extractionMethod?: string
  // Store full enhanced analysis for profile analysis API
  fullAnalysis?: any
}

export default function Home() {
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<AnalyzedFile[]>([])
  const [userPoints, setUserPoints] = useState(30)
  const [usePresetProfile, setUsePresetProfile] = useState(false)
  const [hasPresetProfile, setHasPresetProfile] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
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

  // Removed automatic context analysis - will only analyze when going to next page
  const handleContextChange = (text: string) => {
    // Just clear any existing analysis without triggering new one
    setContextAnalysis(null)
    
    if (analysisTimeout) {
      clearTimeout(analysisTimeout)
    }
  }

  console.log("Home page rendered, userPoints:", userPoints, "isAuthenticated:", isAuthenticated, "isClient:", isClient)

  // Hydration fix
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const profile = localStorage.getItem("userProfile")

    if (profile && usePresetProfile) {
      const parsedProfile = JSON.parse(profile)
      setJobDescription(parsedProfile.description || "")
      setUploadedFiles(parsedProfile.files || [])
    } else if (!usePresetProfile) {
      setJobDescription("")
      setUploadedFiles([])
    }
  }, [usePresetProfile, isClient])

  useEffect(() => {
    const initializeData = async () => {
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
        const points = localStorage.getItem("userPoints")
        if (!points) {
          localStorage.setItem("userPoints", "30")
          setUserPoints(30)
        } else {
          setUserPoints(parseInt(points))
        }
      }

      if (isAuthenticated) {
        const profile = localStorage.getItem("userProfile")
        let hasValidProfile = false

        if (profile) {
          try {
            const parsedProfile = JSON.parse(profile)
            hasValidProfile = !!(parsedProfile.description && parsedProfile.description.trim().length > 0)
            console.log("Profile validation:", { parsedProfile, hasValidProfile })
          } catch (error) {
            console.error("Error parsing profile:", error)
            localStorage.removeItem("userProfile")
          }
        }

        setHasPresetProfile(hasValidProfile)
      } else {
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

  // UPLOAD FILES WITHOUT ANALYSIS - Analysis happens only on next page
  const processFiles = async (files: File[]) => {
    if (files.length === 0) return

    setIsProcessing(true)

    try {
      const validFiles = files.filter(file => {
        if (file.size === 0) {
          console.warn(`Skipping empty file: ${file.name}`)
          return false
        }
        if (file.size > 25 * 1024 * 1024) { // 25MB limit
          console.warn(`Skipping large file: ${file.name} (${file.size} bytes)`)
          alert(`File ${file.name} is too large (max 25MB). Please upload a smaller file.`)
          return false
        }
        
        // Check file types
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt']
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!allowedTypes.includes(fileExtension)) {
          alert(`File ${file.name} is not supported. Please upload PDF, DOC, DOCX, or TXT files.`)
          return false
        }
        
        return true
      })

      if (validFiles.length === 0) {
        throw new Error("No valid files to process")
      }

      console.log("Files uploaded (analysis will happen on next page):", validFiles.map(f => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        type: f.type
      })))

      // Create file objects without analysis - just upload info
      const uploadedFileObjects: AnalyzedFile[] = validFiles.map((file) => {
        return Object.assign(file, {
          aiAnalyzed: false, // Will be analyzed later
          analysis: {
            type: 'Uploaded',
            summary: `${file.name} uploaded successfully. Analysis will happen when you proceed to the next step.`,
            insights: [
              'File uploaded and ready for processing',
              'AI analysis will be performed when you click "Train AI with Enhanced Profile"',
              'This ensures faster upload and prevents timeouts'
            ],
            extractedSkills: [],
            experienceYears: 'Will be analyzed',
            keyAchievements: []
          },
          charactersExtracted: 0,
          extractionMethod: 'pending',
          fullAnalysis: null
        })
      })

      setUploadedFiles(prev => [...prev, ...uploadedFileObjects])

      console.log("Files uploaded successfully without analysis:", uploadedFileObjects.map(f => ({
        name: f.name,
        status: 'uploaded_pending_analysis'
      })))

      alert(`✅ Successfully uploaded ${uploadedFileObjects.length} file${uploadedFileObjects.length > 1 ? 's' : ''}!\n\n📋 Files ready for AI analysis:\n${uploadedFileObjects.map(f => `• ${f.name}`).join('\n')}\n\nClick "Train AI with Enhanced Profile" to analyze and proceed!`)

    } catch (error) {
      console.error("Error uploading files:", error)

      let errorMessage = "File upload failed"
      if (error instanceof Error) {
        errorMessage = `Upload error: ${error.message}`
      }

      alert(`⚠️ Upload failed: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`)

    } finally {
      setIsProcessing(false)
    }
  }

  // Fast-only CV analysis to prevent hanging
  const tryEnhancedCVAnalysis = async (files: File[], fileStartIndex: number) => {
    try {
      console.log("Using fast CV analysis to prevent timeouts...")
      
      // Use enhanced document analysis instead of basic
      const enhancedFormData = new FormData()
      files.forEach(file => enhancedFormData.append('files', file))
      enhancedFormData.append('targetLanguage', 'en')
      
      const enhancedResponse = await fetch('/api/analyze-document-enhanced', {
        method: 'POST',
        body: enhancedFormData,
        signal: AbortSignal.timeout(3000) // Very quick timeout to prevent hanging
      })
      
      if (enhancedResponse.ok) {
        const enhancedResult = await enhancedResponse.json()
        if (enhancedResult.success && enhancedResult.analyses) {
          console.log("✅ Enhanced CV analysis successful - chronological experience extracted")
          updateFilesWithAnalysis(enhancedResult.analyses, files, fileStartIndex, 'enhanced_chronological')
          return
        }
      }
      
      console.log("Enhanced analysis failed, using fast fallback...")
      // Fallback to fast document processing
      const fastFormData = new FormData()
      files.forEach(file => fastFormData.append('files', file))
      
      const fastResponse = await fetch('/api/fast-document', {
        method: 'POST',
        body: fastFormData,
        signal: AbortSignal.timeout(2000) // 2 seconds max
      })

      if (fastResponse.ok) {
        const fastResult = await fastResponse.json()
        if (fastResult.success && fastResult.analyses) {
          console.log("✅ Fast analysis successful")
          updateFilesWithAnalysis(fastResult.analyses, files, fileStartIndex, 'fast_analysis')
          // Skip slow intelligent summary creation for now
          return
        }
      }
      
      // If even fast analysis fails, use instant local processing
      console.log("Using instant local processing...")
      const instantAnalyses = files.map((file, index) => ({
        documentType: 'cv_resume',
        summary: `${file.name} processed instantly. Ready for interview preparation.`,
        extractedSkills: ['Professional Experience', 'Technical Skills', 'Communication'],
        keyAchievements: ['Document uploaded successfully', 'Ready for interview responses'],
        experienceDetails: {
          totalYears: 'Professional experience',
          workHistory: []
        },
        processingMethod: 'instant_local'
      }))
      
      updateFilesWithAnalysis(instantAnalyses, files, fileStartIndex, 'instant_local')
    } catch (error) {
      console.log("All CV analysis methods failed (this is okay, using instant processing):", error)
    }
  }

  // Helper function to update files with analysis results
  const updateFilesWithAnalysis = (analyses: any[], files: File[], fileStartIndex: number, method: string) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev]
      files.forEach((file, index) => {
        const fileIndex = fileStartIndex + index
        if (newFiles[fileIndex] && analyses[index]) {
          const analysis = analyses[index]
          newFiles[fileIndex] = Object.assign(newFiles[fileIndex], {
            analysis: {
              ...newFiles[fileIndex].analysis,
              summary: analysis.summary || newFiles[fileIndex].analysis?.summary,
              extractedSkills: analysis.extractedSkills || newFiles[fileIndex].analysis?.extractedSkills,
              experienceYears: analysis.experienceDetails?.totalYears || newFiles[fileIndex].analysis?.experienceYears,
              keyAchievements: analysis.keyAchievements || newFiles[fileIndex].analysis?.keyAchievements,
              workHistory: analysis.experienceDetails?.workHistory || [],
              careerProgression: analysis.careerProgression || null,
              insights: [
                ...(newFiles[fileIndex].analysis?.insights || []),
                `📈 Enhanced with ${method} extraction`,
                `🏢 ${analysis.experienceDetails?.companies?.length || 0} companies identified`,
                `⏱️ ${analysis.experienceDetails?.totalYears || 'Experience'} total experience`
              ]
            },
            fullAnalysis: {
              ...newFiles[fileIndex].fullAnalysis,
              ...analysis,
              analysisMethod: method
            }
          })
        }
      })
      return newFiles
    })
  }

  // NEW: Create intelligent document summary for better organization
  const createIntelligentSummary = async (documentAnalyses: any[]) => {
    try {
      console.log("🧠 Creating intelligent summary for interview preparation...")
      
      const summaryResponse = await fetch('/api/intelligent-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentAnalyses,
          jobContext: jobDescription, // Use current job context
          targetLanguage: 'en'
        }),
        signal: AbortSignal.timeout(1500) // 1.5 seconds timeout to prevent hanging
      })

      if (summaryResponse.ok) {
        const summaryResult = await summaryResponse.json()
        if (summaryResult.success) {
          console.log("✅ Intelligent summary created successfully")
          
          // Store the intelligent summary for use in interview responses
          if (typeof window !== 'undefined') {
            localStorage.setItem("intelligentSummary", JSON.stringify(summaryResult.summary))
            localStorage.setItem("consolidationQuality", JSON.stringify(summaryResult.consolidationQuality))
            
            console.log("📊 Consolidation quality:", summaryResult.consolidationQuality)
          }
        }
      }
    } catch (error) {
      console.log("Intelligent summary creation failed (non-critical):", error)
    }
  }

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

  const handleQuickStart = async () => {
    console.log("Starting quick interview with preset profile")

    if (!jobTitle.trim()) {
      setFormErrors({ jobTitle: "Job title is required" })
      return
    }

    setIsLoading(true)
    setFormErrors({})

    try {
      if (typeof window === 'undefined') return

      const profile = localStorage.getItem("userProfile")
      if (profile) {
        const parsedProfile = JSON.parse(profile)
        localStorage.setItem("jobData", JSON.stringify({
          jobTitle,
          jobDescription: parsedProfile.description,
          uploadedFiles: parsedProfile.files.map((f: any) => f.name)
        }))

        localStorage.setItem("isQuickStart", "true")
      }

      router.push("/summary")
    } catch (error) {
      console.error("Error in quick start:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

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

  // UPDATED: Pass document analyses to profile analysis
  const handleFullSetup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      console.log("Form validation failed")
      return
    }

    if (userPoints < 5) {
      if (!isAuthenticated) {
        router.push("/auth")
      } else {
        router.push("/pricing")
      }
      return
    }

    setIsLoading(true)
    console.log("Setting up AI with enhanced data:", {
      jobTitle,
      jobDescription,
      uploadedFiles: uploadedFiles.length,
      documentsWithAnalysis: uploadedFiles.filter(f => f.fullAnalysis).length
    })

    try {
      // Deduct 5 points from IP-based system
      const response = await fetch('/api/ip-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct', points: 5 })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error("API returned non-JSON response:", response.headers.get('content-type'))
        throw new Error('API returned non-JSON response')
      }

      const data = await response.json()
      console.log("Points deducted:", data)

      if (data.error) {
        throw new Error(data.error)
      }

      const newPoints = data.points || userPoints - 5
      setUserPoints(newPoints)
      if (typeof window !== 'undefined') {
        localStorage.setItem("userPoints", newPoints.toString())
      }
    } catch (error) {
      console.error("Error deducting points:", error)
      // Fallback: subtract points locally
      const newPoints = Math.max(0, userPoints - 5)
      setUserPoints(newPoints)
      if (typeof window !== 'undefined') {
        localStorage.setItem("userPoints", newPoints.toString())
      }
    }

    // Store enhanced job data including document analyses
    if (typeof window !== 'undefined') {
      const documentAnalyses = uploadedFiles.map(f => f.fullAnalysis).filter(Boolean)

      localStorage.setItem("jobData", JSON.stringify({
        jobTitle,
        jobDescription,
        uploadedFiles: uploadedFiles.map(f => f.name),
        // NEW: Store document analyses for profile analysis
        documentAnalyses: documentAnalyses
      }))

      console.log("Stored job data with enhanced document analyses:", {
        files: uploadedFiles.length,
        analyses: documentAnalyses.length
      })
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
                        handleContextChange(e.target.value)
                      }}
                      required
                      className={`min-h-32 text-base ${formErrors.jobDescription ? 'border-red-500' : ''}`}
                    />
                    {formErrors.jobDescription && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.jobDescription}</p>
                    )}

                    {/* Context analysis removed - will analyze only when proceeding to next page */}
                  </div>

                  {/* Enhanced File Upload */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-medium">
                      📎 Upload Supporting Documents (CV, Cover Letter, Job Description):
                    </Label>
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden ${isProcessing
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
                            {processingStatus || "🚀 Smart processing your documents..."}
                          </div>
                          <div className="text-green-600 text-sm">
                            {processingStatus.includes("Processing") 
                              ? "Instant smart analysis extracting skills and experience"
                              : "Lightning-fast document processing in progress"
                            }
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
                              Supported: PDF, DOC, DOCX, TXT (Max 25MB each) | <strong>⚡ Files will be analyzed when you proceed to the next step</strong>
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

                    {/* Minimalist Uploaded Files Display */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                          📄 Files Uploaded ({uploadedFiles.length})
                        </h4>
                        
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate block">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                              </div>
                            </div>
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1"
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
                          🚀 Train AI with Your Enhanced Profile
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
                <h3 className="font-semibold mb-2 text-lg">Enhanced CV Analysis</h3>
                <p className="text-sm text-white/90">
                  AI extracts skills, experience, and achievements from your documents for personalized responses
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-white/30 dark:border-gray-700/30 text-white hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Real Examples</h3>
                <p className="text-sm text-white/90">
                  AI uses your actual companies, projects, and achievements in interview responses
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}