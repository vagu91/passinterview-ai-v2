// app/api/intelligent-summary/route.ts - INTELLIGENT DOCUMENT SUMMARIZATION
// Implements semantic chunking and consolidation based on OpenAI forum best practices

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'
import { 
  performSemanticChunking, 
  consolidateDocumentSections, 
  type DocumentSection,
  type ConsolidatedSummary 
} from '@/lib/smartDocumentSummarizer'

export async function POST(req: NextRequest) {
  try {
    console.log("🧠 Intelligent summarization API called")
    
    const body = await req.json()
    const { 
      documentAnalyses = [], 
      jobContext = "",
      targetLanguage = "en" 
    } = body

    console.log("Intelligent summarization input:", {
      documentsCount: documentAnalyses.length,
      hasJobContext: !!jobContext,
      targetLanguage,
      documentTypes: documentAnalyses.map((d: any) => d.documentType)
    })

    if (!documentAnalyses || documentAnalyses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No document analyses provided for intelligent summarization'
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log("OpenAI not configured, using enhanced local consolidation")
      return getEnhancedLocalSummary(documentAnalyses, jobContext)
    }

    // STEP 1: Perform semantic chunking on all documents
    console.log("📑 Step 1: Performing semantic chunking...")
    const allSections: DocumentSection[] = []
    
    for (const analysis of documentAnalyses) {
      if (analysis.summary && analysis.summary.length > 100) {
        const documentContent = `
DOCUMENT TYPE: ${analysis.documentType}
SUMMARY: ${analysis.summary}
SKILLS: ${(analysis.extractedSkills || []).join(', ')}
EXPERIENCE: ${analysis.experienceDetails?.totalYears || 'Not specified'}
ACHIEVEMENTS: ${(analysis.keyAchievements || []).join(', ')}
        `.trim()
        
        const sections = performSemanticChunking(documentContent, analysis.documentType)
        allSections.push(...sections)
      }
    }

    console.log(`📋 Semantic chunking completed: ${allSections.length} sections identified`)

    // STEP 2: Consolidate sections into unified profile
    console.log("🔄 Step 2: Consolidating document sections...")
    const baseConsolidation = await consolidateDocumentSections(allSections, documentAnalyses)

    // STEP 3: AI-enhanced intelligent summarization
    console.log("🤖 Step 3: AI-enhanced intelligent summarization...")
    const intelligentSummary = await createIntelligentSummary(
      baseConsolidation, 
      allSections, 
      jobContext,
      targetLanguage
    )

    // STEP 4: Create interview-ready context
    console.log("🎯 Step 4: Creating interview-ready context...")
    const interviewContext = await buildInterviewContext(
      intelligentSummary,
      jobContext,
      targetLanguage
    )

    const finalSummary = {
      ...intelligentSummary,
      interviewContext,
      metadata: {
        sectionsProcessed: allSections.length,
        documentsAnalyzed: documentAnalyses.length,
        processingMethod: 'intelligent_ai_consolidation',
        language: targetLanguage,
        timestamp: new Date().toISOString()
      }
    }

    console.log("✅ Intelligent summarization completed successfully")

    return NextResponse.json({
      success: true,
      summary: finalSummary,
      consolidationQuality: {
        sectionsAnalyzed: allSections.length,
        documentsProcessed: documentAnalyses.length,
        technicalSkillsFound: finalSummary.technicalProfile.coreTechnologies.length,
        workExperiencesConsolidated: documentAnalyses.filter(d => d.experienceDetails?.workHistory?.length > 0).length,
        interviewReadinessScore: calculateReadinessScore(finalSummary)
      }
    })

  } catch (error) {
    console.error('🚨 Intelligent summarization error:', error)
    return NextResponse.json({
      success: false,
      error: 'Intelligent summarization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function createIntelligentSummary(
  baseConsolidation: ConsolidatedSummary,
  sections: DocumentSection[],
  jobContext: string,
  targetLanguage: string
): Promise<ConsolidatedSummary> {
  
  const consolidationPrompt = `You are an expert career consultant and interview coach. Analyze this candidate's consolidated profile and create an intelligent, interview-ready summary.

CANDIDATE CONSOLIDATED DATA:
${JSON.stringify(baseConsolidation, null, 2)}

JOB CONTEXT (if provided): 
${jobContext || "No specific job context provided"}

HIGH-PRIORITY DOCUMENT SECTIONS:
${sections.slice(0, 5).map(s => `
SECTION: ${s.title} (Priority: ${s.priority})
CONTENT: ${s.content.substring(0, 500)}...
KEYWORDS: ${s.keywords.join(', ')}
`).join('\n')}

INSTRUCTIONS FOR INTELLIGENT ENHANCEMENT:
1. Refine the professional summary to be compelling and interview-ready
2. Enhance technical profile categorization with accurate skill groupings
3. Improve work experience narrative to show clear career progression
4. Identify the strongest achievements and quantify them where possible
5. Create specific, actionable interview talking points
6. Develop contextual insights that help AI respond naturally as this candidate
7. If job context is provided, tailor everything to show relevance

ENHANCED OUTPUT FORMAT (respond with valid JSON, no markdown):
{
  "candidateProfile": {
    "name": "Name if found",
    "title": "Professional title that best represents their experience level",
    "location": "Location if available",
    "contact": {
      "email": "email if found",
      "phone": "phone if found", 
      "linkedin": "linkedin if found"
    }
  },
  "professionalSummary": {
    "overview": "Compelling 2-3 sentence professional summary highlighting unique value proposition",
    "keyStrengths": ["Top 6-8 core strengths"],
    "careerLevel": "Junior/Mid-level/Senior/Executive with context",
    "industryExpertise": ["Specific industry domains with depth"]
  },
  "workExperience": {
    "totalYears": "Accurate calculation with context",
    "currentRole": {
      "title": "Current position title",
      "company": "Current company",
      "duration": "Time in current role",
      "highlights": ["Key accomplishments in current role"]
    },
    "careerHighlights": ["Top 6 career achievements with impact"],
    "industryProgression": "Clear narrative of career growth and transitions"
  },
  "technicalProfile": {
    "coreTechnologies": ["Primary programming languages and core tech"],
    "frameworks": ["Frameworks and libraries with proficiency context"],
    "tools": ["Development and productivity tools"],
    "methodologies": ["Development methodologies and practices"]
  },
  "achievements": {
    "quantifiable": ["Specific achievements with numbers/percentages"],
    "leadership": ["Leadership and team management examples"],
    "technical": ["Technical innovations and implementations"],
    "business": ["Business impact and value creation"]
  },
  "education": {
    "formal": ["Degrees with institutions and years"],
    "certifications": ["Professional certifications"],
    "continuousLearning": ["Recent learning and development"]
  },
  "interviewReadiness": {
    "techQuestionTopics": ["Specific technical topics they can discuss"],
    "behavioralScenarios": ["Real scenarios from their experience for STAR responses"],
    "projectExamples": ["Specific projects they can detail in interviews"],
    "companyFitAreas": ["Areas where they align with typical company values"]
  },
  "contextualInsights": {
    "communicationStyle": "How they likely communicate based on documents",
    "problemSolvingApproach": "Their approach to technical challenges",
    "leadershipStyle": "Leadership approach if evident",
    "collaborationPreferences": "How they work with teams"
  }
}

QUALITY REQUIREMENTS:
- Make everything specific and actionable for interview responses
- Ensure technical skills are accurately categorized
- Create natural talking points the AI can use to respond as this candidate
- Focus on creating authentic, interview-ready content
- Maintain professional tone throughout`

  try {
    const { text: enhancedSummary } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: consolidationPrompt,
      temperature: 0.2,
      maxTokens: 2000,
    })

    // Parse and clean the response
    let cleanedSummary = enhancedSummary.trim()
    cleanedSummary = cleanedSummary
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/i, '')

    const jsonMatch = cleanedSummary.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedSummary = jsonMatch[0]
    }

    const intelligentSummary = JSON.parse(cleanedSummary)
    
    console.log("🎯 AI-enhanced intelligent summary created successfully")
    return intelligentSummary

  } catch (error) {
    console.warn("AI enhancement failed, using base consolidation:", error)
    return baseConsolidation
  }
}

