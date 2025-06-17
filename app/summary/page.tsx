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
  ChevronUp,
  AlertTriangle
} from "lucide-react"
import Header from "@/components/header"

interface JobData {
  jobTitle: string
  jobDescription: string
  uploadedFiles: string[]
  documentAnalyses?: any[]
}

interface AnalysisData {
  candidate_profile?: string
  career_progression_analysis?: string | null
  key_strengths?: string[]
  experience_highlights?: string[]
  technical_competencies?: string[]
  industry_expertise?: string[]
  leadership_and_management?: string | null
  potential_challenges?: string[]
  interview_strategy?: string | null
  role_fit_analysis?: string | null
  preparation_recommendations?: string[]
  chronological_talking_points?: Array<{
    period: string
    company: string
    position: string
    key_talking_points: string[]
    interview_relevance: string
  }>
  career_narrative?: string | null
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

    // Call enhanced AI analysis API with real data only
    analyzeRealProfile(parsedJobData)
  }, [router])

  const analyzeRealProfile = async (jobData: JobData) => {
    try {
      console.log("Starting enhanced real data AI profile analysis...")
      setIsLoading(true)

      // Get stored document analyses with real data
      let documentAnalyses = jobData.documentAnalyses || []

      if (!documentAnalyses || documentAnalyses.length === 0) {
        const storedAnalyses = localStorage.getItem("documentAnalyses")
        if (storedAnalyses) {
          try {
            documentAnalyses = JSON.parse(storedAnalyses)
            console.log("Retrieved real document analyses:", documentAnalyses.length)
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
      console.log("Enhanced real data AI Analysis result:", result)

      if (result.success) {
        setAnalysisData(result.analysis)
      } else {
        // Only set minimal analysis if we have real document data
        if (documentAnalyses.length > 0) {
          setAnalysisData(createMinimalAnalysisFromRealData(jobData, documentAnalyses))
        } else {
          setAnalysisData(createEmptyAnalysis(jobData))
        }
      }
    } catch (error) {
      console.error("Error in enhanced real data profile analysis:", error)
      
      // Check if we have real document data to work with
      const storedAnalyses = localStorage.getItem("documentAnalyses")
      let documentAnalyses = []
      
      try {
        documentAnalyses = storedAnalyses ? JSON.parse(storedAnalyses) : []
      } catch (e) {
        console.warn("Could not parse document analyses")
      }

      if (documentAnalyses.length > 0) {
        setAnalysisData(createMinimalAnalysisFromRealData(jobData, documentAnalyses))
      } else {
        setAnalysisData(createEmptyAnalysis(jobData))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Create minimal analysis from real extracted data only
  const createMinimalAnalysisFromRealData = (jobData: JobData, documentAnalyses: any[]) => {
    const realSkills = new Set<string>()
    const realCompanies = new Set<string>()
    const realRoles = new Set<string>()
    const realIndustries = new Set<string>()
    const realAchievements: string[] = []
    let totalExperience = null
    let workHistory: any[] = []

    // Extract only real data from document analyses
    documentAnalyses.forEach((analysis: any) => {
      if (analysis.extractedSkills) {
        analysis.extractedSkills.forEach((skill: string) => realSkills.add(skill))
      }
      
      if (analysis.experienceDetails?.companies) {
        analysis.experienceDetails.companies.forEach((company: string) => realCompanies.add(company))
      }
      
      if (analysis.experienceDetails?.roles) {
        analysis.experienceDetails.roles.forEach((role: string) => realRoles.add(role))
      }
      
      if (analysis.experienceDetails?.industries) {
        analysis.experienceDetails.industries.forEach((industry: string) => realIndustries.add(industry))
      }
      
      if (analysis.keyAchievements) {
        realAchievements.push(...analysis.keyAchievements)
      }
      
      if (analysis.experienceDetails?.totalYears) {
        totalExperience = analysis.experienceDetails.totalYears
      }
      
      if (analysis.experienceDetails?.workHistory) {
        workHistory.push(...analysis.experienceDetails.workHistory)
      }
    })

    return {
      candidate_profile: totalExperience ? 
        `Professional candidate with ${totalExperience} applying for ${jobData.jobTitle}` : 
        `Candidate applying for ${jobData.jobTitle} position`,
      career_progression_analysis: workHistory.length > 0 ? 
        `Career progression shows ${workHistory.length} documented professional roles` : null,
      key_strengths: Array.from(realSkills).slice(0, 4),
      experience_highlights: realAchievements.slice(0, 3),
      technical_competencies: Array.from(realSkills),
      industry_expertise: Array.from(realIndustries),
      leadership_and_management: null,
      potential_challenges: [],
      interview_strategy: `Focus on documented experience and achievements from career history`,
      role_fit_analysis: `Alignment based on ${Array.from(realSkills).length} identified skills and ${workHistory.length} roles`,
      preparation_recommendations: workHistory.length > 0 ? [
        "Review specific achievements from documented career progression",
        "Prepare examples from actual work experience"
      ] : [],
      chronological_talking_points: workHistory.map((job: any) => ({
        period: job.startDate && job.endDate ? `${job.startDate} - ${job.endDate}` : "Career period",
        company: job.company || "Professional experience",
        position: job.position || "Role",
        key_talking_points: job.responsibilities?.slice(0, 3) || ["Professional responsibilities"],
        interview_relevance: "Demonstrates relevant experience for target position"
      })),
      career_narrative: workHistory.length > 0 ? 
        `Professional journey with documented experience at ${Array.from(realCompanies).join(', ')}` : 
        `Professional background relevant to ${jobData.jobTitle}`,
      keySkills: Array.from(realSkills),
      interviewAreas: [
        "Professional experience discussion",
        "Technical competencies",
        "Career development"
      ],
      strengths: Array.from(realSkills).slice(0, 4),
      complexity: "Medium",
      matchScore: Math.min(85, 60 + (Array.from(realSkills).length * 2) + (workHistory.length * 5)),
      profileInsights: [
        `${Array.from(realSkills).length} technical skills identified`,
        `${workHistory.length} professional roles documented`,
        `${Array.from(realIndustries).length} industries experienced`
      ].filter(insight => !insight.includes('0 '))
    }
  }

  // Create empty analysis when no real data is available
  const createEmptyAnalysis = (jobData: JobData) => {
    return {
      candidate_profile: `Candidate applying for ${jobData.jobTitle} position`,
      career_progression_analysis: null,
      key_strengths: [],
      experience_highlights: [],
      technical_competencies: [],
      industry_expertise: [],
      leadership_and_management: null,
      potential_challenges: [],
      interview_strategy: `Prepare for ${jobData.jobTitle} interview based on role requirements`,
      role_fit_analysis: `Interview preparation for ${jobData.jobTitle} position`,
      preparation_recommendations: [
        "Review job requirements carefully",
        "Prepare examples from your experience"
      ],
      chronological_talking_points: [],
      career_narrative: `Professional candidate interested in ${jobData.jobTitle} role`,
      keySkills: [],
      interviewAreas: [
        "Role requirements discussion",
        "Experience and background",
        "Career goals"
      ],
      strengths: [],
      complexity: "Basic",
      matchScore: 65,
      profileInsights: [
        "No detailed CV analysis available",
        "Basic interview preparation mode"
      ]
    }
  }

  const handleStartInterview = async () => {
    console.log("Starting interview with real data analysis")
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

  // Get real chronological work experience from document analyses
  const getRealChronologicalExperience = () => {
    const storedAnalyses = localStorage.getItem("documentAnalyses")
    if (!storedAnalyses) return []

    try {
      const documentAnalyses = JSON.parse(storedAnalyses)
      const allWorkHistory: any[] = []

      documentAnalyses.forEach((analysis: any) => {
        if (analysis.experienceDetails?.workHistory) {
          // Only add entries with real company or position data
          const validJobs = analysis.experienceDetails.workHistory.filter((job: any) => 
            (job.company && job.company.trim()) || (job.position && job.position.trim())
          )
          allWorkHistory.push(...validJobs)
        }
      })

      // Sort by start date (most recent first) with better date parsing
      return allWorkHistory.sort((a, b) => {
        const parseDate = (dateStr: string) => {
          if (!dateStr || dateStr === 'Present') return new Date()
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
      console.error("Error parsing real chronological experience:", error)
      return []
    }
  }

  // Get real contact information from document analyses
  const getRealContactInfo = () => {
    const storedAnalyses = localStorage.getItem("documentAnalyses")
    if (!storedAnalyses) return null

    try {
      const documentAnalyses = JSON.parse(storedAnalyses)
      let contactInfo = {
        email: null,
        phone: null,
        location: null,
        linkedin: null,
        portfolio: null
      }

      documentAnalyses.forEach((analysis: any) => {
        if (analysis.contactInfo) {
          if (analysis.contactInfo.email && analysis.contactInfo.email !== 'not extracted') {
            contactInfo.email = analysis.contactInfo.email
          }
          if (analysis.contactInfo.phone && analysis.contactInfo.phone !== 'not extracted') {
            contactInfo.phone = analysis.contactInfo.phone
          }
          if (analysis.contactInfo.location && analysis.contactInfo.location !== 'not extracted') {
            contactInfo.location = analysis.contactInfo.location
          }
          if (analysis.contactInfo.linkedin && analysis.contactInfo.linkedin !== 'not extracted') {
            contactInfo.linkedin = analysis.contactInfo.linkedin
          }
          if (analysis.contactInfo.portfolio && analysis.contactInfo.portfolio !== 'not extracted') {
            contactInfo.portfolio = analysis.contactInfo.portfolio
          }
        }
      })

      // Return null if no real contact info found
      const hasRealInfo = Object.values(contactInfo).some(value => value !== null)
      return hasRealInfo ? contactInfo : null
    } catch (error) {
      console.error("Error parsing real contact info:", error)
      return null
    }
  }

  // Get aggregated real career statistics
  const getRealCareerStats = () => {
    const experiences = getRealChronologicalExperience()
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
      totalExperience,
      hasRealData: experiences.length > 0 || totalSkills > 0 || totalAchievements > 0
    }
  }

  const chronologicalExperience = getRealChronologicalExperience()
  const realContactInfo = getRealContactInfo()
  const careerStats = getRealCareerStats()

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
                  🤖 AI Trained with Your Real Career Data
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Intelligent Real-Time Assistant with Authentic Professional Background
                </p>
              </div>

              {/* AI Analysis Status */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                    ) : careerStats.hasRealData ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {isLoading ? "🧠 Analyzing Your Real Career Data..." : 
                     careerStats.hasRealData ? "✅ Real Career Data Analysis Complete" : 
                     "⚠️ Limited Career Data Available"}
                  </h2>
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {isLoading
                    ? "Extracting authentic career information from your uploaded documents..."
                    : careerStats.hasRealData
                    ? `Found ${careerStats.totalRoles} professional roles, ${careerStats.totalSkills} skills, and ${careerStats.companies.length} companies from your documents.`
                    : "AI will work with available job context. Upload your CV for personalized responses with real career data."
                  }
                </p>

                {!isLoading && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1 bg-gray-800 text-white dark:bg-gray-700">
                      <Clock className="w-4 h-4" />
                      {careerStats.hasRealData ? "Real data extracted" : "Basic mode"}
                    </Badge>
                    {chronologicalExperience.length > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Building className="w-4 h-4" />
                        {chronologicalExperience.length} roles found
                      </Badge>
                    )}
                    {careerStats.totalSkills > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Target className="w-4 h-4" />
                        {careerStats.totalSkills} skills identified
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column - Real Data Sections */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Professional Profile - Only show if we have real data */}
                  {!isLoading && analysisData?.candidate_profile && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">👤</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Professional Profile</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {analysisData.candidate_profile}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Real Chronological Work Experience - Only show if data exists */}
                  {!isLoading && chronologicalExperience.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🏢</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Extracted Work Experience</h3>
                        <Badge variant="outline" className="ml-auto">
                          {chronologicalExperience.length} roles
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {(showAllExperiences ? chronologicalExperience : chronologicalExperience.slice(0, 3)).map((job, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                {job.position && (
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {job.position}
                                  </h4>
                                )}
                                {job.company && (
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
                                )}
                              </div>
                              {(job.startDate || job.endDate) && (
                                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{job.startDate || '?'} - {job.endDate || 'Present'}</span>
                                  </div>
                                  {job.duration && (
                                    <div className="mt-1 text-xs">
                                      {job.duration}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Show responsibilities if available */}
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

                            {/* Show technologies if available */}
                            {job.technologies && job.technologies.length > 0 && (
                              <div className="mb-3">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Technologies:
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

                            {/* Show achievements if available */}
                            {job.achievements && job.achievements.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Achievements:
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

                  {/* Real Contact Information - Only show if extracted */}
                  {!isLoading && realContactInfo && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📞</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Contact Information</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {realContactInfo.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{realContactInfo.email}</span>
                          </div>
                        )}
                        {realContactInfo.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{realContactInfo.phone}</span>
                          </div>
                        )}
                        {realContactInfo.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{realContactInfo.location}</span>
                          </div>
                        )}
                        {realContactInfo.linkedin && (
                          <div className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">LinkedIn Profile</span>
                          </div>
                        )}
                        {realContactInfo.portfolio && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">Portfolio</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Real Skills - Only show if extracted */}
                  {!isLoading && analysisData?.keySkills && analysisData.keySkills.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">💪</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Extracted Skills</h3>
                        <Badge variant="outline" className="ml-auto">
                          {analysisData.keySkills.length} skills
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysisData.keySkills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career Statistics - Only show if we have real data */}
                  {!isLoading && careerStats.hasRealData && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📊</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Career Statistics</h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {careerStats.totalRoles > 0 && (
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="font-bold text-2xl text-blue-800 dark:text-blue-200">
                              {careerStats.totalRoles}
                            </div>
                            <div className="text-sm text-blue-600 dark:text-blue-400">Professional Roles</div>
                          </div>
                        )}

                        {careerStats.companies.length > 0 && (
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="font-bold text-2xl text-green-800 dark:text-green-200">
                              {careerStats.companies.length}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400">Companies</div>
                          </div>
                        )}

                        {careerStats.totalSkills > 0 && (
                          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="font-bold text-2xl text-purple-800 dark:text-purple-200">
                              {careerStats.totalSkills}
                            </div>
                            <div className="text-sm text-purple-600 dark:text-purple-400">Skills & Technologies</div>
                          </div>
                        )}

                        {careerStats.industries.length > 0 && (
                          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="font-bold text-2xl text-yellow-800 dark:text-yellow-200">
                              {careerStats.industries.length}
                            </div>
                            <div className="text-sm text-yellow-600 dark:text-yellow-400">Industries</div>
                          </div>
                        )}
                      </div>

                      {careerStats.totalExperience && (
                        <div className="mt-4 text-center">
                          <Badge className="bg-blue-600 text-white">
                            Total Experience: {careerStats.totalExperience}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Right Column - Action Sidebar */}
                <div className="space-y-6">

                  {/* Ready to Start */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">🤖</span>
                      <h3 className="text-lg font-semibold">Interview Ready</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      {careerStats.hasRealData 
                        ? "AI trained with your real career data and professional experience"
                        : "AI ready for interview with available job context"
                      }
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{careerStats.hasRealData ? "Real career data analyzed" : "Job context processed"}</span>
                      </div>
                      {careerStats.totalRoles > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{careerStats.totalRoles} professional roles extracted</span>
                        </div>
                      )}
                      {careerStats.companies.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{careerStats.companies.length} companies identified</span>
                        </div>
                      )}
                      {careerStats.totalSkills > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{careerStats.totalSkills} skills catalogued</span>
                        </div>
                      )}
                      {!careerStats.hasRealData && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Basic interview preparation ready</span>
                        </div>
                      )}
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
                          Processing Data...
                        </>
                      ) : (
                        <>
                          Start AI Interview
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Real Career Stats - Only show if we have real data */}
                  {!isLoading && careerStats.hasRealData && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                      <div className="space-y-4">
                        {careerStats.totalRoles > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Professional Roles</span>
                            <span className="font-semibold">{careerStats.totalRoles}</span>
                          </div>
                        )}

                        {careerStats.companies.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Companies</span>
                            <span className="font-semibold">{careerStats.companies.length}</span>
                          </div>
                        )}

                        {careerStats.industries.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Industries</span>
                            <span className="font-semibold">{careerStats.industries.length}</span>
                          </div>
                        )}

                        {careerStats.totalSkills > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Skills</span>
                            <span className="font-semibold">{careerStats.totalSkills}</span>
                          </div>
                        )}

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

                  {/* Data Quality Indicator */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Data Quality</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${careerStats.hasRealData ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'}`}>
                          1
                        </div>
                        <p>{careerStats.hasRealData ? "Real career data extracted from documents" : "Basic job context available"}</p>
                      </div>
                      <div className="flex gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${careerStats.totalRoles > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600'}`}>
                          2
                        </div>
                        <p>{careerStats.totalRoles > 0 ? `${careerStats.totalRoles} professional roles identified` : "No specific work history found"}</p>
                      </div>
                      <div className="flex gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${careerStats.totalSkills > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600'}`}>
                          3
                        </div>
                        <p>{careerStats.totalSkills > 0 ? `${careerStats.totalSkills} technical skills catalogued` : "No specific skills extracted"}</p>
                      </div>
                      <div className="flex gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${realContactInfo ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600'}`}>
                          4
                        </div>
                        <p>{realContactInfo ? "Contact information extracted" : "No contact information found"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Rating */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-3xl font-bold">
                          {careerStats.hasRealData ? (analysisData?.matchScore || 85) : 65}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {careerStats.hasRealData ? "Match score with real career data" : "Basic interview readiness"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Analysis Summary - Only show if we have documents */}
              {jobData.uploadedFiles && jobData.uploadedFiles.length > 0 && !isLoading && (
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">📄</span>
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Document Analysis Results</h3>
                  </div>

                  <div className="space-y-4">
                    {jobData.uploadedFiles.map((fileName, index) => {
                      const storedAnalyses = localStorage.getItem("documentAnalyses")
                      let documentAnalyses: any[] = []

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
                              {analysis && !analysis.error ? (
                                <Badge className="bg-green-500 text-white text-xs">
                                  {analysis.documentType || 'processed'}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  extraction failed
                                </Badge>
                              )}
                            </div>
                          </div>

                          {analysis && !analysis.error ? (
                            <div className="space-y-3">
                              {/* Real Data Stats */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {analysis.experienceDetails?.workHistory && analysis.experienceDetails.workHistory.length > 0 && (
                                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="font-semibold text-blue-800 dark:text-blue-200">
                                      {analysis.experienceDetails.workHistory.length}
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400">Roles</div>
                                  </div>
                                )}
                                {analysis.extractedSkills && analysis.extractedSkills.length > 0 && (
                                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="font-semibold text-green-800 dark:text-green-200">
                                      {analysis.extractedSkills.length}
                                    </div>
                                    <div className="text-xs text-green-600 dark:text-green-400">Skills</div>
                                  </div>
                                )}
                                {analysis.experienceDetails?.companies && analysis.experienceDetails.companies.length > 0 && (
                                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <div className="font-semibold text-purple-800 dark:text-purple-200">
                                      {analysis.experienceDetails.companies.length}
                                    </div>
                                    <div className="text-xs text-purple-600 dark:text-purple-400">Companies</div>
                                  </div>
                                )}
                                {analysis.keyAchievements && analysis.keyAchievements.length > 0 && (
                                  <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                                      {analysis.keyAchievements.length}
                                    </div>
                                    <div className="text-xs text-yellow-600 dark:text-yellow-400">Achievements</div>
                                  </div>
                                )}
                              </div>

                              {/* Show summary if available */}
                              {analysis.summary && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                  <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">
                                    📋 Analysis Summary:
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {analysis.summary}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <div className="text-sm text-red-700 dark:text-red-300">
                                ❌ Could not extract data from this document. 
                                {analysis?.errorReason && ` Reason: ${analysis.errorReason}`}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Session Info */}
              {!isLoading && (
                <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                        {careerStats.hasRealData ? "Real Data AI Session Active" : "Basic AI Session Ready"}
                      </span>
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 font-mono">
                      Session ID: {careerStats.hasRealData ? 'real_data' : 'basic'}_{Math.random().toString(36).substr(2, 9)} | 
                      {careerStats.hasRealData ? ` ${careerStats.totalRoles} roles | ${careerStats.totalSkills} skills` : ' Basic mode'}
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
                        Starting Interview Session...
                      </>
                    ) : (
                      <>
                        🎤 {careerStats.hasRealData ? "Start Real-Data Interview" : "Start Basic Interview"}
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
}