import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, jobDescription, uploadedFiles, documentAnalyses, targetLanguage = 'en' } = await req.json()

    console.log("Enhanced profile analysis for:", {
      jobTitle,
      jobDescription: jobDescription?.length,
      uploadedFiles: uploadedFiles?.length,
      documentAnalyses: documentAnalyses?.length,
      targetLanguage
    })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Verifica che abbiamo dati sufficienti per l'analisi
    const hasJobTitle = jobTitle?.trim()
    const hasJobDescription = jobDescription?.trim()
    const hasDocuments = documentAnalyses && documentAnalyses.length > 0
    const hasFiles = uploadedFiles && uploadedFiles.length > 0

    if (!hasJobTitle) {
      return NextResponse.json({
        success: false,
        error: 'Job title is required for analysis'
      }, { status: 400 })
    }

    if (!hasJobDescription && !hasDocuments && !hasFiles) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient data: need either job description or uploaded documents for analysis'
      }, { status: 400 })
    }

    // Build comprehensive context with focus - ALWAYS IN ENGLISH FIRST
    let fullContext = `CANDIDATE PROFILE FOR INTERVIEW PREPARATION:

Interview Position: ${jobTitle}

Role Context and Requirements: ${jobDescription || 'Position requirements to be determined based on candidate background'}`

    // Add enhanced work experience context
    if (documentAnalyses && documentAnalyses.length > 0) {
      fullContext += `\n\n=== COMPREHENSIVE CANDIDATE BACKGROUND ANALYSIS ===\n`
      fullContext += `Documents analyzed: ${documentAnalyses.length} files\n`

      documentAnalyses.forEach((analysis: any, index: number) => {
        const fileName = uploadedFiles?.[index] || `Document ${index + 1}`

        fullContext += `\nDocument: ${fileName}
Document Type: ${analysis.documentType || 'Professional Document'}
Professional Summary: ${analysis.summary || 'Professional background document'}

EXTRACTED SKILLS AND COMPETENCIES:
Technical Skills: ${(analysis.extractedSkills || []).join(', ') || 'Skills to be identified during interview'}
Industry Experience: ${(analysis.experienceDetails?.industries || []).join(', ') || 'Industry experience to be discussed'}
Functional Areas: ${(analysis.experienceDetails?.functionalAreas || []).join(', ') || 'Professional areas to be explored'}

WORK EXPERIENCE:
Total Professional Experience: ${analysis.experienceDetails?.totalYears || 'Professional experience to be determined'}
Career Level: ${analysis.experienceDetails?.careerLevel || 'Career level to be assessed'}
`

        // Add detailed work history
        if (analysis.experienceDetails?.workHistory && analysis.experienceDetails.workHistory.length > 0) {
          fullContext += `\nWORK HISTORY (Most Recent First):\n`

          analysis.experienceDetails.workHistory.forEach((job: any, jobIndex: number) => {
            fullContext += `
${jobIndex + 1}. ${job.position || 'Professional Role'} at ${job.company || 'Organization'}
   Period: ${job.startDate || 'Start Date'} - ${job.endDate || 'End Date'} (${job.duration || 'Duration TBD'})
   Industry: ${job.industry || 'Industry to be specified'}
   Company Size: ${job.companySize || 'Company size to be determined'}
   Key Responsibilities: ${(job.responsibilities || ['Professional responsibilities to be discussed']).join(', ')}
   Technologies Used: ${(job.technologies || ['Technologies to be identified']).join(', ')}
   Achievements: ${(job.achievements || ['Achievements to be highlighted']).join(', ')}
`
          })
        }

        // Add career progression insights
        if (analysis.careerProgression) {
          fullContext += `\nCAREER PROGRESSION ANALYSIS:
Seniority Trend: ${analysis.careerProgression.seniorityTrend || 'Progression to be analyzed'}
Industry Focus: ${analysis.careerProgression.industryFocus || 'Industry focus to be determined'}
Leadership Experience: ${analysis.careerProgression.leadershipExperience || 'Leadership experience to be assessed'}
`
        }

        // Add education and certifications
        if (analysis.education) {
          fullContext += `\nEDUCATION & CERTIFICATIONS:
Degrees: ${(analysis.education.degrees || ['Educational background to be discussed']).join(', ')}
Institutions: ${(analysis.education.institutions || ['Educational institutions to be specified']).join(', ')}
Certifications: ${(analysis.education.certifications || ['Certifications to be mentioned']).join(', ')}
`
        }

        // Add contact information if available
        if (analysis.contactInfo) {
          fullContext += `\nCONTACT INFORMATION:
Email: ${analysis.contactInfo.email || 'Contact email to be provided'}
Phone: ${analysis.contactInfo.phone || 'Contact phone to be provided'}
Location: ${analysis.contactInfo.location || 'Location to be specified'}
LinkedIn: ${analysis.contactInfo.linkedin || 'LinkedIn profile to be shared'}
Portfolio: ${analysis.contactInfo.portfolio || 'Portfolio to be presented'}
`
        }

        fullContext += `\nKEY ACHIEVEMENTS: ${(analysis.keyAchievements || ['Professional achievements to be highlighted']).join(', ')}\n`
      })

      fullContext += `\nIMPORTANT: The above work experience data has been extracted from actual CV documents and represents REAL career history that should be referenced in interview responses.`
    } else if (uploadedFiles && uploadedFiles.length > 0) {
      fullContext += `\n\n=== CANDIDATE DOCUMENTS ===\n`
      fullContext += `Documents provided: ${uploadedFiles.length} files\n`
      fullContext += `Files: ${uploadedFiles.join(', ')}\n`
      fullContext += `Note: Documents contain professional background information relevant to the ${jobTitle} position.`
    }

    // Create comprehensive analysis prompt - ALWAYS IN ENGLISH
    const analysisPrompt = `You are analyzing a candidate's complete professional profile for advanced interview preparation. This candidate will be answering interview questions based on their ACTUAL work experience and documented career history.

Based on the interview position, context, and detailed work experience extracted from CV documents, provide a comprehensive analysis that enables an AI to respond accurately as this candidate during interviews.

CONTEXT TO ANALYZE:
${fullContext}

Create a detailed analysis focusing on:
1. PROFESSIONAL PROFILE: Comprehensive overview based on actual work experience
2. CAREER PROGRESSION: Analysis of seniority growth and industry expertise over time
3. EXPERIENCE HIGHLIGHTS: Concrete examples from their actual work history
4. TECHNICAL EVOLUTION: How their technical skills developed through different roles
5. INDUSTRY EXPERTISE: Deep domain knowledge gained through career progression
6. LEADERSHIP JOURNEY: Evidence of growing responsibilities and team management
7. ROLE ALIGNMENT: How their experience aligns with target position
8. INTERVIEW STRATEGY: How to leverage their actual career progression in responses

CRITICAL INSTRUCTIONS:
- Use ONLY actual information extracted from the work experience
- Reference specific companies, job titles, years, and achievements from their CV when available
- Build responses around their REAL career progression and industry expertise
- Make recommendations based on their actual professional development path
- Highlight how their experience evolution matches the target role requirements
- If specific information is not available, indicate this clearly rather than creating fictional data
- All content must be in English (will be translated later if needed)

Respond with detailed JSON in this exact format:
{
  "candidate_profile": "Comprehensive professional overview based on actual work experience and career progression, or clear indication of what information is available",
  "career_progression_analysis": "Detailed analysis of how the candidate's career has evolved over time, based on documented information, including seniority growth and industry expertise development",
  "key_strengths": ["Actual strength 1 from work history", "Documented strength 2 from career progression", "Verified strength 3 from industry expertise", "Confirmed strength 4 from technical evolution"],
  "experience_highlights": ["Specific example 1 from actual work history with company and timeframe when available", "Documented example 2 from career progression", "Verified example 3 from professional achievements"],
  "technical_competencies": ["Actual skill 1 from CV with years of experience when available", "Documented skill 2 from multiple roles", "Verified skill 3 from career progression", "Confirmed skill 4 from latest positions", "Extracted skill 5 from documented projects"],
  "industry_expertise": ["Domain knowledge 1 from career history when available", "Sector expertise 2 from work progression", "Industry insight 3 from multiple roles or as applicable"],
  "leadership_and_management": "Analysis of leadership roles and team management experience based on actual job titles and responsibilities when available, or indication of leadership potential",
  "potential_challenges": ["Realistic challenge 1 based on role gap analysis from actual experience", "Realistic challenge 2 based on available information or areas for development"],
  "interview_strategy": "Detailed strategy based on actual career progression when available and how to present the professional journey for maximum impact",
  "role_fit_analysis": "Analysis of how actual work experience and career progression matches target role requirements, based on available information",
  "preparation_recommendations": ["Specific tip 1 based on real career progression when available", "Professional recommendation 2 based on actual work history", "Career-focused advice 3 based on documented achievements"],
  "chronological_talking_points": [
    {
      "period": "Most recent role period when available",
      "company": "Actual company name when available",
      "position": "Actual job title when available", 
      "key_talking_points": ["Achievement 1 when available", "Achievement 2 from documentation", "Skills developed from experience"],
      "interview_relevance": "How this role relates to target position based on available information"
    }
  ],
  "career_narrative": "Cohesive story of professional development that connects all available roles and leads to the target position",
  "keySkills": ["Real skill 1 with experience level when available", "Documented skill 2 with expertise depth", "Verified skill 3 with industry context", "Confirmed skill 4 with progression evidence", "Extracted skill 5 with recent usage", "Professional skill 6 with advanced proficiency"],
  "interviewAreas": ["Area 1 based on actual experience when available", "Area 2 from career progression", "Area 3 from industry expertise", "Area 4 from technical evolution", "Area 5 from leadership journey"],
  "strengths": ["Strength 1 from documented experience", "Strength 2 from career progression", "Strength 3 from industry expertise", "Strength 4 from technical depth"],
  "complexity": "Medium/High based on career complexity and seniority when determinable",
  "matchScore": 85,
  "profileInsights": ["Insight 1 about career-role fit based on actual progression", "Insight 2 about industry alignment from work history", "Insight 3 about technical readiness from skill evolution", "Insight 4 about leadership potential from documented experience"]
}

IMPORTANT: Only include information that can be verified from the provided context. If specific details are not available, use phrases like "based on available information", "when documented", "as indicated in background", rather than creating fictional details.

Respond ONLY with valid JSON, no additional text or markdown.`

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: analysisPrompt,
      temperature: 0.2,
      maxTokens: 3000,
    })

    console.log("Enhanced AI Analysis completed")

    // Clean the response
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse the AI response
    let analysis = JSON.parse(cleanedText)

    // Translate to target language if not English
    if (targetLanguage !== 'en') {
      analysis = await translateProfileAnalysis(analysis, targetLanguage)
    }

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('Error analyzing profile:', error)

    // NO FALLBACK HARDCODATO - ritorna errore se non possiamo analizzare
    return NextResponse.json({
      success: false,
      error: 'Analysis failed - insufficient data or processing error',
      details: 'Please ensure you have provided adequate information (job title + description or documents) for analysis'
    }, { status: 500 })
  }
}

