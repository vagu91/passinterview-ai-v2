// app/api/analyze-profile/route.ts - ENHANCED VERSION WITH CAREER EXPERIENCE INTEGRATION

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, jobDescription, uploadedFiles, documentAnalyses, targetLanguage = 'en' } = await req.json()

    console.log("Enhanced career profile analysis for:", {
      jobTitle,
      jobDescription: jobDescription?.length,
      uploadedFiles: uploadedFiles?.length,
      documentAnalyses: documentAnalyses?.length,
      targetLanguage
    })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Build comprehensive context with career focus - ALWAYS IN ENGLISH FIRST
    let fullContext = `CANDIDATE PROFILE FOR INTERVIEW PREPARATION:

Interview Position: ${jobTitle}

Role Context and Requirements: ${jobDescription}`

    // Add enhanced career work experience context
    if (documentAnalyses && documentAnalyses.length > 0) {
      fullContext += `\n\n=== COMPREHENSIVE CANDIDATE BACKGROUND ANALYSIS ===\n`
      fullContext += `Documents analyzed: ${documentAnalyses.length} files\n`

      documentAnalyses.forEach((analysis: any, index: number) => {
        const fileName = uploadedFiles?.[index] || `Document ${index + 1}`

        fullContext += `\nDocument: ${fileName}
Document Type: ${analysis.documentType}
Professional Summary: ${analysis.summary}

EXTRACTED SKILLS AND COMPETENCIES:
Technical Skills: ${(analysis.extractedSkills || []).join(', ')}
Industry Experience: ${(analysis.experienceDetails?.industries || []).join(', ')}
Functional Areas: ${(analysis.experienceDetails?.functionalAreas || []).join(', ')}

CAREER WORK EXPERIENCE:
Total Professional Experience: ${analysis.experienceDetails?.totalYears || 'Not specified'}
Career Level: ${analysis.experienceDetails?.careerLevel || 'Not specified'}
`

        // Add detailed career work history
        if (analysis.experienceDetails?.workHistory && analysis.experienceDetails.workHistory.length > 0) {
          fullContext += `\nWORK HISTORY (Most Recent First):\n`

          analysis.experienceDetails.workHistory.forEach((job: any, jobIndex: number) => {
            fullContext += `
${jobIndex + 1}. ${job.position} at ${job.company}
   Period: ${job.startDate} - ${job.endDate} (${job.duration})
   Industry: ${job.industry || 'Not specified'}
   Company Size: ${job.companySize || 'Not specified'}
   Key Responsibilities: ${(job.responsibilities || []).join(', ')}
   Technologies Used: ${(job.technologies || []).join(', ')}
   Achievements: ${(job.achievements || []).join(', ')}
`
          })
        }

        // Add career progression insights
        if (analysis.careerProgression) {
          fullContext += `\nCAREER PROGRESSION ANALYSIS:
Seniority Trend: ${analysis.careerProgression.seniorityTrend || 'Not analyzed'}
Industry Focus: ${analysis.careerProgression.industryFocus || 'Not analyzed'}
Leadership Experience: ${analysis.careerProgression.leadershipExperience || 'Not analyzed'}
`
        }

        // Add education and certifications
        if (analysis.education) {
          fullContext += `\nEDUCATION & CERTIFICATIONS:
Degrees: ${(analysis.education.degrees || []).join(', ')}
Institutions: ${(analysis.education.institutions || []).join(', ')}
Certifications: ${(analysis.education.certifications || []).join(', ')}
`
        }

        // Add contact information if available
        if (analysis.contactInfo) {
          fullContext += `\nCONTACT INFORMATION:
Email: ${analysis.contactInfo.email || 'Not provided'}
Phone: ${analysis.contactInfo.phone || 'Not provided'}
Location: ${analysis.contactInfo.location || 'Not provided'}
LinkedIn: ${analysis.contactInfo.linkedin || 'Not provided'}
Portfolio: ${analysis.contactInfo.portfolio || 'Not provided'}
`
        }

        fullContext += `\nKEY ACHIEVEMENTS: ${(analysis.keyAchievements || []).join(', ')}\n`
      })

      fullContext += `\nIMPORTANT: The above chronological work experience data has been extracted from actual CV documents and represents REAL career history that should be referenced in interview responses.`
    } else if (uploadedFiles && uploadedFiles.length > 0) {
      fullContext += `\n\n=== CANDIDATE DOCUMENTS ===\n`
      fullContext += `Documents provided: ${uploadedFiles.length} files\n`
      fullContext += `Files: ${uploadedFiles.join(', ')}\n`
      fullContext += `Note: Documents contain professional background information relevant to the ${jobTitle} position.`
    }

    // Create comprehensive career analysis prompt - ALWAYS IN ENGLISH
    const analysisPrompt = `You are analyzing a candidate's complete professional profile for advanced interview preparation. This candidate will be answering interview questions based on their ACTUAL career work experience and documented career history.

Based on the interview position, context, and detailed career work experience extracted from CV documents, provide a comprehensive analysis that enables an AI to respond accurately as this candidate during interviews.

CONTEXT TO ANALYZE:
${fullContext}

Create a detailed analysis focusing on:
1. PROFESSIONAL PROFILE: Comprehensive overview based on actual career work experience
2. CAREER PROGRESSION: Analysis of seniority growth and industry expertise over time
3. EXPERIENCE HIGHLIGHTS: Concrete examples from their actual career work history
4. TECHNICAL EVOLUTION: How their technical skills developed through different roles
5. INDUSTRY EXPERTISE: Deep domain knowledge gained through career progression
6. LEADERSHIP JOURNEY: Evidence of growing responsibilities and team management
7. ROLE ALIGNMENT: How their career experience aligns with target position
8. INTERVIEW STRATEGY: How to leverage their actual career progression in responses

CRITICAL INSTRUCTIONS:
- Use ONLY actual information extracted from the career work experience
- Reference specific companies, job titles, years, and achievements from their CV
- Build responses around their REAL career progression and industry expertise
- Make recommendations based on their actual professional development path
- Highlight how their experience evolution matches the target role requirements
- All content must be in English (will be translated later if needed)

Respond with detailed JSON in this exact format:
{
  "candidate_profile": "Comprehensive professional overview based on actual career work experience and career progression",
  "career_progression_analysis": "Detailed analysis of how the candidate's career has evolved over time, including seniority growth and industry expertise development",
  "key_strengths": ["Specific strength 1 from actual work history", "Specific strength 2 from career progression", "Specific strength 3 from industry expertise", "Specific strength 4 from technical evolution"],
  "experience_highlights": ["Specific example 1 from actual career work history with company and timeframe", "Specific example 2 from documented career progression", "Specific example 3 from real professional achievements"],
  "technical_competencies": ["Actual skill 1 from CV with years of experience", "Actual skill 2 from multiple roles", "Actual skill 3 from career progression", "Actual skill 4 from latest positions", "Actual skill 5 from documented projects"],
  "industry_expertise": ["Domain knowledge 1 from career history", "Sector expertise 2 from work progression", "Industry insight 3 from multiple roles"],
  "leadership_and_management": "Analysis of leadership roles and team management experience based on actual job titles and responsibilities",
  "potential_challenges": ["Realistic challenge 1 based on role gap analysis from actual experience", "Realistic challenge 2 based on career progression gaps"],
  "interview_strategy": "Detailed strategy based on actual career progression and how to present the professional journey for maximum impact",
  "role_fit_analysis": "Analysis of how actual career work experience and career progression matches target role requirements",
  "preparation_recommendations": ["Specific tip 1 based on real career progression", "Specific tip 2 based on actual work history", "Specific tip 3 based on documented achievements"],
  "career_talking_points": [
    {
      "period": "Most recent role period",
      "company": "Actual company name",
      "position": "Actual job title",
      "key_talking_points": ["Achievement 1", "Achievement 2", "Skills developed"],
      "interview_relevance": "How this role relates to target position"
    }
  ],
  "career_narrative": "Cohesive story of professional development that connects all roles and leads to the target position",
  "keySkills": ["Real skill 1 with experience level", "Real skill 2 with expertise depth", "Real skill 3 with industry context", "Real skill 4 with progression evidence", "Real skill 5 with recent usage", "Real skill 6 with advanced proficiency"],
  "interviewAreas": ["Area 1 based on actual experience", "Area 2 from career progression", "Area 3 from industry expertise", "Area 4 from technical evolution", "Area 5 from leadership journey"],
  "strengths": ["Strength 1 from documented experience", "Strength 2 from career progression", "Strength 3 from industry expertise", "Strength 4 from technical depth"],
  "complexity": "Medium/High based on career complexity and seniority",
  "matchScore": 85,
  "profileInsights": ["Insight 1 about career-role fit based on actual progression", "Insight 2 about industry alignment from work history", "Insight 3 about technical readiness from skill evolution", "Insight 4 about leadership potential from documented experience"]
}

Respond ONLY with valid JSON, no additional text or markdown.`

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: analysisPrompt,
      temperature: 0.2,
      maxTokens: 3000, // Increased for comprehensive chronological analysis
    })

    console.log("Enhanced career AI Analysis completed")

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
    console.error('Error analyzing career profile:', error)

    // Generate AI-powered fallback with career focus
    const requestData = await req.json().catch(() => ({}))
    const fallbackJobTitle = requestData.jobTitle || 'Professional Position'
    const fallbackTargetLanguage = requestData.targetLanguage || 'en'
    const fallbackResponse = await generateCareerFallbackAnalysis(fallbackJobTitle, fallbackTargetLanguage, requestData.documentAnalyses)

    return NextResponse.json({
      success: false,
      error: 'Failed to analyze profile',
      analysis: fallbackResponse
    }, { status: 200 })
  }
}