async function buildInterviewContext(
  summary: ConsolidatedSummary,
  jobContext: string,
  targetLanguage: string
): Promise<any> {
  
  const contextPrompt = `Create specific interview response context for this candidate that an AI can use to answer questions naturally as if it were them.

CANDIDATE SUMMARY:
${JSON.stringify(summary, null, 2)}

JOB CONTEXT:
${jobContext || "General interview preparation"}

Create a comprehensive interview response framework that includes:

1. TECHNICAL QUESTION RESPONSES: Specific talking points for common technical questions
2. BEHAVIORAL EXAMPLES: Real examples from their experience for STAR method responses  
3. COMPANY RESEARCH TALKING POINTS: How their background aligns with company needs
4. WEAKNESS/CHALLENGE RESPONSES: Authentic areas for improvement with growth plans
5. QUESTIONS TO ASK: Thoughtful questions they should ask interviewers

Respond with JSON format for easy AI consumption:
{
  "technicalResponses": {
    "coreTechnologies": ["Specific talking points about their main tech stack"],
    "projectExamples": ["Detailed project descriptions they can reference"],
    "problemSolving": ["Examples of how they approach technical challenges"]
  },
  "behavioralExamples": {
    "leadership": ["Specific examples of leadership experience"],
    "teamwork": ["Collaboration and conflict resolution examples"],
    "initiative": ["Times they went above and beyond"],
    "adaptability": ["How they handled change or learned new skills"]
  },
  "companyAlignment": {
    "valueProposition": "Why they're a great fit for the role",
    "industryRelevance": "How their background applies to this industry",
    "growthPotential": "How they can contribute and grow with the company"
  },
  "authenticChallenges": {
    "areasForGrowth": ["Honest areas they're working to improve"],
    "learningGoals": ["What they want to develop further"],
    "approachToWeaknesses": "How they handle and improve upon weaknesses"
  },
  "questionsToAsk": [
    "Thoughtful questions about company culture",
    "Questions about team dynamics and collaboration", 
    "Questions about growth and development opportunities",
    "Technical questions about architecture and tools"
  ]
}`

  try {
    const { text: contextResponse } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: contextPrompt,
      temperature: 0.3,
      maxTokens: 1500,
    })

    // Parse the context response
    let cleanedContext = contextResponse.trim()
    cleanedContext = cleanedContext
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/i, '')

    const jsonMatch = cleanedContext.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedContext = jsonMatch[0]
    }

    const interviewContext = JSON.parse(cleanedContext)
    
    console.log("🎤 Interview context created successfully")
    return interviewContext

  } catch (error) {
    console.warn("Interview context creation failed, using fallback:", error)
    return createFallbackInterviewContext(summary)
  }
}

