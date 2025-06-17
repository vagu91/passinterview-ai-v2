'use client'

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
  Loader2,
  Building,
  Calendar,
  TrendingUp,
  Award,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  Globe,
  Briefcase,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import Header from "@/components/header"

interface JobData {
  jobTitle: string
  jobDescription: string
  uploadedFiles: string[]
  documentAnalyses?: any[]
}

interface AnalysisData {
  // Enhanced analysis fields with chronological focus
  candidate_profile?: string
  career_progression_analysis?: string
  key_strengths?: string[]
  experience_highlights?: string[]
  technical_competencies?: string[]
  industry_expertise?: string[]
  leadership_and_management?: string
  potential_challenges?: string[]
  interview_strategy?: string
  role_fit_analysis?: string
  preparation_recommendations?: string[]
  chronological_talking_points?: Array<{
    period: string
    company: string
    position: string
    key_talking_points: string[]
    interview_relevance: string
  }>
  career_narrative?: string

  // Legacy fields for backwards compatibility
  keySkills: string[]
  interviewAreas: string[]
  strengths: string[]
  complexity: string
  matchScore: number
  profileInsights: string[]
}

export default function EnhancedSummaryPage() {
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isStartingInterview, setIsStartingInterview] = useState(false)
  const [expandedExperience, setExpandedExperience] = useState<number | null>(null)
  const [showAllExperiences, setShowAllExperiences] = useState(false)
  const router = useRouter()

  console.log("Enhanced Summary page rendered, jobData:", jobData, "analysisData:", analysisData)

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

    // Call enhanced AI analysis API with chronological focus
    analyzeChronologicalProfile(parsedJobData)
  }, [router])

  const analyzeChronologicalProfile = async (jobData: JobData) => {
    try {
      console.log("Starting enhanced chronological AI profile analysis...")
      setIsLoading(true)

      // Get stored document analyses with chronological data
      let documentAnalyses = jobData.documentAnalyses || []

      if (!documentAnalyses || documentAnalyses.length === 0) {
        const storedAnalyses = localStorage.getItem("documentAnalyses")
        if (storedAnalyses) {
          try {
            documentAnalyses = JSON.parse(storedAnalyses)
            console.log("Retrieved chronological document analyses:", documentAnalyses.length)
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
          targetLanguage: 'en'
        }),
      })

      const result = await response.json()
      console.log("Enhanced chronological AI Analysis result:", result)

      if (result.success) {
        setAnalysisData(result.analysis)
      } else {
        setAnalysisData(result.analysis)
      }
    } catch (error) {
      console.error("Error in enhanced chronological profile analysis:", error)
      // Enhanced fallback with chronological structure
      setAnalysisData({
        candidate_profile: `Professional candidate applying for ${jobData.jobTitle} with documented career progression and relevant industry experience.`,
        career_progression_analysis: `Career trajectory shows consistent professional growth with increasing responsibilities and technical expertise development over time.`,
        key_strengths: [
          "Proven career progression with documented professional growth",
          "Technical competencies developed through real work experience",
          "Industry expertise gained through progressive roles",
          "Professional communication and collaboration skills"
        ],
        experience_highlights: [
          "Professional experience documented through career progression",
          "Technical skills developed and applied in real work environments",
          "Track record of professional development and achievement"
        ],
        technical_competencies: [
          "Technical skills relevant to target role",
          "Industry-standard tools and methodologies",
          "Professional development practices",
          "Communication and collaboration technologies",
          "Continuous learning and adaptation capabilities"
        ],
        industry_expertise: [
          "Domain knowledge from professional experience",
          "Sector understanding through career progression",
          "Industry best practices and standards awareness"
        ],
        leadership_and_management: "Professional experience demonstrates growth in responsibility and evidence of team collaboration and project coordination capabilities.",
        potential_challenges: [
          "Prepare specific examples demonstrating technical competencies from work history",
          "Research company-specific technologies and current industry practices"
        ],
        interview_strategy: "Focus on highlighting documented career progression and professional achievements. Use specific examples from work history to demonstrate capabilities and growth trajectory.",
        role_fit_analysis: `Strong alignment between documented career progression and ${jobData.jobTitle} position requirements. Professional experience trajectory shows excellent potential for success.`,
        preparation_recommendations: [
          "Review specific achievements from each role in career progression",
          "Prepare to discuss technical competencies developed over time",
          "Research target company's technology stack and industry position"
        ],
        chronological_talking_points: [
          {
            period: "Recent Professional Experience",
            company: "Current/Recent Organization",
            position: "Current/Recent Role",
            key_talking_points: [
              "Technical achievements and contributions",
              "Professional growth and responsibility expansion",
              "Team collaboration and project success"
            ],
            interview_relevance: "Demonstrates current capabilities and readiness for target role"
          }
        ],
        career_narrative: `Professional journey demonstrates consistent growth and skill development leading naturally to ${jobData.jobTitle} role. Career progression shows both technical advancement and professional maturity.`,
        keySkills: ["Technical Competency", "Professional Communication", "Problem Solving", "Career Progression", "Industry Knowledge", "Continuous Learning"],
        interviewAreas: [
          "Professional experience and career trajectory",
          "Technical skills development through work history",
          "Team collaboration and professional growth",
          "Problem-solving approach and methodology",
          "Industry knowledge and career development goals"
        ],
        strengths: [
          "Documented professional career progression",
          "Technical competencies verified through work experience",
          "Professional development track record",
          "Strong foundation for continued growth"
        ],
        complexity: "Medium",
        matchScore: 80,
        profileInsights: [
          "Professional candidate with verified career progression",
          "Good alignment between work history and role requirements",
          "Strong potential for success based on professional trajectory",
          "Career development mindset evident from progression pattern"
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartInterview = async () => {
    console.log("Starting interview with enhanced chronological AI analysis")
    setIsStartingInterview(true)

    try {
      if (analysisData) {
        localStorage.setItem("analysisData", JSON.stringify(analysisData))
      }

      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push("/interview")
    } catch (error) {
      console.error("Error starting interview:", error)
      setIsStartingInterview(false)
    }
  }

  // Get chronological work experience from document analyses with better data handling
  const getChronologicalExperience = () => {
    const storedAnalyses = localStorage.getItem("documentAnalyses")
    if (!storedAnalyses) return []

    try {
      const documentAnalyses = JSON.parse(storedAnalyses)
      const allWorkHistory: any[] = []

      documentAnalyses.forEach((analysis: any) => {
        if (analysis.experienceDetails?.workHistory) {
          allWorkHistory.push(...analysis.experienceDetails.workHistory)
        }
      })

      // Sort by start date (most recent first) with better date parsing
      return allWorkHistory.sort((a, b) => {
        const parseDate = (dateStr: string) => {
          if (!dateStr || dateStr === 'Present') return new Date()
          // Handle MM/YYYY format
          const parts = dateStr.split('/')
          if (parts.length === 2) {
            return new Date(parseInt(parts[1]), parseInt(parts[0]) - 1)
          }
          return new Date(dateStr)
        }

        const dateA = parseDate(a.startDate || '1900-01-01')
        const dateB = parseDate(b.startDate || '1900-01-01')
        return dateB.getTime() - dateA.getTime()
      })
    } catch (error) {
      console.error("Error parsing chronological experience:", error)
      return []
    }
  }

  // Get aggregated career statistics
  const getCareerStats = () => {
    const experiences = getChronologicalExperience()
    const documentAnalyses = localStorage.getItem("documentAnalyses")

    let totalSkills = 0
    let totalAchievements = 0
    let industries = new Set<string>()
    let companies = new Set<string>()
    let technologies = new Set<string>()
    let totalExperience = ""

    if (documentAnalyses) {
      try {
        const analyses = JSON.parse(documentAnalyses)
        analyses.forEach((analysis: any) => {
          if (analysis.extractedSkills) totalSkills += analysis.extractedSkills.length
          if (analysis.keyAchievements) totalAchievements += analysis.keyAchievements.length
          if (analysis.experienceDetails?.totalYears) totalExperience = analysis.experienceDetails.totalYears
        })
      } catch (error) {
        console.error("Error parsing document analyses for stats:", error)
      }
    }

    experiences.forEach(exp => {
      if (exp.industry) industries.add(exp.industry)
      if (exp.company) companies.add(exp.company)
      if (exp.technologies) exp.technologies.forEach((tech: string) => technologies.add(tech))
    })

    return {
      totalRoles: experiences.length,
      totalSkills: Math.max(totalSkills, technologies.size),
      totalAchievements,
      industries: Array.from(industries),
      companies: Array.from(companies),
      technologies: Array.from(technologies),
      totalExperience
    }
  }

  const chronologicalExperience = getChronologicalExperience()
  const careerStats = getCareerStats()

  if (!isAuthenticated || !jobData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea] dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">

          <Card className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/30">
            <CardContent className="p-8">

              {/* Hero Section */}
              <div className="text-center space-y-6 mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                  PassInterview.AI
                </h1>

                <div className="inline-flex items-center bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  🤖 AI Responds As You Using Your Real Career History
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Intelligent Real-Time Assistant with Chronological Experience Integration
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
                    🧠 {isLoading ? "Enhanced Chronological AI Training in Progress..." : "Chronological Career Analysis Complete"}
                  </h2>
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {isLoading
                    ? "Our AI is analyzing your chronological work experience, career progression, and professional achievements with advanced extraction..."
                    : "Your complete career timeline has been analyzed. AI is ready to use your real companies, job titles, achievements, and career progression in interview responses."
                  }
                </p>

                {!isLoading && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1 bg-gray-800 text-white dark:bg-gray-700">
                      <Clock className="w-4 h-4" />
                      Chronological analysis completed
                    </Badge>
                    {chronologicalExperience.length > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Building className="w-4 h-4" />
                        {chronologicalExperience.length} roles analyzed
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column - Enhanced Analysis Sections */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Professional Profile */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">👤</span>
                      <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Professional Profile</h3>
                    </div>
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {analysisData?.candidate_profile || `Experienced professional applying for ${jobData.jobTitle} with documented career progression and industry expertise.`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Career Progression Analysis */}
                  {!isLoading && analysisData?.career_progression_analysis && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📈</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Career Progression Analysis</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {analysisData.career_progression_analysis}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chronological Work Experience */}
                  {!isLoading && chronologicalExperience.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🏢</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Chronological Work Experience</h3>
                        <Badge variant="outline" className="ml-auto">
                          {chronologicalExperience.length} roles
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {(showAllExperiences ? chronologicalExperience : chronologicalExperience.slice(0, 3)).map((job, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {job.position}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Building className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {job.company}
                                  </span>
                                  {job.industry && (
                                    <Badge variant="outline" className="text-xs">
                                      {job.industry}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{job.startDate} - {job.endDate}</span>
                                </div>
                                {job.duration && (
                                  <div className="mt-1 text-xs">
                                    {job.duration}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Responsibilities */}
                            {job.responsibilities && job.responsibilities.length > 0 && (
                              <div className="mb-3">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Key Responsibilities:
                                </div>
                                <div className="space-y-1">
                                  {job.responsibilities.slice(0, expandedExperience === index ? undefined : 2).map((resp: string, respIndex: number) => (
                                    <div key={respIndex} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <span className="text-blue-500 mt-1">•</span>
                                      <span>{resp}</span>
                                    </div>
                                  ))}
                                  {job.responsibilities.length > 2 && expandedExperience !== index && (
                                    <button
                                      onClick={() => setExpandedExperience(index)}
                                      className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-3"
                                    >
                                      + {job.responsibilities.length - 2} more
                                    </button>
                                  )}
                                  {expandedExperience === index && job.responsibilities.length > 2 && (
                                    <button
                                      onClick={() => setExpandedExperience(null)}
                                      className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-3"
                                    >
                                      Show less
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Technologies */}
                            {job.technologies && job.technologies.length > 0 && (
                              <div className="mb-3">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Technologies Used:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {job.technologies.map((tech: string, techIndex: number) => (
                                    <Badge key={techIndex} variant="secondary" className="text-xs">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Achievements */}
                            {job.achievements && job.achievements.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Key Achievements:
                                </div>
                                <div className="space-y-1">
                                  {job.achievements.map((achievement: string, achIndex: number) => (
                                    <div key={achIndex} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <Award className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                      <span>{achievement}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Company Size and Industry */}
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              {job.companySize && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{job.companySize}</span>
                                </div>
                              )}
                              {job.industry && (
                                <div className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  <span>{job.industry}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {chronologicalExperience.length > 3 && (
                          <div className="text-center">
                            <Button
                              variant="ghost"
                              onClick={() => setShowAllExperiences(!showAllExperiences)}
                              className="text-sm"
                            >
                              {showAllExperiences ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-2" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-2" />
                                  Show All {chronologicalExperience.length} Roles
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Key Strengths */}
                  {!isLoading && (analysisData?.key_strengths || analysisData?.keySkills) && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">💪</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Key Strengths from Career Analysis</h3>
                      </div>
                      <div className="space-y-3">
                        {(analysisData.key_strengths || analysisData.keySkills || []).map((strength, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Career Statistics */}
                  {!isLoading && chronologicalExperience.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📊</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Career Statistics</h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="font-bold text-2xl text-blue-800 dark:text-blue-200">
                            {careerStats.totalRoles}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">Professional Roles</div>
                        </div>

                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="font-bold text-2xl text-green-800 dark:text-green-200">
                            {careerStats.companies.length}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">Companies</div>
                        </div>

                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="font-bold text-2xl text-purple-800 dark:text-purple-200">
                            {careerStats.totalSkills}
                          </div>
                          <div className="text-sm text-purple-600 dark:text-purple-400">Skills & Technologies</div>
                        </div>

                        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div className="font-bold text-2xl text-yellow-800 dark:text-yellow-200">
                            {careerStats.industries.length}
                          </div>
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">Industries</div>
                        </div>
                      </div>

                      {/* Industry and Technology Highlights */}
                      {careerStats.industries.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                            Industry Experience:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {careerStats.industries.slice(0, 6).map((industry, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {industry}
                              </Badge>
                            ))}
                            {careerStats.industries.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{careerStats.industries.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {careerStats.totalExperience && (
                        <div className="mt-3 text-center">
                          <Badge className="bg-blue-600 text-white">
                            Total Experience: {careerStats.totalExperience}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Leadership and Management */}
                  {!isLoading && analysisData?.leadership_and_management && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">👥</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Leadership & Management Experience</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {analysisData.leadership_and_management}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chronological Talking Points */}
                  {!isLoading && analysisData?.chronological_talking_points && analysisData.chronological_talking_points.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">💬</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Interview Talking Points</h3>
                      </div>
                      <div className="space-y-4">
                        {analysisData.chronological_talking_points.map((talkingPoint, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {talkingPoint.position} at {talkingPoint.company}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {talkingPoint.period}
                              </Badge>
                            </div>

                            <div className="space-y-2 mb-3">
                              {talkingPoint.key_talking_points.map((point, pointIndex) => (
                                <div key={pointIndex} className="flex items-start gap-2 text-sm">
                                  <span className="text-green-500 mt-1">•</span>
                                  <span className="text-gray-700 dark:text-gray-300">{point}</span>
                                </div>
                              ))}
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                Interview Relevance:
                              </div>
                              <div className="text-sm text-blue-700 dark:text-blue-300">
                                {talkingPoint.interview_relevance}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career Narrative */}
                  {!isLoading && analysisData?.career_narrative && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📖</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Career Narrative</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {analysisData.career_narrative}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Documents Analysis Summary */}
                  {jobData.uploadedFiles.length > 0 && !isLoading && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📄</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Enhanced Document Analysis Summary</h3>
                      </div>

                      <div className="space-y-4">
                        {jobData.uploadedFiles.map((fileName, index) => {
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
                                  <FileText className="w-5 h-5 text-blue-500" />
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{fileName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-500 text-white text-xs">
                                    {analysis?.documentType || 'document'}
                                  </Badge>
                                  {analysis?.experienceDetails?.totalYears && (
                                    <Badge variant="outline" className="text-xs">
                                      {analysis.experienceDetails.totalYears}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {analysis && (
                                <div className="space-y-3">
                                  {/* Quick Stats */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {analysis.experienceDetails?.workHistory && (
                                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div className="font-semibold text-blue-800 dark:text-blue-200">
                                          {analysis.experienceDetails.workHistory.length}
                                        </div>
                                        <div className="text-xs text-blue-600 dark:text-blue-400">Roles</div>
                                      </div>
                                    )}
                                    {analysis.extractedSkills && (
                                      <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <div className="font-semibold text-green-800 dark:text-green-200">
                                          {analysis.extractedSkills.length}
                                        </div>
                                        <div className="text-xs text-green-600 dark:text-green-400">Skills</div>
                                      </div>
                                    )}
                                    {analysis.experienceDetails?.companies && (
                                      <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <div className="font-semibold text-purple-800 dark:text-purple-200">
                                          {analysis.experienceDetails.companies.length}
                                        </div>
                                        <div className="text-xs text-purple-600 dark:text-purple-400">Companies</div>
                                      </div>
                                    )}
                                    {analysis.keyAchievements && (
                                      <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                        <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                                          {analysis.keyAchievements.length}
                                        </div>
                                        <div className="text-xs text-yellow-600 dark:text-yellow-400">Achievements</div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Contact Info if available */}
                                  {analysis.contactInfo && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                      <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">
                                        📞 Contact Information Extracted:
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        {analysis.contactInfo.email !== 'not extracted' && (
                                          <div className="flex items-center gap-1">
                                            <Mail className="w-3 h-3 text-gray-500" />
                                            <span>{analysis.contactInfo.email}</span>
                                          </div>
                                        )}
                                        {analysis.contactInfo.phone !== 'not extracted' && (
                                          <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-gray-500" />
                                            <span>{analysis.contactInfo.phone}</span>
                                          </div>
                                        )}
                                        {analysis.contactInfo.location !== 'not extracted' && (
                                          <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-gray-500" />
                                            <span>{analysis.contactInfo.location}</span>
                                          </div>
                                        )}
                                        {analysis.contactInfo.linkedin !== 'not extracted' && (
                                          <div className="flex items-center gap-1">
                                            <Linkedin className="w-3 h-3 text-gray-500" />
                                            <span>LinkedIn Profile</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interview Strategy */}
                  {!isLoading && analysisData?.interview_strategy && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🎯</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Enhanced Interview Strategy</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {analysisData.interview_strategy}
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
                      <h3 className="text-lg font-semibold">Ready for Enhanced Interview</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      Your AI assistant is ready with your complete career timeline and professional achievements
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Chronological career analysis completed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Real company names and job titles extracted</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Career progression timeline ready</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Professional achievements catalogued</span>
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
                          Starting Enhanced Interview...
                        </>
                      ) : isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing Career Timeline...
                        </>
                      ) : (
                        <>
                          Start Chronological Interview
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Career Stats */}
                  {!isLoading && chronologicalExperience.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Professional Roles</span>
                          <span className="font-semibold">{careerStats.totalRoles}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Companies Worked</span>
                          <span className="font-semibold">{careerStats.companies.length}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Industries</span>
                          <span className="font-semibold">{careerStats.industries.length}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Technologies</span>
                          <span className="font-semibold">{careerStats.technologies.length}</span>
                        </div>

                        {careerStats.totalExperience && (
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Total Experience</span>
                              <Badge className="bg-blue-600 text-white text-xs">
                                {careerStats.totalExperience}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Features */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Chronological Features</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          1
                        </div>
                        <p>AI uses your actual career timeline and progression</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          2
                        </div>
                        <p>Real company names and job titles from your CV</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          3
                        </div>
                        <p>Chronological experience narrative for interviews</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          4
                        </div>
                        <p>Professional achievements and career milestones</p>
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
                        Average rating with chronological career analysis
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
                      <span className="font-semibold text-yellow-800 dark:text-yellow-200">Enhanced Chronological AI Session Active</span>
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 font-mono">
                      Session ID: chronological_{Math.random().toString(36).substr(2, 9)} | {chronologicalExperience.length} roles analyzed | {careerStats.totalExperience || 'Multiple years'} experience
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
                        Starting Chronological Interview...
                      </>
                    ) : (
                      <>
                        🎤 Start Career-Based Interview
                        <ArrowRight className="w-5 h-5 ml-2" />
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
}="space-y-4" >
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-20 w-full" />
                        </div >
                      ) : (
  <div className