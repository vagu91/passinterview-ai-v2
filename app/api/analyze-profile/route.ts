// app/api/analyze-profile/route.ts - FINAL VERSION WITH ENGLISH BASE

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, jobDescription, uploadedFiles, documentAnalyses, targetLanguage = 'en' } = await req.json()

    console.log("Comprehensive profile analysis for:", {
      jobTitle,
      jobDescription: jobDescription?.length,
      uploadedFiles: uploadedFiles?.length,
      documentAnalyses: documentAnalyses?.length,
      targetLanguage
    })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Build comprehensive context - ALWAYS IN ENGLISH FIRST
    let fullContext = `CANDIDATE PROFILE FOR INTERVIEW:

Interview Type: ${jobTitle}

Background Context: ${jobDescription}`

    // Add enhanced document analysis context if available
    if (documentAnalyses && documentAnalyses.length > 0) {
      fullContext += `\n\n=== CANDIDATE DOCUMENTS ANALYSIS ===\n`
      fullContext += `Documents analyzed: ${documentAnalyses.length} files\n`

      documentAnalyses.forEach((analysis: any, index: number) => {
        const fileName = uploadedFiles?.[index] || `Document ${index + 1}`

        fullContext += `\nDocument: ${fileName}
Type: ${analysis.documentType}
Summary: ${analysis.summary}

Extracted Skills: ${(analysis.extractedSkills || []).join(', ')}
Experience Details: ${analysis.experienceDetails?.totalYears || 'Not specified'}
Industries: ${(analysis.experienceDetails?.industries || []).join(', ')}
Key Achievements: ${(analysis.keyAchievements || []).join(', ')}
Education: ${(analysis.education?.degrees || []).join(', ')}
`
      })

      fullContext += `\nNote: Each document has been analyzed for relevant skills, experience, and qualifications that relate to the ${jobTitle} position.`
    } else if (uploadedFiles && uploadedFiles.length > 0) {
      fullContext += `\n\n=== CANDIDATE DOCUMENTS ===\n`
      fullContext += `Documents analyzed: ${uploadedFiles.length} files\n`
      fullContext += `Files: ${uploadedFiles.join(', ')}\n`
      fullContext += `Note: Each document has been analyzed for relevant skills, experience, and qualifications that relate to the ${jobTitle} position.`
    }

    // Create comprehensive analysis prompt - ALWAYS IN ENGLISH
    const analysisPrompt = `You are analyzing a candidate's complete profile for interview preparation. This candidate will be answering interview questions based on their real background extracted from their documents.

Based on the interview type, context, and uploaded documents analysis, provide a comprehensive analysis that will help an AI respond accurately as this candidate during interviews.

CONTEXT TO ANALYZE:
${fullContext}

Create a detailed analysis focusing on:
1. CANDIDATE PROFILE: Comprehensive overview based on actual extracted data
2. KEY STRENGTHS: Specific strengths derived from document analysis
3. EXPERIENCE HIGHLIGHTS: Concrete examples from their actual background
4. TECHNICAL COMPETENCIES: Skills actually found in their documents
5. POTENTIAL CHALLENGES: Realistic areas for improvement based on role requirements
6. INTERVIEW STRATEGY: How they should position themselves using their real background
7. ROLE FIT ANALYSIS: Actual alignment between their profile and target role
8. PREPARATION RECOMMENDATIONS: Specific tips based on their real experience

CRITICAL INSTRUCTIONS:
- Use ONLY information that was actually extracted from the documents
- Be specific with companies, technologies, years, achievements mentioned in documents
- If document analysis shows specific skills/experience, reference them directly
- Create realistic and personalized content based on actual candidate data
- Make recommendations that align with their real background
- All content must be in English (will be translated later if needed)

Respond with detailed JSON in this exact format:
{
  "candidate_profile": "Comprehensive overview based on actual extracted document data and background",
  "key_strengths": ["Specific strength 1 from documents", "Specific strength 2 from documents", "Specific strength 3 from documents", "Specific strength 4 from documents"],
  "experience_highlights": ["Specific example 1 from actual background", "Specific example 2 from actual background", "Specific example 3 from actual background"],
  "technical_competencies": ["Actual skill 1 from documents", "Actual skill 2 from documents", "Actual skill 3 from documents", "Actual skill 4 from documents", "Actual skill 5 from documents"],
  "potential_challenges": ["Realistic challenge 1 based on role gap analysis", "Realistic challenge 2 based on role gap analysis"],
  "interview_strategy": "Detailed strategy based on actual candidate strengths and role requirements",
  "role_fit_analysis": "Analysis of how actual candidate background matches target role requirements",
  "preparation_recommendations": ["Specific tip 1 based on real background", "Specific tip 2 based on real background", "Specific tip 3 based on real background"],
  "keySkills": ["Real skill 1", "Real skill 2", "Real skill 3", "Real skill 4", "Real skill 5", "Real skill 6"],
  "interviewAreas": ["Area 1 relevant to role", "Area 2 relevant to role", "Area 3 relevant to role", "Area 4 relevant to role", "Area 5 relevant to role"],
  "strengths": ["Strength 1 from analysis", "Strength 2 from analysis", "Strength 3 from analysis", "Strength 4 from analysis"],
  "complexity": "Medium",
  "matchScore": 85,
  "profileInsights": ["Insight 1 about candidate-role fit", "Insight 2 about candidate-role fit", "Insight 3 about candidate-role fit", "Insight 4 about candidate-role fit"]
}

Respond ONLY with valid JSON, no additional text or markdown.`

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: analysisPrompt,
      temperature: 0.2,
      maxTokens: 2500,
    })

    console.log("AI Analysis completed")

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

    // Generate AI-powered fallback instead of hardcoded text
    const requestData = await req.json().catch(() => ({}))
    const fallbackJobTitle = requestData.jobTitle || 'Professional Position'
    const fallbackTargetLanguage = requestData.targetLanguage || 'en'
    const fallbackResponse = await generateFallbackAnalysis(fallbackJobTitle, fallbackTargetLanguage)

    return NextResponse.json({
      success: false,
      error: 'Failed to analyze profile',
      analysis: fallbackResponse
    }, { status: 200 })
  }
}

