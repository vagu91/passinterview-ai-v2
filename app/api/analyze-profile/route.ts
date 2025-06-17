import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, jobDescription, uploadedFiles, documentAnalyses, targetLanguage = 'en' } = await req.json()

    console.log("Real data profile analysis for:", {
      jobTitle,
      jobDescription: jobDescription?.length,
      uploadedFiles: uploadedFiles?.length,
      documentAnalyses: documentAnalyses?.length,
      targetLanguage
    })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Check if we have real document data to work with
    if (!documentAnalyses || documentAnalyses.length === 0) {
      console.log("No document analyses available, creating basic analysis")
      return NextResponse.json({
        success: true,
        analysis: createBasicAnalysis(jobTitle, jobDescription)
      })
    }

    // Filter out failed document analyses
    const validAnalyses = documentAnalyses.filter((analysis: any) => 
      analysis && !analysis.error && (
        (analysis.experienceDetails?.workHistory && analysis.experienceDetails.workHistory.length > 0) ||
        (analysis.extractedSkills && analysis.extractedSkills.length > 0) ||
        (analysis.keyAchievements && analysis.keyAchievements.length > 0)
      )
    )

    if (validAnalyses.length === 0) {
      console.log("No valid document analyses found, creating basic analysis")
      return NextResponse.json({
        success: true,
        analysis: createBasicAnalysis(jobTitle, jobDescription)
      })
    }

    // Build comprehensive context with real data only - ALWAYS IN ENGLISH FIRST
    let fullContext = `CANDIDATE PROFILE FOR INTERVIEW PREPARATION:

Interview Position: ${jobTitle}

Role Context and Requirements: ${jobDescription}

=== REAL EXTRACTED CANDIDATE DATA ===
Documents analyzed: ${validAnalyses.length} files with valid data extraction

`

    // Add real extracted data context
    validAnalyses.forEach((analysis: any, index: number) => {
      const fileName = uploadedFiles?.[index] || `Document ${index + 1}`

      fullContext += `
Document: ${fileName}
Document Type: ${analysis.documentType || 'Professional Document'}
Extraction Quality: ${analysis.extractionMethod || 'processed'}

`

      // Add real skills if available
      if (analysis.extractedSkills && analysis.extractedSkills.length > 0) {
        fullContext += `REAL EXTRACTED SKILLS:
${analysis.extractedSkills.join(', ')}

`
      }

      // Add real work experience if available
      if (analysis.experienceDetails?.workHistory && analysis.experienceDetails.workHistory.length > 0) {
        fullContext += `REAL WORK EXPERIENCE:
Total Professional Experience: ${analysis.experienceDetails.totalYears || 'Multiple years'}
Career Level: ${analysis.experienceDetails.careerLevel || 'Professional'}

DOCUMENTED WORK HISTORY (Most Recent First):
`

        analysis.experienceDetails.workHistory.forEach((job: any, jobIndex: number) => {
          if (job.company || job.position) {
            fullContext += `
${jobIndex + 1}. ${job.position || 'Professional Role'} at ${job.company || 'Company'}
   Period: ${job.startDate || 'Start'} - ${job.endDate || 'End'} ${job.duration ? `(${job.duration})` : ''}
   Industry: ${job.industry || 'Professional sector'}
   Key Responsibilities: ${(job.responsibilities || []).join(', ') || 'Professional responsibilities'}
   Technologies Used: ${(job.technologies || []).join(', ') || 'Professional tools'}
   Achievements: ${(job.achievements || []).join(', ') || 'Professional accomplishments'}
`
          }
        })
      }

      // Add real achievements if available
      if (analysis.keyAchievements && analysis.keyAchievements.length > 0) {
        fullContext += `
REAL KEY ACHIEVEMENTS:
${analysis.keyAchievements.join(', ')}
`
      }

      // Add real education if available
      if (analysis.education && (analysis.education.degrees?.length > 0 || analysis.education.certifications?.length > 0)) {
        fullContext += `
REAL EDUCATION & CERTIFICATIONS:
Degrees: ${(analysis.education.degrees || []).join(', ') || 'Not specified'}
Certifications: ${(analysis.education.certifications || []).join(', ') || 'Not specified'}
`
      }

      // Add real contact information if available
      if (analysis.contactInfo) {
        const realContactFields = Object.entries(analysis.contactInfo)
          .filter(([key, value]) => value && value !== 'not extracted')
          .map(([key, value]) => `${key}: ${value}`)
        
        if (realContactFields.length > 0) {
          fullContext += `
REAL CONTACT INFORMATION:
${realContactFields.join(', ')}
`
        }
      }

      fullContext += `\n`
    })

    fullContext += `\nIMPORTANT: Use ONLY the real extracted data above. Do NOT invent, assume, or add any information not explicitly provided.`

    // Create analysis prompt that works only with real data - ALWAYS IN ENGLISH
    const analysisPrompt = `You are analyzing a candidate's real professional profile extracted from actual documents. Create an interview preparation analysis using ONLY the real extracted data provided.

REAL EXTRACTED DATA TO ANALYZE:
${fullContext}

Create a comprehensive analysis that enables an AI to respond accurately as this candidate during interviews, using ONLY real information.

CRITICAL INSTRUCTIONS:
- Use ONLY real information extracted from the documents
- Do NOT invent, assume, or guess any information
- If specific information is not available, acknowledge the limitation
- Focus on what can be verified from the extracted data
- Reference actual companies, job titles, and experiences only if explicitly provided
- All content must be in English (will be translated later if needed)

Respond with detailed JSON in this exact format:
{
  "candidate_profile": "Professional overview based ONLY on real extracted data",
  "career_progression_analysis": "Analysis based ONLY on documented work history if available",
  "key_strengths": ["Real strength 1 from extracted data", "Real strength 2", "Real strength 3", "Real strength 4"],
  "experience_highlights": ["Real example 1 from actual work history", "Real example 2", "Real example 3"],
  "technical_competencies": ["Real skill 1 from extracted data", "Real skill 2", "Real skill 3", "Real skill 4", "Real skill 5"],
  "industry_expertise": ["Real domain knowledge 1", "Real sector expertise 2", "Real industry insight 3"],
  "leadership_and_management": "Real leadership experience if documented in extracted data, null if not available",
  "potential_challenges": ["Real challenge 1 based on extracted data gaps", "Real challenge 2"],
  "interview_strategy": "Strategy based on real extracted career data and documented experience",
  "role_fit_analysis": "Analysis of how real extracted experience matches target role requirements",
  "preparation_recommendations": ["Real tip 1 based on extracted data", "Real tip 2", "Real tip 3"],
  "chronological_talking_points": [
    {
      "period": "Real period from extracted data",
      "company": "Real company name from documents",
      "position": "Real job title from documents",
      "key_talking_points": ["Real achievement 1", "Real achievement 2", "Real skills used"],
      "interview_relevance": "How this real experience relates to target position"
    }
  ],
  "career_narrative": "Cohesive story based ONLY on real extracted professional data",
  "keySkills": ["Real skill 1", "Real skill 2", "Real skill 3", "Real skill 4", "Real skill 5", "Real skill 6"],
  "interviewAreas": ["Area 1 based on real experience", "Area 2 from extracted data", "Area 3 from documented skills"],
  "strengths": ["Real strength 1", "Real strength 2", "Real strength 3", "Real strength 4"],
  "complexity": "Medium/High based on real career complexity",
  "matchScore": 85,
  "profileInsights": ["Real insight 1 about career-role fit", "Real insight 2 about documented experience", "Real insight 3 about extracted skills"]
}

If insufficient real data is available for any field, use null or empty arrays rather than making up information.

Respond ONLY with valid JSON, no additional text or markdown.`

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: analysisPrompt,
      temperature: 0.2,
      maxTokens: 3000,
    })

    console.log("Real data AI Analysis completed")

    // Clean and validate the response
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse the AI response
    let analysis = JSON.parse(cleanedText)

    // Validate and clean the analysis to ensure only real data
    analysis = validateAndCleanRealDataAnalysis(analysis)

    // Translate to target language if not English
    if (targetLanguage !== 'en') {
      analysis = await translateProfileAnalysis(analysis, targetLanguage)
    }

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('Error analyzing real data profile:', error)

    // Generate fallback with real data only
    const requestData = await req.json().catch(() => ({}))
    const fallbackJobTitle = requestData.jobTitle || 'Professional Position'
    const fallbackTargetLanguage = requestData.targetLanguage || 'en'
    const fallbackResponse = await generateRealDataFallbackAnalysis(
      fallbackJobTitle, 
      fallbackTargetLanguage, 
      requestData.documentAnalyses || []
    )

    return NextResponse.json({
      success: false,
      error: 'Failed to analyze profile',
      analysis: fallbackResponse
    }, { status: 200 })
  }
}