function createFallbackInterviewContext(summary: ConsolidatedSummary) {
  return {
    technicalResponses: {
      coreTechnologies: summary.technicalProfile.coreTechnologies.slice(0, 5),
      projectExamples: summary.achievements.technical.slice(0, 3),
      problemSolving: ["Analytical approach", "Research and experimentation", "Collaborative problem-solving"]
    },
    behavioralExamples: {
      leadership: summary.achievements.leadership.slice(0, 2),
      teamwork: ["Cross-functional collaboration", "Mentoring team members"],
      initiative: summary.achievements.business.slice(0, 2),
      adaptability: ["Learning new technologies", "Adapting to changing requirements"]
    },
    companyAlignment: {
      valueProposition: summary.professionalSummary.overview,
      industryRelevance: summary.professionalSummary.industryExpertise.join(', '),
      growthPotential: "Continuous learning and professional development"
    },
    authenticChallenges: {
      areasForGrowth: ["Time management", "Public speaking", "Advanced leadership skills"],
      learningGoals: ["Staying current with emerging technologies", "Developing strategic thinking"],
      approachToWeaknesses: "Proactive learning and seeking feedback"
    },
    questionsToAsk: [
      "What does success look like in this role?",
      "How does the team collaborate on projects?",
      "What are the biggest technical challenges facing the team?",
      "What opportunities are there for professional development?"
    ]
  }
}

