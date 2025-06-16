"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Upload, 
  FileText, 
  Loader2,
  Target,
  FileImage,
  Brain
} from "lucide-react"

interface TextAnalysis {
  score: number
  confidence: number
  suggestions: string[]
  strengths: string[]
}

interface DocumentAnalysis {
  type: string
  summary: string
  keyInsights: string[]
  fileInfo: {
    charactersExtracted: number
  }
}

export default function ProfilePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userPoints, setUserPoints] = useState(30)
  const [interviewType, setInterviewType] = useState("")
  const [description, setDescription] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  
  // AI Analysis states
  const [isAnalyzingText, setIsAnalyzingText] = useState(false)
  const [textAnalysis, setTextAnalysis] = useState<TextAnalysis | null>(null)
  const [isImprovingText, setIsImprovingText] = useState(false)
  const [analyzingDocuments, setAnalyzingDocuments] = useState(new Set<string>())
  const [documentAnalyses, setDocumentAnalyses] = useState<Record<string, DocumentAnalysis>>({})
  
  const router = useRouter()
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated") === "true"
    const points = parseInt(localStorage.getItem("userPoints") || "30")
    const savedProfile = localStorage.getItem("userProfile")
    
    setIsAuthenticated(auth)
    setUserPoints(points)
    
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile)
        setDescription(profile.description || "")
        setInterviewType(profile.interviewType || "")
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }
  }, [])

  const analyzeText = async (text: string) => {
    if (text.trim().length < 10) return
    
    setIsAnalyzingText(true)
    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      if (response.ok) {
        const analysis = await response.json()
        setTextAnalysis(analysis)
        console.log("Text analysis completed:", analysis)
      }
    } catch (error) {
      console.error("Text analysis error:", error)
    } finally {
      setIsAnalyzingText(false)
    }
  }

  const improveText = async () => {
    if (!description.trim()) return
    
    setIsImprovingText(true)
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description })
      })
      
      if (response.ok) {
        const result = await response.json()
        setDescription(result.improvedText)
        setHasChanges(true)
        
        // Re-analyze the improved text
        setTimeout(() => analyzeText(result.improvedText), 500)
      }
    } catch (error) {
      console.error("Text improvement error:", error)
    } finally {
      setIsImprovingText(false)
    }
  }

  const analyzeDocument = async (file: File) => {
    const fileId = `${file.name}-${file.size}`
    setAnalyzingDocuments(prev => new Set([...Array.from(prev), fileId]))
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const analysis = await response.json()
        setDocumentAnalyses(prev => ({
          ...prev,
          [fileId]: analysis
        }))
        console.log("Document analysis completed:", analysis)
      }
    } catch (error) {
      console.error("Document analysis error:", error)
    } finally {
      setAnalyzingDocuments(prev => {
        const newArray = Array.from(prev).filter(id => id !== fileId)
        return new Set(newArray)
      })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    console.log("Files uploaded:", files.map(f => f.name))
    setUploadedFiles(prev => [...prev, ...files])
    setHasChanges(true)

    // Analyze each uploaded file
    files.forEach(file => analyzeDocument(file))
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    setHasChanges(true)
  }

  const handleDescriptionBlur = () => {
    if (description.trim() && description.trim().length >= 10) {
      analyzeText(description)
    }
  }

  const handleTrainAI = () => {
    if (userPoints < 5) {
      alert("Non hai abbastanza punti! Servono 5 punti per addestrare l'AI.")
      router.push("/pricing")
      return
    }

    console.log("Training AI with profile:", { interviewType, description, files: uploadedFiles.length })
    setSaveStatus('saving')
    
    // Simulate save delay
    setTimeout(() => {
      // Deduct 5 points
      const newPoints = userPoints - 5
      setUserPoints(newPoints)
      localStorage.setItem("userPoints", newPoints.toString())
      
      // Save profile
      const profileData = {
        interviewType,
        description,
        files: uploadedFiles.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })),
        savedAt: new Date().toISOString()
      }
      
      localStorage.setItem("userProfile", JSON.stringify(profileData))
      
      setHasChanges(false)
      setSaveStatus('saved')
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    }, 1500)
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-purple-600">PassInterview.AI</h1>
          
          <Badge 
            variant="secondary" 
            className="bg-red-500 text-white px-4 py-2 text-sm font-medium"
          >
            🤖 AI Responds As You Based on Your Background
          </Badge>
          
          <p className="text-gray-600 text-lg">Intelligent Real-Time Prompter</p>
          
          <h2 className="text-2xl font-bold text-gray-800 mt-6">
            Train Your AI Interview Avatar
          </h2>
        </div>

        <div className="space-y-6">
          
          {/* Interview Type */}
          <div className="space-y-3">
            <Label htmlFor="interviewType" className="text-base font-medium text-gray-700 flex items-center gap-2">
              🎯 Interview Type:
            </Label>
            <Input
              id="interviewType"
              placeholder="e.g. Senior Software Engineer at Google, Marketing Manager at Meta"
              value={interviewType}
              onChange={(e) => {
                setInterviewType(e.target.value)
                setHasChanges(true)
              }}
              className="text-gray-600 border-gray-200 focus:border-purple-500"
            />
          </div>

          {/* Detailed Context */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium text-gray-700 flex items-center gap-2">
              📝 Detailed Context:
            </Label>
            <Textarea
              ref={descriptionRef}
              id="description"
              placeholder="Describe the role, company, required skills, your background, expected challenges, company culture, etc. Be as detailed as possible - AI will analyze everything to provide personalized responses."
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              onBlur={handleDescriptionBlur}
              className="min-h-32 text-gray-600 border-gray-200 focus:border-purple-500 resize-none"
            />
            
            {/* AI Analysis Status */}
            {isAnalyzingText && (
              <div className="flex items-center gap-2 text-sm text-purple-600 p-3 bg-purple-50 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                🧠 AI is analyzing your context...
              </div>
            )}
            
            {/* Text Analysis Results */}
            {textAnalysis && !isAnalyzingText && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-medium">
                      ✅ AI Analysis Complete (Confidence: {textAnalysis.confidence}%)
                    </span>
                  </div>
                </div>
                
                {textAnalysis.suggestions.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">💡 AI Suggestions:</span>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-700">
                      {textAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-700 flex items-center gap-2">
              📎 Upload Supporting Documents (CV, Cover Letter, Job Description):
            </Label>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
              onClick={() => document.getElementById('fileUpload')?.click()}
            >
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-600 font-medium">Click to upload or drag and drop files here</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supported: PDF, DOC, DOCX, TXT (Max 10MB each) | AI will analyze content automatically
                  </p>
                </div>
              </div>
              
              <input
                type="file"
                id="fileUpload"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => {
                  const fileId = `${file.name}-${file.size}`
                  const isAnalyzing = analyzingDocuments.has(fileId)
                  const analysis = documentAnalyses[fileId]

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-800">{file.name}</span>
                        {analysis && <Brain className="w-4 h-4 text-pink-500" />}
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-3">
                        {(file.size / 1024).toFixed(1)} KB
                        {analysis && ` • ${analysis.fileInfo?.charactersExtracted || 0} characters extracted`}
                      </p>

                      {isAnalyzing && (
                        <div className="flex items-center gap-2 text-sm text-purple-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          🧠 AI is analyzing document...
                        </div>
                      )}

                      {analysis && !isAnalyzing && (
                        <div className="bg-white border border-purple-100 rounded-lg p-3">
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-purple-800">Type:</span>
                              <span className="ml-2 text-gray-700">{analysis.type}</span>
                            </div>
                            <div>
                              <span className="font-medium text-purple-800">Summary:</span>
                              <p className="mt-1 text-gray-700">{analysis.summary}</p>
                            </div>
                            <div>
                              <span className="font-medium text-purple-800">Key Insights:</span>
                              <ul className="mt-1 space-y-1">
                                {analysis.keyInsights.map((insight, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                                    <span className="text-purple-500">•</span>
                                    {insight}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Train Button */}
          <div className="pt-6">
            <Button 
              onClick={handleTrainAI}
              disabled={!hasChanges || saveStatus === 'saving' || userPoints < 5 || !interviewType.trim() || !description.trim()}
              className="w-full bg-gray-400 hover:bg-gray-500 text-white py-3 px-6 rounded-xl text-lg font-medium transition-colors"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Training AI...
                </>
              ) : (
                <>
                  🎯 Train AI with Your Profile
                </>
              )}
            </Button>
            
            {userPoints < 5 && (
              <p className="text-center text-red-500 text-sm mt-2">
                Insufficient points. Need 5 points to train AI.
              </p>
            )}
            
            {saveStatus === 'saved' && (
              <p className="text-center text-green-600 text-sm mt-2">
                ✅ AI Avatar trained successfully!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}