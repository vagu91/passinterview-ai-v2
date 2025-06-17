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
      firstName = '',
      lastName = '',
      email = '',
      phone = '',
      location = '',
      jobTitle = '',
      company = '',
      experienceLevel = '',
      industry = '',
      skills = '',
      additionalInfo = '',
      documentAnalyses = [],
      targetLanguage = 'en'
    } = requestData

    // Build comprehensive context from document analyses
    let documentContext = ""
    let candidateWorkHistory = ""

    if (documentAnalyses && documentAnalyses.length > 0) {
      documentContext = "=== CANDIDATE DOCUMENTS ANALYSIS ===\n"
      
      documentAnalyses.forEach((analysis: any, index: number) => {
        documentContext += `\nDocument ${index + 1}: ${analysis.documentType || 'CV/Resume'}\n`
        documentContext += `Summary: ${analysis.summary || 'Professional document'}\n`
        
        // Extract work history for enhanced analysis
        if (analysis.experienceDetails?.workHistory) {
          candidateWorkHistory += "\n=== WORK EXPERIENCE TIMELINE ===\n"
          analysis.experienceDetails.workHistory.forEach((job: any, jobIndex: number) => {
            candidateWorkHistory += `
${jobIndex + 1}. ${job.position} at ${job.company}
   Period: ${job.startDate} - ${job.endDate} (${job.duration || 'Duration not specified'})
   Industry: ${job.industry || 'Not specified'}
   Technologies: ${(job.technologies || []).join(', ')}
   Responsibilities: ${(job.responsibilities || []).join(', ')}
   Achievements: ${(job.achievements || []).join(', ')}
`
          })
        }

        // Add skills and achievements
        if (analysis.extractedSkills) {
          documentContext += `Skills: ${analysis.extractedSkills.join(', ')}\n`
        }
        if (analysis.keyAchievements) {
          documentContext += `Achievements: ${analysis.keyAchievements.join(', ')}\n`
        }
        if (analysis.experienceDetails?.totalYears) {
          documentContext += `Total Experience: ${analysis.experienceDetails.totalYears}\n`
        }
      })
    }

    // Create enhanced analysis prompt inspired by CV-feedback Python system
    const enhancedPrompt = `You are an AI recruiter assistant analyzing a candidate's complete profile to determine job match and provide comprehensive feedback.

CANDIDATE PROFILE:
- Name: ${firstName} ${lastName}
- Email: ${email}
- Phone: ${phone}
- Location: ${location}
- Target Position: ${jobTitle}
- Target Company: ${company || 'Not specified'}
- Experience Level: ${experienceLevel}
- Industry: ${industry}
- Provided Skills: ${skills}
- Additional Context: ${additionalInfo}

${documentContext}

${candidateWorkHistory}

ANALYSIS REQUIREMENTS:
Provide a comprehensive analysis that starts with a mathematical score (0-100) where 100 is a perfect match. Analyze the ENTIRE candidate profile against the ${jobTitle} job requirements.

The analysis should include:
1. MATCH SCORE (0-100): Mathematical assessment based on complete profile analysis
2. SCORE BREAKDOWN: Detailed scoring rationale with percentages
3. STRENGTHS vs REQUIREMENTS: Direct mapping of candidate strengths to job needs
4. GAP ANALYSIS: Specific areas needing improvement
5. IMPROVEMENT RECOMMENDATIONS: Actionable steps to increase match score
6. INTERVIEW STRATEGY: Tailored approach based on analysis
7. COMPETITIVE ADVANTAGES: What makes this candidate unique
8. RISK MITIGATION: How to address potential concerns

Respond with detailed JSON in this exact format:
{
  "match_score": 85,
  "score_breakdown": {
    "skills_match": 90,
    "experience_relevance": 80,
    "career_progression": 85,
    "industry_fit": 75,
    "overall_readiness": 85
  },
  "score_explanation": "Detailed explanation of how the score was calculated based on complete profile analysis against ${jobTitle} requirements",
  "candidate_profile": "Comprehensive professional summary based on actual work history and documents",
  "career_progression_analysis": "Analysis of career trajectory and growth pattern",
  "strengths_vs_requirements": {
    "strong_matches": ["Job requirement 1 -> Candidate strength from work history", "Job requirement 2 -> Documented skill"],
    "partial_matches": ["Job requirement 3 -> Developing area from experience"],
    "gaps": ["Missing requirement 1", "Area needing development 2"]
  },
  "gap_analysis": ["Specific skill gap 1 with context", "Experience gap 2 with explanation", "Knowledge area 3 needing development"],
  "experience_highlights": ["Quantified achievement 1 from work history", "Relevant project 2 with impact", "Leadership example 3 with results"],
  "technical_competencies": [
    {"skill": "Technical skill 1", "relevance_score": 9, "evidence": "Where/how demonstrated in work history"},
    {"skill": "Technical skill 2", "relevance_score": 7, "evidence": "Experience context and depth"}
  ],
  "industry_expertise": ["Domain knowledge 1 from experience", "Sector understanding 2", "Industry insight 3"],
  "leadership_evidence": ["Concrete leadership example 1", "Team management proof 2", "Initiative leadership 3"],
  "interview_strategy": "Specific strategy tailored to match score and profile strengths for ${jobTitle} interview",
  "improvement_recommendations": [
    {"area": "Skill gap area 1", "action": "Specific actionable step", "priority": "high", "timeline": "timeframe"},
    {"area": "Experience gap area 2", "action": "Concrete improvement action", "priority": "medium", "timeline": "timeframe"}
  ],
  "risk_mitigation": ["Strategy 1 to address potential weakness", "Approach 2 to handle concern"],
  "competitive_advantages": ["Unique selling point 1 with evidence", "Differentiator 2 from experience", "Standout quality 3"],
  "career_narrative": "Compelling story connecting career journey to ${jobTitle} role with specific examples",
  "keySkills": ["Documented skill 1", "Proven skill 2", "Technical skill 3", "Leadership skill 4", "Industry skill 5", "Communication skill 6"],
  "interviewAreas": ["Area 1 based on strengths", "Area 2 from experience", "Area 3 from achievements", "Area 4 from gaps to address", "Area 5 from growth potential"],
  "strengths": ["Documented strength 1", "Proven strength 2", "Technical strength 3", "Leadership strength 4"],
  "complexity": "Medium/High based on role complexity and candidate readiness",
  "matchScore": 85,
  "profileInsights": ["Insight 1 about job-profile fit", "Insight 2 about readiness level", "Insight 3 about growth potential", "Insight 4 about competitive position"]
}

CRITICAL INSTRUCTIONS:
- Base the analysis on ACTUAL information from documents and work history
- Provide realistic and honest assessment
- Focus on specific, actionable recommendations
- Use quantified examples wherever possible
- Make the match score reflect genuine fit assessment
- All content must be in English for consistency

Respond ONLY with valid JSON, no additional text or markdown.`

    console.log('Generating enhanced AI analysis...')

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: enhancedPrompt,
      temperature: 0.1, // Low temperature for consistent scoring
      maxTokens: 3500, // Increased for comprehensive analysis
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

    // Generate fallback with basic structure
    // Generate fallback with basic structure
    const requestData = await req.json().catch(() => ({}))
    const fallbackAnalysis = {
      match_score: 75,
      score_breakdown: {
        skills_match: 70,
        experience_relevance: 75,
        career_progression: 80,
        industry_fit: 70,
        overall_readiness: 75
      },
      score_explanation: "Analysis based on provided information shows good potential for the role with areas for development",
      candidate_profile: `Professional candidate applying for ${requestData.jobTitle || 'target position'} with relevant background and growth potential`,
      career_progression_analysis: "Candidate shows professional development with skills and experience relevant to target role",
      strengths_vs_requirements: {
        strong_matches: ["Professional experience relevant to target role", "Technical skills applicable to position"],
        partial_matches: ["Industry knowledge with growth potential"],
        gaps: ["Specific role requirements may need further development"]
      },
      gap_analysis: ["Continue developing specific technical skills for target role", "Gain more experience in target industry practices"],
      experience_highlights: ["Professional experience in relevant field", "Technical project involvement", "Professional skill development"],
      technical_competencies: [
        {"skill": "Professional technical skills", "relevance_score": 7, "evidence": "Demonstrated through work experience"},
        {"skill": "Industry knowledge", "relevance_score": 6, "evidence": "Professional background"}
      ],
      industry_expertise: ["Professional domain knowledge", "Technical understanding", "Industry awareness"],
      leadership_evidence: ["Professional collaboration experience", "Project involvement", "Team interaction capabilities"],
      interview_strategy: "Focus on highlighting relevant experience and demonstrate learning agility for role requirements",
      improvement_recommendations: [
        {"area": "Technical skills", "action": "Continue developing role-specific technical competencies", "priority": "high", "timeline": "3-6 months"},
        {"area": "Industry knowledge", "action": "Deepen understanding of industry best practices", "priority": "medium", "timeline": "6-12 months"}
      ],
      risk_mitigation: ["Prepare specific examples of relevant experience", "Research company and role requirements thoroughly"],
      competitive_advantages: ["Professional background with growth potential", "Learning agility and adaptability", "Strong foundational skills"],
      career_narrative: "Professional journey shows consistent growth and readiness to take on new challenges in target role",
      keySkills: ["Professional Skills", "Technical Competency", "Communication", "Problem Solving", "Learning Agility", "Team Collaboration"],
      interviewAreas: ["Professional experience discussion", "Technical competency demonstration", "Learning and growth mindset", "Role-specific knowledge", "Career development goals"],
      strengths: ["Professional background", "Technical foundation", "Growth mindset", "Communication skills"],
      complexity: "Medium",
      matchScore: 75,
      profileInsights: ["Good foundational match for role", "Strong learning potential", "Professional development trajectory", "Growth-oriented candidate"]
    }

    return NextResponse.json({
      success: false,
      error: 'Enhanced analysis generation failed',
      analysis: fallbackAnalysis
    }, { status: 200 })
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