// Function to generate AI-powered fallback analysis ONLY based on real data
async function generateFallbackAnalysis(jobTitle: string, targetLanguage: string, documentAnalyses: any[] = []) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No API key for fallback')
    }

    // Extract ONLY real information from document analyses
    let workExperience = ""
    let totalYears = ""
    let industries: string[] = []
    let skills: string[] = []
    let companies: string[] = []

    if (documentAnalyses && documentAnalyses.length > 0) {
      const firstAnalysis = documentAnalyses[0]
      if (firstAnalysis.experienceDetails) {
        totalYears = firstAnalysis.experienceDetails.totalYears || ""
        industries = firstAnalysis.experienceDetails.industries || []
        companies = firstAnalysis.experienceDetails.companies || []
        skills = firstAnalysis.extractedSkills || []

        if (firstAnalysis.experienceDetails.workHistory && firstAnalysis.experienceDetails.workHistory.length > 0) {
          const recentRole = firstAnalysis.experienceDetails.workHistory[0]
          workExperience = `Recent experience as ${recentRole.position} at ${recentRole.company}`
        }
      }
    }

    // Se non abbiamo dati sufficienti, non creare un fallback
    if (!workExperience && !totalYears && industries.length === 0 && skills.length === 0) {
      throw new Error('Insufficient data for meaningful analysis')
    }

    const fallbackPrompt = `Generate a professional candidate profile analysis for someone applying for a ${jobTitle} position based ONLY on the following REAL extracted data:

${workExperience ? `Work Experience: ${workExperience}` : ''}
${totalYears ? `Total Experience: ${totalYears}` : ''}
${industries.length > 0 ? `Industries: ${industries.join(', ')}` : ''}
${skills.length > 0 ? `Documented Skills: ${skills.slice(0, 10).join(', ')}` : ''}
${companies.length > 0 ? `Companies: ${companies.slice(0, 5).join(', ')}` : ''}

CRITICAL: Use ONLY the information provided above. Do not create fictional data. If information is not available, indicate this clearly.

Respond with JSON in this exact format:
{
  "candidate_profile": "Professional overview for ${jobTitle} candidate based on documented information",
  "career_progression_analysis": "Analysis based on available career progression data",
  "key_strengths": ["Documented strength 1", "Verified strength 2", "Confirmed strength 3", "Available strength 4"],
  "experience_highlights": ["Real experience example 1", "Documented example 2", "Verified example 3"],
  "technical_competencies": ${skills.length > 0 ? JSON.stringify(skills.slice(0, 6)) : '["Technical competencies to be discussed during interview"]'},
  "industry_expertise": ${industries.length > 0 ? JSON.stringify(industries.slice(0, 3)) : '["Industry expertise to be assessed during interview"]'},
  "leadership_and_management": "Leadership experience assessment based on available role information",
  "potential_challenges": ["Area for discussion based on role requirements", "Professional development opportunity"],
  "interview_strategy": "Strategy based on documented experience and ${jobTitle} role requirements",
  "role_fit_analysis": "Analysis of documented experience alignment with ${jobTitle} position",
  "preparation_recommendations": ["Tip based on documented experience", "Recommendation based on available information", "Advice based on role requirements"],
  "chronological_talking_points": [
    {
      "period": "${workExperience ? 'Recent professional period' : 'Professional experience period'}",
      "company": "${companies.length > 0 ? companies[0] : 'Professional organization'}",
      "position": "${workExperience ? 'Recent role' : 'Professional position'}",
      "key_talking_points": ["Documented achievement 1", "Professional accomplishment 2", "Verified contribution 3"],
      "interview_relevance": "Relevance to ${jobTitle} position based on available information"
    }
  ],
  "career_narrative": "Professional story based on documented information leading to ${jobTitle} opportunity",
  "keySkills": ${skills.length > 0 ? JSON.stringify(skills.slice(0, 6)) : '["Professional Skills", "Technical Competency", "Communication", "Problem Solving", "Industry Knowledge", "Professional Development"]'},
  "interviewAreas": ["Professional experience discussion", "Technical competency based on documentation", "Career progression narrative", "Industry knowledge assessment", "Role alignment exploration"],
  "strengths": ["Documented professional background", "Verified technical competency", "Career progression evidence", "Industry expertise proof"],
  "complexity": "${skills.length > 5 && workExperience ? 'Medium' : 'Basic'}",
  "matchScore": ${Math.min(90, Math.max(70, 75 + skills.length + (workExperience ? 10 : 0)))},
  "profileInsights": ["Professional insight based on documented career data", "Technical insight from verified competencies", "Experience insight from available progression", "Industry insight from documented background"]
}

Make it professional and realistic based ONLY on the provided data. All content in English.`

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: fallbackPrompt,
      temperature: 0.3,
      maxTokens: 2000,
    })

    let fallbackAnalysis = JSON.parse(text.trim())

    // Translate if needed
    if (targetLanguage !== 'en') {
      fallbackAnalysis = await translateProfileAnalysis(fallbackAnalysis, targetLanguage)
    }

    return fallbackAnalysis

  } catch (fallbackError) {
    console.error('Fallback generation failed:', fallbackError)
    throw new Error('Cannot generate meaningful analysis with available data')
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
- Company names
- Technology names
- Technical terms commonly used in English

${JSON.stringify(analysis, null, 2)}

Respond with the translated JSON maintaining the exact same structure and field names.`

    const { text: translatedText } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: translatePrompt,
      temperature: 0.1,
      maxTokens: 2500,
    })

    return JSON.parse(translatedText.trim())
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