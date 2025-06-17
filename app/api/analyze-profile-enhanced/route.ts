import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'AI service not configured'
      }, { status: 500 })
    }

    const requestData = await req.json()
    console.log('Enhanced profile analysis request:', requestData)

    const {
      jobTitle = '',
      jobDescription = '',
      documentAnalyses = [],
      targetLanguage = 'en'
    } = requestData

    // Verifica che abbiamo dati sufficienti
    if (!jobTitle.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Job title is required for analysis'
      }, { status: 400 })
    }

    if (!documentAnalyses || documentAnalyses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No document analyses available - please upload CV or documents first'
      }, { status: 400 })
    }

    // Build context ONLY from real extracted document data
    let documentContext = ""
    let candidateWorkHistory = ""
    let extractedName = ""
    let extractedContact = ""
    let realSkills: string[] = []
    let realCompanies: string[] = []
    let realExperience = ""

    documentAnalyses.forEach((analysis: any, index: number) => {
      documentContext += `\n=== DOCUMENT ${index + 1} ANALYSIS ===\n`
      documentContext += `Type: ${analysis.documentType || 'Professional Document'}\n`
      documentContext += `Summary: ${analysis.summary || 'Document processed'}\n`
      
      // Extract REAL data only
      if (analysis.extractedSkills && Array.isArray(analysis.extractedSkills) && analysis.extractedSkills.length > 0) {
        realSkills.push(...analysis.extractedSkills)
        documentContext += `Skills Extracted: ${analysis.extractedSkills.join(', ')}\n`
      }

      if (analysis.experienceDetails?.companies && Array.isArray(analysis.experienceDetails.companies) && analysis.experienceDetails.companies.length > 0) {
        realCompanies.push(...analysis.experienceDetails.companies)
        documentContext += `Companies: ${analysis.experienceDetails.companies.join(', ')}\n`
      }

      if (analysis.experienceDetails?.totalYears) {
        realExperience = analysis.experienceDetails.totalYears
        documentContext += `Total Experience: ${analysis.experienceDetails.totalYears}\n`
      }

      // Extract work history with REAL data only
      if (analysis.experienceDetails?.workHistory && Array.isArray(analysis.experienceDetails.workHistory) && analysis.experienceDetails.workHistory.length > 0) {
        candidateWorkHistory += `\n=== WORK EXPERIENCE FROM DOCUMENT ${index + 1} ===\n`
        analysis.experienceDetails.workHistory.forEach((job: any, jobIndex: number) => {
          candidateWorkHistory += `${jobIndex + 1}. Position: ${job.position || 'Not specified'}\n`
          candidateWorkHistory += `   Company: ${job.company || 'Not specified'}\n`
          candidateWorkHistory += `   Period: ${job.startDate || 'Not specified'} - ${job.endDate || 'Not specified'}\n`
          
          if (job.duration) candidateWorkHistory += `   Duration: ${job.duration}\n`
          if (job.industry) candidateWorkHistory += `   Industry: ${job.industry}\n`
          if (job.technologies && Array.isArray(job.technologies) && job.technologies.length > 0) {
            candidateWorkHistory += `   Technologies: ${job.technologies.join(', ')}\n`
          }
          if (job.responsibilities && Array.isArray(job.responsibilities) && job.responsibilities.length > 0) {
            candidateWorkHistory += `   Responsibilities: ${job.responsibilities.join('; ')}\n`
          }
          if (job.achievements && Array.isArray(job.achievements) && job.achievements.length > 0) {
            candidateWorkHistory += `   Achievements: ${job.achievements.join('; ')}\n`
          }
          candidateWorkHistory += '\n'
        })
      }

      // Extract contact info if available
      if (analysis.contactInfo) {
        let contactItems: string[] = []
        if (analysis.contactInfo.email && analysis.contactInfo.email !== 'not found') {
          contactItems.push(`Email: ${analysis.contactInfo.email}`)
        }
        if (analysis.contactInfo.phone && analysis.contactInfo.phone !== 'not found') {
          contactItems.push(`Phone: ${analysis.contactInfo.phone}`)
        }
        if (analysis.contactInfo.location && analysis.contactInfo.location !== 'not found') {
          contactItems.push(`Location: ${analysis.contactInfo.location}`)
        }
        if (contactItems.length > 0) {
          extractedContact = contactItems.join(', ')
          documentContext += `Contact Info: ${extractedContact}\n`
        }
      }

      if (analysis.keyAchievements && Array.isArray(analysis.keyAchievements) && analysis.keyAchievements.length > 0) {
        documentContext += `Key Achievements: ${analysis.keyAchievements.join('; ')}\n`
      }
    })

    // Remove duplicates from extracted data
    const uniqueSkills = [...new Set(realSkills)].filter(skill => skill && skill.trim())
    const uniqueCompanies = [...new Set(realCompanies)].filter(company => company && company.trim())

    // Create analysis prompt based ONLY on extracted real data
    const enhancedPrompt = `You are analyzing a candidate's profile based on their actual CV documents for the position of ${jobTitle}.

ROLE BEING ANALYZED: ${jobTitle}
${jobDescription ? `\nROLE DESCRIPTION: ${jobDescription}` : ''}

CANDIDATE DATA EXTRACTED FROM DOCUMENTS:
${documentContext}

${candidateWorkHistory}

EXTRACTED PROFESSIONAL SUMMARY:
- Skills Identified: ${uniqueSkills.length > 0 ? uniqueSkills.join(', ') : 'Skills not clearly identified in documents'}
- Companies Worked: ${uniqueCompanies.length > 0 ? uniqueCompanies.join(', ') : 'Company information not clearly extracted'}
- Experience Level: ${realExperience || 'Experience duration not clearly specified in documents'}
- Contact Information: ${extractedContact || 'Contact details not fully extracted'}

ANALYSIS REQUIREMENTS:
Provide a comprehensive analysis with a mathematical score (0-100) where 100 is perfect match. Base your analysis ONLY on the extracted information above.

CRITICAL: 
- Use ONLY the information extracted from the candidate's documents
- Do not create fictional examples, companies, or experiences
- If information is not available in the extracted data, clearly state this
- Be honest about gaps where document analysis was insufficient
- Reference actual companies, roles, and experiences from the extraction above

Respond with detailed JSON in this exact format:
{
  "match_score": 75,
  "score_breakdown": {
    "skills_match": 70,
    "experience_relevance": 75,
    "career_progression": 80,
    "industry_fit": 70,
    "overall_readiness": 75
  },
  "score_explanation": "Detailed explanation based on extracted document data and how it matches ${jobTitle} requirements",
  "candidate_profile": "Professional summary based ONLY on extracted document information",
  "career_progression_analysis": "Analysis based on actual work history extracted from documents",
  "strengths_vs_requirements": {
    "strong_matches": ["Requirement 1 -> Specific skill/experience from extracted data"],
    "partial_matches": ["Requirement 2 -> Partially matching extracted experience"],
    "gaps": ["Missing requirement not found in extracted data"]
  },
  "gap_analysis": ["Specific gaps based on what was not found in document extraction"],
  "experience_highlights": ["Actual achievements and experiences from extracted document data"],
  "technical_competencies": [
    {"skill": "Actual skill from extraction", "relevance_score": 8, "evidence": "Where found in documents"},
    {"skill": "Another extracted skill", "relevance_score": 6, "evidence": "Context from documents"}
  ],
  "industry_expertise": ["Domain knowledge evident from extracted work history"],
  "leadership_evidence": ["Leadership examples found in extracted data or 'No leadership experience clearly documented'"],
  "interview_strategy": "Strategy based on actual extracted strengths and documented experience",
  "improvement_recommendations": [
    {"area": "Specific area based on gaps", "action": "Actionable step", "priority": "high", "timeline": "3-6 months"},
    {"area": "Another development area", "action": "Specific action", "priority": "medium", "timeline": "6-12 months"}
  ],
  "risk_mitigation": ["Address concerns based on actual gaps in extracted data"],
  "competitive_advantages": ["Unique strengths found in extracted document data"],
  "career_narrative": "Story based on actual extracted work progression and achievements",
  "keySkills": ["Real skill 1 from extraction", "Real skill 2 from documents", "Actual skill 3", "Documented skill 4", "Extracted skill 5", "Professional skill 6"],
  "interviewAreas": ["Area 1 from extracted strengths", "Area 2 from documented experience", "Area 3 from actual achievements", "Area 4 addressing extraction gaps", "Area 5 for role alignment"],
  "strengths": ["Documented strength 1 from extraction", "Proven strength 2 from work history", "Technical strength 3 from skills", "Professional strength 4 from experience"],
  "complexity": "Medium/High based on extracted experience complexity",
  "matchScore": 75,
  "profileInsights": ["Insight 1 about extracted-role fit", "Insight 2 about documented readiness", "Insight 3 about growth potential from history", "Insight 4 about competitive position based on real data"]
}

IMPORTANT INSTRUCTIONS:
- Base ALL analysis on the extracted document data above
- Use specific companies, roles, and skills from the extraction
- If extraction was incomplete, mention this honestly
- Do not create fictional work history or achievements
- Reference actual timeframes and experiences from documents
- All content in English for consistency

Respond ONLY with valid JSON, no additional text.`

    console.log('Generating enhanced AI analysis based on extracted document data...')

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: enhancedPrompt,
      temperature: 0.1,
      maxTokens: 3500,
    })

    console.log('Enhanced AI analysis completed')

    // Clean and parse the response
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Extract JSON if embedded in text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedText = jsonMatch[0]
    }

    let analysis = JSON.parse(cleanedText)

    // Ensure match score consistency
    if (analysis.matchScore !== analysis.match_score) {
      analysis.matchScore = analysis.match_score || analysis.matchScore || 75
    }

    // Translate if needed
    if (targetLanguage !== 'en') {
      analysis = await translateEnhancedAnalysis(analysis, targetLanguage)
    }

    console.log('Enhanced analysis result:', {
      matchScore: analysis.match_score,
      strengthsCount: analysis.strengths_vs_requirements?.strong_matches?.length || 0,
      gapsCount: analysis.gap_analysis?.length || 0,
      recommendationsCount: analysis.improvement_recommendations?.length || 0
    })

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('Error in enhanced profile analysis:', error)

    // NO FALLBACK CON DATI HARDCODATI - solo errore
    return NextResponse.json({
      success: false,
      error: 'Analysis failed - insufficient document data or processing error',
      details: 'Please ensure CV documents are properly uploaded and analyzed before proceeding'
    }, { status: 500 })
  }
}

// Translation function for enhanced analysis
async function translateEnhancedAnalysis(analysis: any, targetLanguage: string) {
  if (!process.env.OPENAI_API_KEY) {
    return analysis
  }

  try {
    const translatePrompt = `Translate this enhanced candidate analysis from English to ${getLanguageName(targetLanguage)}. 
    
Keep the JSON structure EXACTLY the same, only translate the text content values. Do not translate:
- Field names/keys
- Boolean values
- Numbers  
- Company names
- Technology names
- Technical terms commonly used in English

${JSON.stringify(analysis, null, 2)}

Respond with the translated JSON maintaining the exact same structure.`

    const { text: translatedText } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: translatePrompt,
      temperature: 0.1,
      maxTokens: 3000,
    })

    let cleanedTranslation = translatedText.trim()
    if (cleanedTranslation.startsWith('```json')) {
      cleanedTranslation = cleanedTranslation.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    }

    const jsonMatch = cleanedTranslation.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedTranslation = jsonMatch[0]
    }

    return JSON.parse(cleanedTranslation)
  } catch (error) {
    console.warn('Enhanced analysis translation failed, returning original:', error)
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