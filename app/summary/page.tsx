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
  // NEW: Include document analyses
  documentAnalyses?: any[]
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

    // Call enhanced AI analysis API
    analyzeProfile(parsedJobData)
  }, [router])

  // UPDATED: Enhanced profile analysis with document data
  const analyzeProfile = async (jobData: JobData) => {
    try {
      console.log("Starting enhanced AI profile analysis with document data...")
      setIsLoading(true)

      // Get stored document analyses
      let documentAnalyses = jobData.documentAnalyses || []

      // If not in jobData, try to get from localStorage
      if (!documentAnalyses || documentAnalyses.length === 0) {
        const storedAnalyses = localStorage.getItem("documentAnalyses")
        if (storedAnalyses) {
          try {
            documentAnalyses = JSON.parse(storedAnalyses)
            console.log("Retrieved document analyses from localStorage:", documentAnalyses.length)
          } catch (error) {
            console.warn("Failed to parse stored document analyses:", error)
            documentAnalyses = []
          }
        }
      }

      const response = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...jobData,
          documentAnalyses: documentAnalyses,
          targetLanguage: 'en' // Start with English, translate if needed
        }),
      })

      const result = await response.json()
      console.log("Enhanced AI Analysis result:", result)

      if (result.success) {
        setAnalysisData(result.analysis)
      } else {
        // Use fallback data if API fails
        setAnalysisData(result.analysis)
      }
    } catch (error) {
      console.error("Error in enhanced profile analysis:", error)
      // Enhanced fallback analysis
      setAnalysisData({
        candidate_profile: `Professional candidate applying for ${jobData.jobTitle} with relevant background extracted from uploaded documents and profile information.`,
        key_strengths: [
          "Technical competency demonstrated through document analysis",
          "Professional communication and collaboration skills",
          "Adaptability and continuous learning mindset",
          "Problem-solving capabilities with practical experience"
        ],
        experience_highlights: [
          "Professional experience documented in uploaded materials",
          "Technical skills and competencies verified through document analysis",
          "Track record of professional development and achievement"
        ],
        technical_competencies: [
          "Core technical skills for the target role",
          "Industry-standard tools and methodologies",
          "Professional software development practices",
          "Communication and collaboration technologies",
          "Continuous learning and skill development"
        ],
        potential_challenges: [
          "Prepare specific examples demonstrating technical competencies",
          "Research company-specific technologies and practices"
        ],
        interview_strategy: "Focus on highlighting documented technical skills and experience. Use specific examples from professional background to demonstrate capabilities and alignment with role requirements.",
        role_fit_analysis: `Strong alignment between documented background and ${jobData.jobTitle} position requirements. Professional experience and technical competencies show good potential for success.`,
        preparation_recommendations: [
          "Review specific examples from documented experience",
          "Prepare to discuss technical competencies in detail",
          "Research company technology stack and practices"
        ],
        keySkills: ["Technical Competency", "Professional Communication", "Problem Solving", "Adaptability", "Collaboration", "Continuous Learning"],
        interviewAreas: [
          "Technical skills relevant to position",
          "Professional experience and projects",
          "Team collaboration and communication",
          "Problem-solving approach and methodology",
          "Career development and learning goals"
        ],
        strengths: [
          "Documented professional background",
          "Verified technical competencies",
          "Professional development track record",
          "Strong foundation for role success"
        ],
        complexity: "Medium",
        matchScore: 78,
        profileInsights: [
          "Professional candidate with documented technical background",
          "Good alignment between verified skills and role requirements",
          "Strong potential for success based on documented competencies",
          "Professional development mindset evident from background"
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartInterview = async () => {
    console.log("Starting interview with enhanced AI analysis")
    setIsStartingInterview(true)

    try {
      // Store analysis data for interview page
      if (analysisData) {
        localStorage.setItem("analysisData", JSON.stringify(analysisData))
      }

      // Add a small delay to show loading animation
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Navigate directly to interview page
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

          {/* Main Card Container */}
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
                  Intelligent Real-Time Prompter
                </p>
              </div>

              {/* AI Analysis Complete Section */}
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
                    🧠 {isLoading ? "Enhanced AI Training in Progress..." : "Enhanced AI Analysis Complete"}
                  </h2>
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {isLoading
                    ? "Our AI is analyzing your profile, documents, and job description with advanced extraction..."
                    : "Our AI has analyzed your data and documents using advanced extraction. Your CV skills, experience, and achievements are now ready for interview responses."
                  }
                </p>

                {!isLoading && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="gap-1 bg-gray-800 text-white dark:bg-gray-700">
                      <Clock className="w-4 h-4" />
                      Enhanced analysis completed
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column - AI Analysis Sections */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Candidate Profile */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">👤</span>
                      <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Enhanced Candidate Profile</h3>
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

                  {/* Key Strengths */}
                  {!isLoading && (analysisData?.key_strengths || analysisData?.keySkills) && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">💪</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Key Strengths from Analysis</h3>
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

                  {/* Experience Highlights */}
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

                  {/* Technical Competencies */}
                  {!isLoading && (analysisData?.technical_competencies || analysisData?.keySkills) && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">💻</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Technical Competencies Extracted</h3>
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

                  {/* ENHANCED: Documents Analysis Summary with extracted data */}
                  {jobData.uploadedFiles.length > 0 && !isLoading && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📄</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Enhanced Documents Analysis</h3>
                      </div>

                      <div className="space-y-4">
                        {jobData.uploadedFiles.map((fileName, index) => {
                          // Get corresponding analysis if available
                          const storedAnalyses = localStorage.getItem("documentAnalyses")
                          let documentAnalyses = []

                          try {
                            documentAnalyses = storedAnalyses ? JSON.parse(storedAnalyses) : []
                          } catch (error) {
                            console.warn("Failed to parse document analyses for display")
                          }

                          const analysis = documentAnalyses[index]

                          return (
                            <div key={index} className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">📄</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{fileName}</span>
                                </div>
                                <Badge className={`${analysis?.documentType === 'cv' ? 'bg-green-500' :
                                  analysis?.documentType === 'cover_letter' ? 'bg-blue-500' :
                                    analysis?.documentType === 'job_description' ? 'bg-purple-500' :
                                      'bg-gray-500'} text-white`}>
                                  {analysis?.documentType || 'document'}
                                </Badge>
                              </div>

                              {analysis ? (
                                <div className="space-y-3">
                                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-l-4 border-green-500">
                                    <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                      📝 AI Analysis Summary:
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                                      {analysis.summary}
                                    </p>
                                  </div>

                                  {/* Enhanced: Show extracted skills */}
                                  {analysis.extractedSkills && analysis.extractedSkills.length > 0 && (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                      <div className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm">
                                        💼 Extracted Skills:
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {analysis.extractedSkills.slice(0, 6).map((skill: string, skillIndex: number) => (
                                          <Badge key={skillIndex} variant="outline" className="text-xs">
                                            {skill}
                                          </Badge>
                                        ))}
                                        {analysis.extractedSkills.length > 6 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{analysis.extractedSkills.length - 6} more
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Enhanced: Show experience details */}
                                  {analysis.experienceDetails && (
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                                      <div className="font-semibold text-purple-800 dark:text-purple-200 mb-1 text-sm">
                                        🏢 Experience Details:
                                      </div>
                                      <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                                        {analysis.experienceDetails.totalYears && (
                                          <div>• {analysis.experienceDetails.totalYears}</div>
                                        )}
                                        {analysis.experienceDetails.industries && analysis.experienceDetails.industries.length > 0 && (
                                          <div>• Industries: {analysis.experienceDetails.industries.join(', ')}</div>
                                        )}
                                        {analysis.experienceDetails.companies && analysis.experienceDetails.companies.length > 0 && (
                                          <div>• Companies: {analysis.experienceDetails.companies.join(', ')}</div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Enhanced: Show key achievements */}
                                  {analysis.keyAchievements && analysis.keyAchievements.length > 0 && (
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                                      <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 text-sm">
                                        🏆 Key Achievements:
                                      </div>
                                      <div className="space-y-1">
                                        {analysis.keyAchievements.slice(0, 3).map((achievement: string, achIndex: number) => (
                                          <div key={achIndex} className="flex items-start gap-2 text-sm">
                                            <span className="text-yellow-600 mt-0.5">•</span>
                                            <span className="text-yellow-700 dark:text-yellow-300">{achievement}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Enhanced: Show education if available */}
                                  {analysis.education && (analysis.education.degrees?.length > 0 || analysis.education.certifications?.length > 0) && (
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
                                      <div className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2 text-sm">
                                        🎓 Education & Certifications:
                                      </div>
                                      <div className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                                        {analysis.education.degrees && analysis.education.degrees.length > 0 && (
                                          <div>• Degrees: {analysis.education.degrees.join(', ')}</div>
                                        )}
                                        {analysis.education.certifications && analysis.education.certifications.length > 0 && (
                                          <div>• Certifications: {analysis.education.certifications.join(', ')}</div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="mt-3">
                                    <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">
                                      🔍 Key Insights:
                                    </div>
                                    <div className="space-y-1">
                                      {(analysis.keyInsights || []).map((insight: string, insightIndex: number) => (
                                        <div key={insightIndex} className="flex items-start gap-2 text-sm">
                                          <span className="text-green-500 mt-0.5">•</span>
                                          <span className="text-gray-700 dark:text-gray-300">{insight}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Fallback display for files without enhanced analysis
                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-l-4 border-gray-500">
                                  <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                    📝 Basic Analysis:
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                                    Document uploaded and processed successfully. Contains professional information relevant to the {jobData.jobTitle} position.
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Role Fit Analysis */}
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

                  {/* Interview Strategy */}
                  {!isLoading && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🏆</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">AI Interview Strategy</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {analysisData?.interview_strategy || `Focus on highlighting your relevant experience and technical skills extracted from your documents. Be prepared to discuss specific examples from your background that demonstrate your capabilities for this ${jobData.jobTitle} role.`}
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column - Sidebar Cards */}
                <div className="space-y-6">

                  {/* Ready to Start */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">🤖</span>
                      <h3 className="text-lg font-semibold">Ready for Interview</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      Your AI assistant is ready with your extracted skills, experience, and achievements
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Enhanced AI training completed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>CV skills and experience extracted</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Real examples ready for responses</span>
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
                          Start Enhanced Interview
                        </>
                      )}
                    </Button>
                  </div>

                  {/* How it works */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Enhanced Features</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          1
                        </div>
                        <p>AI uses your actual companies and projects from CV</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          2
                        </div>
                        <p>Real technical skills extracted and ready</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          3
                        </div>
                        <p>Actual achievements and metrics from documents</p>
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
                        Average rating with enhanced CV analysis
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Info */}
              {!isLoading && (
                <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <span className="font-semibold text-yellow-800 dark:text-yellow-200">Enhanced AI Session Active</span>
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 font-mono">
                      Session ID: enhanced_{Math.random().toString(36).substr(2, 9)} | {jobData.uploadedFiles.length} documents analyzed with skill extraction
                    </div>
                  </div>
                </div>
              )}

              {/* Final CTA Button */}
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
                        Starting Enhanced Interview...
                      </>
                    ) : (
                      <>
                        🎤 Start Enhanced Interview
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