// Function to create basic analysis when no real data is available
function createBasicAnalysis(jobTitle: string, jobDescription: string) {
  return {
    candidate_profile: `Candidate applying for ${jobTitle} position`,
    career_progression_analysis: null,
    key_strengths: [],
    experience_highlights: [],
    technical_competencies: [],
    industry_expertise: [],
    leadership_and_management: null,
    potential_challenges: ["Prepare specific examples from your experience", "Research company-specific requirements"],
    interview_strategy: `Focus on demonstrating fit for ${jobTitle} role based on your background and the job requirements`,
    role_fit_analysis: `Interview preparation for ${jobTitle} position`,
    preparation_recommendations: [
      "Review the job description carefully",
      "Prepare specific examples from your experience",
      "Research the company and industry"
    ],
    chronological_talking_points: [],
    career_narrative: `Professional candidate interested in ${jobTitle} role`,
    keySkills: [],
    interviewAreas: [
      "Role requirements and responsibilities",
      "Your relevant experience and background",
      "Career goals and motivation"
    ],
    strengths: [],
    complexity: "Basic",
    matchScore: 65,
    profileInsights: [
      "Basic interview preparation mode",
      "Upload CV for personalized analysis with real career data"
    ]
  }
}

// Function to validate and clean analysis to ensure only real data
function validateAndCleanRealDataAnalysis(analysis: any) {
  // Filter out any generic or potentially made-up content
  const cleanArray = (arr: any[]) => {
    if (!Array.isArray(arr)) return []
    return arr.filter(item => 
      item && 
      typeof item === 'string' && 
      item.length > 0 &&
      !item.includes('Professional competency') &&
      !item.includes('Technical skill') &&
      !item.includes('Industry knowledge') &&
      !item.includes('Communication') &&
      !item.includes('Problem solving') &&
      !item.includes('Leadership ability')
    )
  }

  return {
    candidate_profile: analysis.candidate_profile || null,
    career_progression_analysis: analysis.career_progression_analysis || null,
    key_strengths: cleanArray(analysis.key_strengths || []),
    experience_highlights: cleanArray(analysis.experience_highlights || []),
    technical_competencies: cleanArray(analysis.technical_competencies || []),
    industry_expertise: cleanArray(analysis.industry_expertise || []),
    leadership_and_management: analysis.leadership_and_management || null,
    potential_challenges: cleanArray(analysis.potential_challenges || []),
    interview_strategy: analysis.interview_strategy || null,
    role_fit_analysis: analysis.role_fit_analysis || null,
    preparation_recommendations: cleanArray(analysis.preparation_recommendations || []),
    chronological_talking_points: Array.isArray(analysis.chronological_talking_points) ? 
      analysis.chronological_talking_points.filter((point: any) => 
        point && point.company && point.position && 
        !point.company.includes('Recent organization') &&
        !point.position.includes('Recent role')
      ) : [],
    career_narrative: analysis.career_narrative || null,
    keySkills: cleanArray(analysis.keySkills || []),
    interviewAreas: cleanArray(analysis.interviewAreas || []),
    strengths: cleanArray(analysis.strengths || []),
    complexity: analysis.complexity || "Basic",
    matchScore: Math.min(Math.max(analysis.matchScore || 65, 60), 95),
    profileInsights: cleanArray(analysis.profileInsights || [])
  }
}

