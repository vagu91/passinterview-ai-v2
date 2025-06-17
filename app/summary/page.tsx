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
  AlertCircle
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
  const [hasRealData, setHasRealData] = useState(false)
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

    // Verifica se abbiamo dati reali da analizzare
    const hasJobTitle = parsedJobData.jobTitle?.trim()
    const hasJobDescription = parsedJobData.jobDescription?.trim()
    const hasFiles = parsedJobData.uploadedFiles?.length > 0
    const hasDocumentAnalyses = parsedJobData.documentAnalyses?.length > 0

    setHasRealData(hasJobTitle && (hasJobDescription || hasFiles || hasDocumentAnalyses))

    // Procedi con l'analisi AI solo se abbiamo dati reali
    if (hasJobTitle && (hasJobDescription || hasFiles || hasDocumentAnalyses)) {
      analyzeProfile(parsedJobData)
    } else {
      setIsLoading(false)
      console.warn("Insufficient data for AI analysis")
    }
  }, [router])

  const analyzeProfile = async (jobData: JobData) => {
    try {
      console.log("Starting enhanced AI profile analysis...")
      setIsLoading(true)

      // Get stored document analyses with data
      let documentAnalyses = jobData.documentAnalyses || []

      if (!documentAnalyses || documentAnalyses.length === 0) {
        const storedAnalyses = localStorage.getItem("documentAnalyses")
        if (storedAnalyses) {
          try {
            documentAnalyses = JSON.parse(storedAnalyses)
            console.log("Retrieved document analyses:", documentAnalyses.length)
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
      console.log("Enhanced AI Analysis result:", result)

      if (result.success && result.analysis) {
        setAnalysisData(result.analysis)
      } else {
        // Se l'analisi fallisce ma abbiamo dati reali, crea un'analisi minima basata sui dati forniti
        if (hasRealData) {
          setAnalysisData(createMinimalAnalysisFromRealData(jobData, documentAnalyses))
        } else {
          setAnalysisData(null)
        }
      }
    } catch (error) {
      console.error("Error in enhanced profile analysis:", error)
      // Fallback solo se abbiamo dati reali
      if (hasRealData) {
        setAnalysisData(createMinimalAnalysisFromRealData(jobData, documentAnalyses))
      } else {
        setAnalysisData(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Crea un'analisi minima basata SOLO sui dati reali forniti
  const createMinimalAnalysisFromRealData = (jobData: JobData, documentAnalyses: any[]) => {
    console.log("Creating minimal analysis from real data:", { jobData, documentAnalyses })
    
    // Estrai competenze reali dai documenti
    const extractedSkills: string[] = []
    const extractedCompanies: string[] = []
    const extractedRoles: string[] = []
    const extractedIndustries: string[] = []
    let totalExperience = ""
    let contactInfo: any = {}

    documentAnalyses.forEach(doc => {
      if (doc.extractedSkills) extractedSkills.push(...doc.extractedSkills)
      if (doc.experienceDetails?.companies) extractedCompanies.push(...doc.experienceDetails.companies)
      if (doc.experienceDetails?.roles) extractedRoles.push(...doc.experienceDetails.roles)
      if (doc.experienceDetails?.industries) extractedIndustries.push(...doc.experienceDetails.industries)
      if (doc.experienceDetails?.totalYears) totalExperience = doc.experienceDetails.totalYears
      if (doc.contactInfo) contactInfo = { ...contactInfo, ...doc.contactInfo }
    })

    // Rimuovi duplicati
    const uniqueSkills = [...new Set(extractedSkills)].filter(skill => skill && skill.trim())
    const uniqueCompanies = [...new Set(extractedCompanies)].filter(company => company && company.trim())
    const uniqueRoles = [...new Set(extractedRoles)].filter(role => role && role.trim())
    const uniqueIndustries = [...new Set(extractedIndustries)].filter(industry => industry && industry.trim())

    return {
      candidate_profile: `Candidate applying for ${jobData.jobTitle}${totalExperience ? ` with ${totalExperience} of professional experience` : ''}${uniqueCompanies.length > 0 ? ` having worked at companies including ${uniqueCompanies.slice(0, 3).join(', ')}` : ''}.`,
      career_progression_analysis: totalExperience ? 
        `Professional with ${totalExperience} demonstrating career growth${uniqueIndustries.length > 0 ? ` across ${uniqueIndustries.join(', ')} sectors` : ''}.` :
        `Professional background relevant to ${jobData.jobTitle} position.`,
      key_strengths: uniqueSkills.length > 0 ? 
        uniqueSkills.slice(0, 4) : 
        [`Experience relevant to ${jobData.jobTitle}`, "Professional communication", "Problem-solving capabilities", "Adaptability"],
      experience_highlights: uniqueCompanies.length > 0 ? 
        [`Professional experience at ${uniqueCompanies[0]}${uniqueRoles.length > 0 ? ` as ${uniqueRoles[0]}` : ''}`, 
         `Career progression across ${uniqueCompanies.length} organization${uniqueCompanies.length > 1 ? 's' : ''}`,
         `Industry experience in ${uniqueIndustries.join(', ') || 'relevant sectors'}`] :
        [`Background suitable for ${jobData.jobTitle} role`, "Professional development track record", "Relevant industry knowledge"],
      technical_competencies: uniqueSkills.length > 0 ? uniqueSkills.slice(0, 6) : ["Professional competencies", "Industry knowledge", "Communication skills", "Technical aptitude", "Problem solving", "Teamwork"],
      industry_expertise: uniqueIndustries.length > 0 ? uniqueIndustries : ["Relevant industry knowledge", "Professional domain expertise", "Sector understanding"],
      leadership_and_management: uniqueRoles.some(role => role.toLowerCase().includes('lead') || role.toLowerCase().includes('manager') || role.toLowerCase().includes('senior')) ?
        "Demonstrated leadership experience through senior and management roles in career progression." :
        "Professional experience demonstrates collaboration and project coordination capabilities.",
      potential_challenges: [
        `Research latest trends in ${uniqueIndustries[0] || 'target industry'}`,
        `Prepare specific examples from ${uniqueCompanies.length > 0 ? 'documented work history' : 'professional experience'}`
      ],
      interview_strategy: `Leverage documented experience${uniqueCompanies.length > 0 ? ` at ${uniqueCompanies.slice(0, 2).join(' and ')}` : ''} to demonstrate fit for ${jobData.jobTitle}. ${uniqueSkills.length > 0 ? `Highlight technical competencies in ${uniqueSkills.slice(0, 3).join(', ')}.` : ''}`,
      role_fit_analysis: `${uniqueSkills.length > 0 ? 'Strong technical alignment' : 'Good foundational alignment'} between documented experience and ${jobData.jobTitle} requirements. ${totalExperience ? `${totalExperience} provides solid foundation` : 'Professional background provides relevant foundation'} for success.`,
      preparation_recommendations: [
        `Review specific examples from ${uniqueCompanies.length > 0 ? 'documented work history' : 'professional experience'}`,
        `Prepare to discuss ${uniqueSkills.length > 0 ? uniqueSkills.slice(0, 2).join(' and ') : 'technical competencies'}`,
        `Research target company's position in ${uniqueIndustries[0] || 'the industry'}`
      ],
      chronological_talking_points: documentAnalyses.length > 0 && documentAnalyses[0].experienceDetails?.workHistory?.length > 0 ? 
        documentAnalyses[0].experienceDetails.workHistory.slice(0, 3).map((exp: any) => ({
          period: `${exp.startDate || 'Recent'} - ${exp.endDate || 'Present'}`,
          company: exp.company || 'Organization',
          position: exp.position || 'Professional Role',
          key_talking_points: exp.responsibilities?.slice(0, 3) || [`Experience in ${exp.position || 'professional role'}`, `Contributions at ${exp.company || 'organization'}`, `Professional development and growth`],
          interview_relevance: `Demonstrates ${exp.technologies?.length > 0 ? 'technical competencies' : 'professional experience'} relevant to ${jobData.jobTitle}`
        })) : [],
      career_narrative: `Professional journey${totalExperience ? ` spanning ${totalExperience}` : ''} leading to ${jobData.jobTitle} opportunity. ${uniqueCompanies.length > 0 ? `Experience across ${uniqueCompanies.length} organization${uniqueCompanies.length > 1 ? 's' : ''} demonstrates` : 'Background demonstrates'} progressive skill development and readiness for this role.`,
      keySkills: uniqueSkills.length > 0 ? uniqueSkills.slice(0, 6) : ["Professional Competency", "Industry Knowledge", "Communication", "Problem Solving", "Teamwork", "Adaptability"],
      interviewAreas: [
        uniqueCompanies.length > 0 ? `Experience at ${uniqueCompanies[0]}` : "Professional background",
        uniqueSkills.length > 0 ? `Technical competencies in ${uniqueSkills[0]}` : "Technical capabilities",
        "Career progression and growth",
        "Role alignment and motivation",
        "Future goals and development"
      ],
      strengths: [
        uniqueSkills.length > 0 ? `Technical expertise in ${uniqueSkills[0]}` : "Technical competency",
        uniqueCompanies.length > 0 ? `Professional experience at ${uniqueCompanies[0]}` : "Professional background",
        totalExperience ? `${totalExperience} of experience` : "Relevant experience",
        uniqueIndustries.length > 0 ? `${uniqueIndustries[0]} industry knowledge` : "Industry understanding"
      ],
      complexity: documentAnalyses.length > 0 ? "Medium" : "Basic",
      matchScore: Math.min(95, Math.max(70, 75 + (uniqueSkills.length * 2) + (uniqueCompanies.length * 3) + (totalExperience ? 5 : 0))),
      profileInsights: [
        `${uniqueSkills.length > 0 ? 'Strong technical foundation' : 'Good foundational skills'} for ${jobData.jobTitle}`,
        uniqueCompanies.length > 0 ? `Professional experience at ${uniqueCompanies.length} organization${uniqueCompanies.length > 1 ? 's' : ''}` : "Relevant professional background",
        totalExperience ? `${totalExperience} demonstrates commitment and growth` : "Professional development trajectory",
        uniqueIndustries.length > 0 ? `Industry expertise in ${uniqueIndustries.join(', ')}` : "Industry understanding and adaptability"
      ]
    }
  }

  const handleStartInterview = async () => {
    console.log("Starting interview with enhanced AI analysis")
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

  // Get work experience from document analyses
  const getWorkExperience = () => {
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
      console.error("Error parsing work experience:", error)
      return []
    }
  }

  // Get aggregated career statistics from REAL data only
  const getCareerStats = () => {
    const experiences = getWorkExperience()
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

  const workExperience = getWorkExperience()
  const careerStats = getCareerStats()

  if (!isAuthenticated || !jobData) {
    return null
  }

  // Se non abbiamo dati sufficienti, mostra un messaggio di errore
  if (!hasRealData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea] dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/30">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                <h1 className="text-2xl font-bold mb-4">Insufficient Data for Analysis</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  We need more information to create your personalized interview assistant. 
                  Please provide either a detailed job description or upload relevant documents (CV, cover letter, etc.).
                </p>
                <Button onClick={() => router.push("/")} size="lg">
                  Return to Setup
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
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
                  🤖 AI Trained on Your Real Career Data
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Interview Assistant Personalized with Your Actual Professional Experience
                </p>
              </div>

              {/* AI Analysis Status */}
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
                    🧠 {isLoading ? "Analyzing Your Real Career Data..." : "Analysis Complete - Ready for Interview"}
                  </h2>
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {isLoading
                    ? "Extracting and analyzing your professional experience, skills, and achievements from provided information..."
                    : `AI trained on your specific background for ${jobData.jobTitle}. Ready to respond using your real career history and documented experience.`
                  }
                </p>

                {!isLoading && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1 bg-gray-800 text-white dark:bg-gray-700">
                      <Clock className="w-4 h-4" />
                      Analysis completed
                    </Badge>
                    {workExperience.length > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Building className="w-4 h-4" />
                        {workExperience.length} roles extracted
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

                {/* Left Column - Analysis Results */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Professional Profile */}
                  {!isLoading && analysisData?.candidate_profile && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">👤</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Your Professional Profile</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {analysisData.candidate_profile}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Extracted Skills and Experience */}
                  {!isLoading && (analysisData?.technical_competencies || analysisData?.keySkills) && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🛠️</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Extracted Technical Competencies</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(analysisData.technical_competencies || analysisData.keySkills || []).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real Career Timeline */}
                  {!isLoading && workExperience.length > 0 && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📈</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Your Career Timeline</h3>
                        <Badge variant="outline" className="ml-auto">
                          {workExperience.length} positions
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {(showAllExperiences ? workExperience : workExperience.slice(0, 3)).map((job, index) => (
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

                            {/* Technologies */}
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
                          </div>
                        ))}

                        {workExperience.length > 3 && (
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
                                  Show All {workExperience.length} Positions
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interview Strategy from Real Data */}
                  {!isLoading && analysisData?.interview_strategy && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🎯</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Personalized Interview Strategy</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {analysisData.interview_strategy}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Real Data Sources Summary */}
                  {jobData.uploadedFiles.length > 0 && !isLoading && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📄</span>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Data Sources Analyzed</h3>
                      </div>

                      <div className="space-y-3">
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
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-blue-500" />
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{fileName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-500 text-white text-xs">
                                    {analysis?.documentType || 'analyzed'}
                                  </Badge>
                                  {analysis?.experienceDetails?.totalYears && (
                                    <Badge variant="outline" className="text-xs">
                                      {analysis.experienceDetails.totalYears}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {analysis && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                              )}

                              {!analysis && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Document processed but detailed analysis not available
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Contact Information if Available */}
                  {!isLoading && (() => {
                    const storedAnalyses = localStorage.getItem("documentAnalyses")
                    if (!storedAnalyses) return null
                    
                    try {
                      const analyses = JSON.parse(storedAnalyses)
                      const contactInfo = analyses.find((analysis: any) => 
                        analysis.contactInfo && 
                        Object.values(analysis.contactInfo).some((value: any) => value && value !== 'not extracted')
                      )?.contactInfo

                      if (!contactInfo) return null

                      return (
                        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">📞</span>
                            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Extracted Contact Information</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {contactInfo.email && contactInfo.email !== 'not extracted' && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{contactInfo.email}</span>
                              </div>
                            )}
                            {contactInfo.phone && contactInfo.phone !== 'not extracted' && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{contactInfo.phone}</span>
                              </div>
                            )}
                            {contactInfo.location && contactInfo.location !== 'not extracted' && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{contactInfo.location}</span>
                              </div>
                            )}
                            {contactInfo.linkedin && contactInfo.linkedin !== 'not extracted' && (
                              <div className="flex items-center gap-2">
                                <Linkedin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">LinkedIn Profile</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    } catch (error) {
                      return null
                    }
                  })()}

                </div>

                {/* Right Column - Ready to Start */}
                <div className="space-y-6">

                  {/* Ready to Start */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">🤖</span>
                      <h3 className="text-lg font-semibold">AI Assistant Ready</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      Your AI is trained on your real career data and ready to assist during your interview
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Profile analysis completed</span>
                      </div>
                      {careerStats.companies.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Real company data extracted</span>
                        </div>
                      )}
                      {careerStats.totalSkills > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Technical skills identified</span>
                        </div>
                      )}
                      {workExperience.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Career timeline extracted</span>
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
                          Processing...
                        </>
                      ) : (
                        <>
                          Start Personalized Interview
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Career Stats */}
                  {!isLoading && (careerStats.totalRoles > 0 || careerStats.totalSkills > 0) && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">Extracted Data Summary</h3>
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
                            <span className="text-sm text-gray-600 dark:text-gray-400">Skills & Technologies</span>
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

                  {/* Match Score */}
                  {!isLoading && analysisData?.matchScore && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="text-3xl font-bold">{analysisData.matchScore}%</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Profile match for {jobData.jobTitle}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Personalization Features</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          1
                        </div>
                        <p>Uses your actual career timeline and progression</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          2
                        </div>
                        <p>References real company names and job titles</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          3
                        </div>
                        <p>Mentions specific skills and technologies</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          4
                        </div>
                        <p>Incorporates documented achievements</p>
                      </div>
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
                      <span className="font-semibold text-yellow-800 dark:text-yellow-200">Personalized AI Session Active</span>
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 font-mono">
                      Position: {jobData.jobTitle} | 
                      {careerStats.totalRoles > 0 && ` ${careerStats.totalRoles} roles analyzed |`}
                      {careerStats.totalExperience && ` ${careerStats.totalExperience} experience |`}
                      {careerStats.totalSkills > 0 && ` ${careerStats.totalSkills} skills extracted`}
                    </div>
                  </div>
                </div>
              )}

              {/* Final CTA */}
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
                        🎤 Start Your Personalized Interview
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