// Function to generate AI-powered fallback analysis with career focus
async function generateCareerFallbackAnalysis(jobTitle: string, targetLanguage: string, documentAnalyses: any[] = []) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No API key for fallback')
    }

    // Extract basic info from document analyses if available
    let workExperience = ""
    let totalYears = "Professional experience"
    let industries = ["Technology", "Business"]
    let skills = ["Professional competencies", "Technical skills", "Communication", "Problem solving"]

    if (documentAnalyses && documentAnalyses.length > 0) {
      const firstAnalysis = documentAnalyses[0]
      if (firstAnalysis.experienceDetails) {
        totalYears = firstAnalysis.experienceDetails.totalYears || "Professional experience"
        industries = firstAnalysis.experienceDetails.industries || industries
        skills = firstAnalysis.extractedSkills || skills

        if (firstAnalysis.experienceDetails.workHistory && firstAnalysis.experienceDetails.workHistory.length > 0) {
          const recentRole = firstAnalysis.experienceDetails.workHistory[0]
          workExperience = `Recent experience as ${recentRole.position} at ${recentRole.company}`
        }
      }
    }

    const fallbackPrompt = `Generate a professional candidate profile analysis for someone applying for a ${jobTitle} position. ${workExperience ? `They have ${workExperience}.` : ''} Create realistic and professional content based on career progression.

Use this information if available:
- Experience: ${totalYears}
- Industries: ${industries.join(', ')}
- Skills: ${skills.slice(0, 6).join(', ')}

Respond with JSON in this exact format:
{
  "candidate_profile": "Professional overview for ${jobTitle} candidate with career progression focus",
  "career_progression_analysis": "Analysis of professional development and industry expertise growth",
  "key_strengths": ["Professional strength 1 based on experience", "Technical competency 2", "Leadership capability 3", "Industry expertise 4"],
  "experience_highlights": ["Professional experience example 1", "Career progression example 2", "Achievement example 3"],
  "technical_competencies": ["Technical skill 1 with experience level", "Professional tool 2", "Industry knowledge 3", "Technical capability 4", "Specialized skill 5"],
  "industry_expertise": ["Domain knowledge 1", "Sector understanding 2", "Industry insight 3"],
  "leadership_and_management": "Leadership experience and team management capabilities demonstrated through career progression",
  "potential_challenges": ["Professional development area 1", "Skill enhancement opportunity 2"],
  "interview_strategy": "Strategy focused on highlighting career progression and professional growth for ${jobTitle} interview",
  "role_fit_analysis": "Professional analysis of fit for ${jobTitle} role based on career trajectory",
  "preparation_recommendations": ["Preparation tip 1 based on experience", "Professional recommendation 2", "Career-focused advice 3"],
  "chronological_talking_points": [
    {
      "period": "Recent professional period",
      "company": "Recent organization",
      "position": "Recent role",
      "key_talking_points": ["Professional achievement 1", "Technical accomplishment 2", "Leadership example 3"],
      "interview_relevance": "How recent experience relates to ${jobTitle} position"
    }
  ],
  "career_narrative": "Cohesive professional story that demonstrates growth and readiness for ${jobTitle} role",
  "keySkills": ["Professional Skill 1", "Technical Competency 2", "Industry Knowledge 3", "Leadership Ability 4", "Communication 5", "Problem Solving 6"],
  "interviewAreas": ["Professional experience discussion", "Technical competency demonstration", "Career progression narrative", "Industry knowledge assessment", "Leadership potential exploration"],
  "strengths": ["Professional background strength", "Technical competency demonstration", "Career progression evidence", "Industry expertise proof"],
  "complexity": "Medium",
  "matchScore": 75,
  "profileInsights": ["Professional insight 1 about career-role alignment", "Technical insight 2 about competency match", "Experience insight 3 about growth potential", "Industry insight 4 about sector fit"]
}

Make it professional and realistic for a ${jobTitle} position. All content in English.`

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
    console.error('Career fallback generation failed:', fallbackError)

    // Last resort minimal structure with career focus
    const minimalAnalysis = {
      candidate_profile: `Professional candidate applying for ${jobTitle} position with relevant career progression and documented experience`,
      career_progression_analysis: `Professional development path showing growth in technical competencies and industry expertise relevant to ${jobTitle} role`,
      key_strengths: ["Professional experience in relevant domain", "Technical competencies from career progression", "Problem-solving skills developed over time", "Communication abilities honed through professional roles"],
      experience_highlights: ["Relevant professional experience in industry", "Technical project completion track record", "Professional skill development through career progression"],
      technical_competencies: ["Core technical skills for target role", "Industry-standard tools and methodologies", "Professional development practices", "Communication technologies", "Continuous learning approach"],
      industry_expertise: ["Relevant industry knowledge", "Sector understanding", "Professional domain expertise"],
      leadership_and_management: "Professional experience demonstrates growth in responsibility and potential for team collaboration and leadership",
      potential_challenges: ["Prepare specific examples demonstrating technical competencies from career history", "Research company-specific technologies and current industry practices"],
      interview_strategy: "Focus on highlighting documented career progression and professional growth. Use specific examples from work history to demonstrate capabilities and alignment with role requirements.",
      role_fit_analysis: `Strong alignment between career progression and ${jobTitle} position requirements. Professional experience and technical development show good potential for success.`,
      preparation_recommendations: ["Review specific examples from professional career progression", "Prepare to discuss technical competencies developed over time", "Research company technology stack and current industry practices"],
      chronological_talking_points: [
        {
          period: "Recent professional experience",
          company: "Recent organization",
          position: "Recent professional role",
          key_talking_points: ["Professional achievement", "Technical contribution", "Team collaboration"],
          interview_relevance: "Demonstrates readiness for target position responsibilities"
        }
      ],
      career_narrative: `Professional journey shows consistent growth and development leading naturally to ${jobTitle} role. Career progression demonstrates both technical competency and professional maturity.`,
      keySkills: ["Technical Competency", "Professional Communication", "Problem Solving", "Career Progression", "Industry Knowledge", "Continuous Learning"],
      interviewAreas: [
        "Professional experience and career progression",
        "Technical skills developed through work history",
        "Team collaboration and professional growth",
        "Problem-solving approach refined over time",
        "Industry knowledge and career development goals"
      ],
      strengths: [
        "Documented professional career progression",
        "Technical competencies developed through experience",
        "Professional development track record",
        "Strong foundation for continued growth"
      ],
      complexity: "Medium",
      matchScore: 78,
      profileInsights: [
        "Professional candidate with documented career progression",
        "Good alignment between work history and role requirements",
        "Strong potential for success based on professional development trajectory",
        "Career progression mindset evident from professional background"
      ]
    }

    // Translate minimal analysis if needed
    if (targetLanguage !== 'en') {
      return await translateProfileAnalysis(minimalAnalysis, targetLanguage)
    }

    return minimalAnalysis
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