// Function to generate fallback analysis with real data only
async function generateRealDataFallbackAnalysis(jobTitle: string, targetLanguage: string, documentAnalyses: any[] = []) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return createBasicAnalysis(jobTitle, "No detailed analysis available")
    }

    // Extract real data from document analyses if available
    let realSkills: string[] = []
    let realCompanies: string[] = []
    let realRoles: string[] = []
    let totalExperience = ""
    let workHistory: any[] = []

    if (documentAnalyses && documentAnalyses.length > 0) {
      documentAnalyses.forEach((analysis: any) => {
        if (analysis && !analysis.error) {
          if (analysis.extractedSkills) {
            realSkills.push(...analysis.extractedSkills)
          }
          if (analysis.experienceDetails?.companies) {
            realCompanies.push(...analysis.experienceDetails.companies)
          }
          if (analysis.experienceDetails?.roles) {
            realRoles.push(...analysis.experienceDetails.roles)
          }
          if (analysis.experienceDetails?.totalYears) {
            totalExperience = analysis.experienceDetails.totalYears
          }
          if (analysis.experienceDetails?.workHistory) {
            workHistory.push(...analysis.experienceDetails.workHistory)
          }
        }
      })
    }

    // Remove duplicates
    realSkills = [...new Set(realSkills)].filter(Boolean)
    realCompanies = [...new Set(realCompanies)].filter(Boolean)
    realRoles = [...new Set(realRoles)].filter(Boolean)
    workHistory = workHistory.filter(job => job.company || job.position)

    // If we have some real data, create enhanced fallback
    if (realSkills.length > 0 || workHistory.length > 0) {
      const fallbackPrompt = `Generate a minimal professional analysis for a ${jobTitle} candidate based on this REAL extracted data:

REAL SKILLS: ${realSkills.join(', ') || 'None extracted'}
REAL COMPANIES: ${realCompanies.join(', ') || 'None extracted'}
REAL ROLES: ${realRoles.join(', ') || 'None extracted'}
TOTAL EXPERIENCE: ${totalExperience || 'Not specified'}
WORK HISTORY ENTRIES: ${workHistory.length}

Create realistic content based ONLY on this real data. Do not invent information.

Respond with JSON in this exact format:
{
  "candidate_profile": "Professional overview based on real extracted data",
  "career_progression_analysis": "Analysis based on real work history" or null,
  "key_strengths": ["real strength 1", "real strength 2"] or [],
  "experience_highlights": ["real example 1", "real example 2"] or [],
  "technical_competencies": ["real skill 1", "real skill 2"] or [],
  "industry_expertise": ["real domain 1"] or [],
  "leadership_and_management": "real leadership info" or null,
  "potential_challenges": ["prepare examples from real experience"],
  "interview_strategy": "strategy based on real data",
  "role_fit_analysis": "analysis based on real extracted information",
  "preparation_recommendations": ["tip based on real data"],
  "chronological_talking_points": [],
  "career_narrative": "narrative based on real career data",
  "keySkills": ["real skill 1", "real skill 2"] or [],
  "interviewAreas": ["area based on real experience"],
  "strengths": ["real strength from data"],
  "complexity": "Medium",
  "matchScore": 75,
  "profileInsights": ["insight based on real data"]
}

Use English. Include only information that can be verified from the real data provided.`

      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: fallbackPrompt,
        temperature: 0.3,
        maxTokens: 1500,
      })

      let fallbackAnalysis = JSON.parse(text.trim())
      fallbackAnalysis = validateAndCleanRealDataAnalysis(fallbackAnalysis)

      // Translate if needed
      if (targetLanguage !== 'en') {
        fallbackAnalysis = await translateProfileAnalysis(fallbackAnalysis, targetLanguage)
      }

      return fallbackAnalysis
    }

    // If no real data available, return basic analysis
    return createBasicAnalysis(jobTitle, "No detailed CV analysis available")

  } catch (fallbackError) {
    console.error('Real data fallback generation failed:', fallbackError)
    return createBasicAnalysis(jobTitle, "Basic interview preparation mode")
  }
}

