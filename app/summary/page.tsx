"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CheckCircle, 
  Brain, 
  FileText, 
  Target, 
  Users, 
  ArrowRight,
  Clock,
  Star,
  Loader2
} from "lucide-react"
import Header from "@/components/header"

interface JobData {
  jobTitle: string
  jobDescription: string
  uploadedFiles: string[]
}

interface AnalysisData {
  // New comprehensive analysis fields from upgraded API
  candidate_profile?: string
  key_strengths?: string[]
  experience_highlights?: string[]
  technical_competencies?: string[]
  potential_challenges?: string[]
  interview_strategy?: string
  role_fit_analysis?: string
  preparation_recommendations?: string[]
  
  // Legacy fields for backwards compatibility
  keySkills: string[]
  interviewAreas: string[]
  strengths: string[]
  complexity: string
  matchScore: number
  profileInsights: string[]
}

export default function SummaryPage() {
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isStartingInterview, setIsStartingInterview] = useState(false)
  const router = useRouter()

  console.log("Summary page rendered, jobData:", jobData, "analysisData:", analysisData)

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated")
    const data = localStorage.getItem("jobData")
    
    console.log("Summary auth check:", { auth, data })
    
    if (!data) {
      router.push("/")
      return
    }
    
    setIsAuthenticated(true)
    const parsedJobData = JSON.parse(data)
    setJobData(parsedJobData)
    
    // Call AI analysis API
    analyzeProfile(parsedJobData)
  }, [router])

  const analyzeProfile = async (jobData: JobData) => {
    try {
      console.log("Starting AI profile analysis...")
      setIsLoading(true)

      const response = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      })

      const result = await response.json()
      console.log("AI Analysis result:", result)

      if (result.success) {
        setAnalysisData(result.analysis)
      } else {
        // Use fallback data if API fails
        setAnalysisData(result.analysis)
      }
    } catch (error) {
      console.error("Error analyzing profile:", error)
      // Fallback analysis
      setAnalysisData({
        keySkills: ["Problem Solving", "Communication", "Adaptability", "Time Management"],
        interviewAreas: [
          `Skills for ${jobData.jobTitle}`,
          "Professional experience",
          "Team collaboration",
          "Priority management",
          "Career objectives"
        ],
        strengths: [
          "Detailed profile provided",
          "Motivation for position",
          "Professional background",
          "Transferable skills"
        ],
        complexity: "Medium",
        matchScore: 75,
        profileInsights: [
          "Candidate with interesting profile",
          "Background aligned with position",
          "Good skills identified",
          "Growth potential"
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartInterview = async () => {
    console.log("Starting interview with AI analysis")
    setIsStartingInterview(true)
    
    try {
      // Store analysis data for interview page
      if (analysisData) {
        localStorage.setItem("analysisData", JSON.stringify(analysisData))
      }
      
      // Add a small delay to show loading animation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Navigate directly to interview page (no language selection)
      router.push("/interview")
    } catch (error) {
      console.error("Error starting interview:", error)
      setIsStartingInterview(false)
    }
  }

  if (!isAuthenticated || !jobData) {
    return null
  }

  const getJobHighlights = () => {
    const description = jobData.jobDescription
    const wordCount = description.split(' ').length
    const hasExperience = description.toLowerCase().includes('esperienza') || description.toLowerCase().includes('experience')
    const hasSkills = description.toLowerCase().includes('competenze') || description.toLowerCase().includes('skills')
    
    return {
      wordCount,
      hasExperience,
      hasSkills,
      complexity: analysisData?.complexity || (wordCount > 50 ? 'High' : wordCount > 20 ? 'Medium' : 'Basic')
    }
  }

  const jobHighlights = getJobHighlights()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea] dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Main Card Container - styled like old app */}
          <Card className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/30">
            <CardContent className="p-8">
              
              {/* Hero Section - styled like old app */}
              <div className="text-center space-y-6 mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                  PassInterview.AI
                </h1>
                
                <div className="inline-flex items-center bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  🤖 AI Responds As You Based on Your Background
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Intelligent Real-Time Prompter
                </p>
              </div>

              {/* AI Analysis Complete Section - styled like old app */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    🧠 {isLoading ? "AI Training in Progress..." : "AI Analysis Complete"}
                  </h2>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {isLoading 
                    ? "Our AI is analyzing your profile and job description..."
                    : "Our AI has analyzed your data and job description. Here's what it learned about you and the position."
                  }
                </p>
                
                {!isLoading && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="gap-1 bg-gray-800 text-white dark:bg-gray-700">
                      <Clock className="w-4 h-4" />
                      Analysis completed
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                
                {/* Left Column - AI Analysis Sections styled like old app */}
                <div className="lg:col-span-2 space-y-6">
              
                  {/* Candidate Profile - styled like old app */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">👤</span>
                      <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Candidate Profile</h3>
                    </div>
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ) : (
                        <>
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {analysisData?.candidate_profile || analysisData?.profileInsights?.[0] || `Experienced professional applying for ${jobData.jobTitle} with a strong background in relevant technologies and skills.`}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Key Strengths - styled like old app */}
                  {!isLoading && (analysisData?.key_strengths || analysisData?.keySkills) && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">💪</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Key Strengths</h3>
                      </div>
                      <div className="space-y-3">
                        {(analysisData.key_strengths || analysisData.keySkills || []).slice(0, 4).map((strength, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience Highlights - styled like old app */}
                  {!isLoading && (analysisData?.experience_highlights || analysisData?.profileInsights) && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">💼</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Experience Highlights</h3>
                      </div>
                      <div className="space-y-3">
                        {(analysisData.experience_highlights || analysisData.profileInsights || []).slice(0, 3).map((highlight, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Competencies - styled like old app */}
                  {!isLoading && (analysisData?.technical_competencies || analysisData?.keySkills) && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">💻</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Technical Competencies</h3>
                      </div>
                      <div className="space-y-3">
                        {(analysisData.technical_competencies || analysisData.keySkills || []).map((skill, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700 dark:text-gray-300">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Role Fit Analysis - styled like old app */}
                  {!isLoading && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🎯</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Role Fit Analysis</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {analysisData?.role_fit_analysis || `The candidate's background aligns well with the ${jobData.jobTitle} position. Their experience and skills show a ${analysisData?.matchScore || 75}% compatibility with the role requirements, demonstrating strong potential for success.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Interview Strategy - styled like old app */}
                  {!isLoading && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🏆</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Interview Strategy</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {analysisData?.interview_strategy || `Focus on highlighting your relevant experience and technical skills. Be prepared to discuss specific examples from your background that demonstrate your capabilities for this ${jobData.jobTitle} role.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Potential Challenges - styled like old app */}
                  {!isLoading && (analysisData?.potential_challenges || true) && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">⚠️</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Potential Challenges</h3>
                      </div>
                      <div className="space-y-3">
                        {(analysisData?.potential_challenges || [
                          "Be ready to provide specific examples of your achievements",
                          "Prepare to discuss how your experience applies to this role"
                        ]).map((challenge, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700 dark:text-gray-300">{challenge}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preparation Recommendations - styled like old app */}
                  {!isLoading && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📚</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Preparation Recommendations</h3>
                      </div>
                      <div className="space-y-3">
                        {(analysisData?.interviewAreas || []).slice(0, 3).map((area, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700 dark:text-gray-300">Review your experience in {area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Documents Analysis Summary - styled like old app */}
                  {jobData.uploadedFiles.length > 0 && !isLoading && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📄</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Documents Analysis Summary</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {jobData.uploadedFiles.map((fileName, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📄</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{fileName}</span>
                              </div>
                              <Badge className="bg-green-500 text-white">
                                CV/resume|job_description|cover_letter|other
                              </Badge>
                            </div>
                            
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-l-4 border-green-500">
                              <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                📝 Summary:
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">
                                This document contains relevant professional information, skills, and experience that align with the {jobData.jobTitle} position requirements.
                              </p>
                            </div>
                            
                            <div className="mt-3">
                              <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">
                                🔍 Key Insights:
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-start gap-2 text-sm">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span className="text-gray-700 dark:text-gray-300">Professional background matches role requirements</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span className="text-gray-700 dark:text-gray-300">Relevant skills and competencies identified</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column - Sidebar Cards styled like old app */}
                <div className="space-y-6">
                  
                  {/* Ready to Start */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">🤖</span>
                      <h3 className="text-lg font-semibold">Ready for Interview</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      Your AI assistant is ready to support you during the real interview
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>AI training completed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Personalized responses generated</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Candidate profile analyzed</span>
                      </div>
                    </div>
                    
                    <Button 
                      size="lg" 
                      className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleStartInterview}
                      disabled={isLoading || isStartingInterview}
                    >
                      {isStartingInterview ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Starting Interview...
                        </>
                      ) : isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Start Interview
                        </>
                      )}
                    </Button>
                  </div>

                  {/* How it works */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">How it works</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          1
                        </div>
                        <p>Activate live mode in the assistant</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          2
                        </div>
                        <p>AI will listen to interviewer's questions</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          3
                        </div>
                        <p>Receive personalized suggestions (1 point per response)</p>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-3xl font-bold">4.9</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Average rating of our AI assistance
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Info - styled like old app */}
              {!isLoading && (
                <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <span className="font-semibold text-yellow-800 dark:text-yellow-200">AI Session Active</span>
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 font-mono">
                      Session ID: session_{Math.random().toString(36).substr(2, 9)} | {jobData.uploadedFiles.length} documents analyzed
                    </div>
                  </div>
                </div>
              )}

              {/* Final CTA Button - styled like old app */}
              {!isLoading && (
                <div className="mt-8 text-center">
                  <Button 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={handleStartInterview}
                    disabled={isStartingInterview}
                  >
                    {isStartingInterview ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Starting Interview...
                      </>
                    ) : (
                      <>
                        🎤 Start Interview
                      </>
                    )}
                  </Button>
                </div>
              )}


            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}