function getEnhancedLocalSummary(documentAnalyses: any[], jobContext: string) {
  // Enhanced local fallback with better organization
  const consolidatedData = {
    candidateProfile: {
      title: "Professional",
      location: undefined,
      contact: {}
    },
    professionalSummary: {
      overview: "Experienced professional with strong background and technical expertise",
      keyStrengths: Array.from(new Set(documentAnalyses.flatMap(d => d.extractedSkills || []))).slice(0, 8),
      careerLevel: "Professional",
      industryExpertise: ["Technology", "Professional Services"]
    },
    workExperience: {
      totalYears: documentAnalyses[0]?.experienceDetails?.totalYears || "Professional experience",
      careerHighlights: Array.from(new Set(documentAnalyses.flatMap(d => d.keyAchievements || []))).slice(0, 6),
      industryProgression: "Progressive career development"
    },
    technicalProfile: {
      coreTechnologies: [],
      frameworks: [],
      tools: [],
      methodologies: []
    },
    achievements: {
      quantifiable: [],
      leadership: [],
      technical: [],
      business: []
    },
    education: {
      formal: [],
      certifications: [],
      continuousLearning: []
    },
    interviewReadiness: {
      techQuestionTopics: Array.from(new Set(documentAnalyses.flatMap(d => d.extractedSkills || []))).slice(0, 10),
      behavioralScenarios: [
        "Problem-solving experience",
        "Team collaboration",
        "Learning new technologies",
        "Overcoming challenges"
      ],
      projectExamples: documentAnalyses.flatMap(d => d.keyAchievements || []).slice(0, 5),
      companyFitAreas: [
        "Technical expertise",
        "Professional communication",
        "Continuous learning",
        "Team collaboration"
      ]
    },
    contextualInsights: {
      communicationStyle: "Professional and clear",
      problemSolvingApproach: "Methodical and analytical",
      collaborationPreferences: "Team-oriented and supportive"
    },
    interviewContext: createFallbackInterviewContext({} as ConsolidatedSummary),
    metadata: {
      sectionsProcessed: documentAnalyses.length,
      documentsAnalyzed: documentAnalyses.length,
      processingMethod: 'enhanced_local_consolidation',
      language: 'en',
      timestamp: new Date().toISOString()
    }
  }

  return NextResponse.json({
    success: true,
    summary: consolidatedData,
    consolidationQuality: {
      sectionsAnalyzed: documentAnalyses.length,
      documentsProcessed: documentAnalyses.length,
      technicalSkillsFound: consolidatedData.professionalSummary.keyStrengths.length,
      workExperiencesConsolidated: documentAnalyses.length,
      interviewReadinessScore: 85
    }
  })
}

function calculateReadinessScore(summary: ConsolidatedSummary): number {
  let score = 0
  
  // Technical profile completeness (30 points)
  if (summary.technicalProfile.coreTechnologies.length > 0) score += 10
  if (summary.technicalProfile.frameworks.length > 0) score += 10
  if (summary.technicalProfile.tools.length > 0) score += 10
  
  // Experience details (30 points)
  if (summary.workExperience.totalYears !== "Not specified") score += 15
  if (summary.workExperience.careerHighlights.length > 0) score += 15
  
  // Interview readiness (25 points)
  if (summary.interviewReadiness.techQuestionTopics.length >= 5) score += 15
  if (summary.interviewReadiness.projectExamples.length >= 3) score += 10
  
  // Achievements (15 points)
  if (summary.achievements.quantifiable.length > 0) score += 5
  if (summary.achievements.technical.length > 0) score += 5
  if (summary.achievements.leadership.length > 0) score += 5
  
  return Math.min(score, 100)
}