// Function to translate profile analysis to target language
async function translateProfileAnalysis(analysis: any, targetLanguage: string) {
  if (!process.env.OPENAI_API_KEY) {
    return analysis
  }

  try {
    const translatePrompt = `Translate this candidate profile analysis from English to ${getLanguageName(targetLanguage)}. 
    
Keep the JSON structure EXACTLY the same, only translate the text content values. Do not translate:
- Field names/keys
- Boolean values  
- Numbers
- Company names (keep as original)
- Technology names (keep as original)
- Technical terms commonly used in English

${JSON.stringify(analysis, null, 2)}

Respond with the translated JSON maintaining the exact same structure and field names.`

    const { text: translatedText } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: translatePrompt,
      temperature: 0.1,
      maxTokens: 2500,
    })

    let cleanedTranslation = translatedText.trim()
    cleanedTranslation = cleanedTranslation
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/i, '')

    const jsonMatch = cleanedTranslation.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedTranslation = jsonMatch[0]
    }

    return JSON.parse(cleanedTranslation)
  } catch (error) {
    console.warn('Translation failed, returning original English:', error)
    return analysis
  }
}

function getLanguageName(langCode: string): string {
  const names: { [key: string]: string } = {
    'it': 'Italian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'nl': 'Dutch'
  }
  return names[langCode] || 'English'
}