// Function to generate AI-powered fallback analysis
async function generateFallbackAnalysis(jobTitle: string, targetLanguage: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No API key for fallback')
    }

    const fallbackPrompt = `Generate a professional candidate profile analysis for someone applying for a ${jobTitle} position. Create realistic and professional content.

Respond with JSON in this exact format:
{
  "candidate_profile": "Professional overview for ${jobTitle} candidate",
  "key_strengths": ["Professional strength 1", "Professional strength 2", "Professional strength 3", "Professional strength 4"],
  "experience_highlights": ["Professional experience example 1", "Professional experience example 2", "Professional experience example 3"],
  "technical_competencies": ["Professional skill 1", "Professional skill 2", "Professional skill 3", "Professional skill 4", "Professional skill 5"],
  "potential_challenges": ["Professional development area 1", "Professional development area 2"],
  "interview_strategy": "Professional strategy for ${jobTitle} interview",
  "role_fit_analysis": "Professional analysis of fit for ${jobTitle} role",
  "preparation_recommendations": ["Professional recommendation 1", "Professional recommendation 2", "Professional recommendation 3"],
  "keySkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
  "interviewAreas": ["Interview area 1", "Interview area 2", "Interview area 3", "Interview area 4", "Interview area 5"],
  "strengths": ["Candidate strength 1", "Candidate strength 2", "Candidate strength 3", "Candidate strength 4"],
  "complexity": "Medium",
  "matchScore": 75,
  "profileInsights": ["Professional insight 1", "Professional insight 2", "Professional insight 3", "Professional insight 4"]
}

Make it professional and realistic for a ${jobTitle} position. All content in English.`

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: fallbackPrompt,
      temperature: 0.3,
      maxTokens: 1500,
    })

    let fallbackAnalysis = JSON.parse(text.trim())

    // Translate if needed
    if (targetLanguage !== 'en') {
      fallbackAnalysis = await translateProfileAnalysis(fallbackAnalysis, targetLanguage)
    }

    return fallbackAnalysis

  } catch (fallbackError) {
    console.error('Fallback generation failed:', fallbackError)

    // Last resort minimal structure in English
    const minimalAnalysis = {
      candidate_profile: `Professional candidate applying for ${jobTitle} position with relevant background and skills`,
      key_strengths: ["Professional communication", "Technical competency", "Problem-solving ability", "Team collaboration"],
      experience_highlights: ["Relevant professional experience", "Project completion track record", "Technical skill development"],
      technical_competencies: ["Core technical skills", "Industry knowledge", "Professional tools proficiency", "Best practices understanding", "Continuous learning"],
      potential_challenges: ["Prepare specific examples of achievements", "Research company and role specifics"],
      interview_strategy: "Focus on highlighting relevant experience and technical skills while demonstrating genuine interest in the role",
      role_fit_analysis: "Candidate shows good potential for success in this position based on background and skills",
      preparation_recommendations: ["Review specific examples from experience", "Prepare thoughtful questions about the role", "Practice explaining technical concepts clearly"],
      keySkills: ["Problem Solving", "Communication", "Adaptability", "Time Management", "Technical Skills", "Teamwork"],
      interviewAreas: ["Role-specific skills", "Professional experience", "Team collaboration", "Project management", "Career objectives"],
      strengths: ["Professional background", "Technical competency", "Communication skills", "Growth mindset"],
      complexity: "Medium",
      matchScore: 75,
      profileInsights: ["Well-rounded professional profile", "Good alignment with position requirements", "Strong foundational skills", "Positive potential for role success"]
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
    
Keep the JSON structure EXACTLY the same, only translate the text content values:

${JSON.stringify(analysis, null, 2)}

Respond with the translated JSON maintaining the exact same structure and field names.`

    const { text: translatedText } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: translatePrompt,
      temperature: 0.1,
      maxTokens: 2000,
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