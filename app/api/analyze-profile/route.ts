import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, jobDescription, uploadedFiles } = await req.json()

    console.log("Comprehensive profile analysis for:", { jobTitle, jobDescription, uploadedFiles })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Build comprehensive context like the old app
    let fullContext = `CANDIDATE PROFILE FOR INTERVIEW:

Interview Type: ${jobTitle}

Background Context: ${jobDescription}`

    // Add document analysis context if files are uploaded
    if (uploadedFiles && uploadedFiles.length > 0) {
      fullContext += `\n\n=== CANDIDATE DOCUMENTS ===\n`
      fullContext += `Documents analyzed: ${uploadedFiles.length} files\n`
      fullContext += `Files: ${uploadedFiles.join(', ')}\n`
      fullContext += `Note: Each document has been analyzed for relevant skills, experience, and qualifications that relate to the ${jobTitle} position.`
    }

    const analysisPrompt = `You are analyzing a candidate's complete profile for interview preparation. This candidate will be answering interview questions based on their real background.

Based on the interview type, context, and uploaded documents, provide:
1. CANDIDATE PROFILE: Comprehensive overview of their background, strengths, and experience
2. KEY STRENGTHS: What makes them a strong candidate for this role
3. EXPERIENCE HIGHLIGHTS: Specific examples and achievements they should mention
4. TECHNICAL COMPETENCIES: Relevant skills for the position
5. POTENTIAL CHALLENGES: Areas they might need to address or improve
6. INTERVIEW STRATEGY: How they should position themselves
7. ROLE FIT ANALYSIS: How well they match the target role
8. PREPARATION RECOMMENDATIONS: Specific tips for interview success

Be specific and reference actual details from their background. This analysis will help the AI respond accurately as this candidate during the interview.

CONTEXT TO ANALYZE:
${fullContext}

Respond with detailed JSON in this exact format:
{
  "candidate_profile": "comprehensive overview of candidate's background and strengths",
  "key_strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "experience_highlights": ["specific example 1", "specific example 2", "specific example 3"],
  "technical_competencies": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "potential_challenges": ["challenge 1", "challenge 2"],
  "interview_strategy": "overall approach and positioning strategy",
  "role_fit_analysis": "how well they match the target role",
  "preparation_recommendations": ["tip 1", "tip 2", "tip 3"],
  "keySkills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6"],
  "interviewAreas": ["area1", "area2", "area3", "area4", "area5"],
  "strengths": ["strength1", "strength2", "strength3", "strength4"],
  "complexity": "Medium",
  "matchScore": 85,
  "profileInsights": ["insight1", "insight2", "insight3", "insight4"]
}

Respond ONLY with valid JSON, no additional text or markdown.`

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: analysisPrompt,
      temperature: 0.2,
      maxTokens: 2000,
    })

    console.log("AI Analysis completed:", text)

    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    console.log("Cleaned JSON text:", cleanedText)

    // Parse the AI response
    const analysis = JSON.parse(cleanedText)

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('Error analyzing profile:', error)
    
    // Enhanced fallback response that matches the new format
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze profile',
      analysis: {
        candidate_profile: `Experienced professional applying for the position with a strong background in relevant technologies and skills.`,
        key_strengths: [
          "Strong technical background",
          "Professional communication skills", 
          "Adaptability and learning agility",
          "Problem-solving capabilities"
        ],
        experience_highlights: [
          "Diverse professional experience in relevant field",
          "Demonstrated ability to work in team environments",
          "Track record of delivering results"
        ],
        technical_competencies: [
          "Core technical skills for the role",
          "Professional software proficiency",
          "Industry-standard methodologies",
          "Communication and collaboration tools",
          "Continuous learning mindset"
        ],
        potential_challenges: [
          "Be ready to provide specific examples of achievements",
          "Prepare to discuss how experience applies to this role"
        ],
        interview_strategy: "Focus on highlighting relevant experience and technical skills. Be prepared to discuss specific examples from background that demonstrate capabilities.",
        role_fit_analysis: "Strong alignment between background and position requirements. Good potential for success in this role.",
        preparation_recommendations: [
          "Review specific examples from your experience",
          "Prepare questions about the company and role",
          "Practice explaining technical concepts clearly"
        ],
        keySkills: ["Problem Solving", "Communication", "Adaptability", "Time Management", "Technical Skills", "Teamwork"],
        interviewAreas: [
          "Skills for the position",
          "Professional experience", 
          "Team collaboration ability",
          "Priority management",
          "Career objectives"
        ],
        strengths: [
          "Detailed profile provided",
          "Motivation for the position",
          "Professional background",
          "Transferable skills"
        ],
        complexity: "Medium",
        matchScore: 75,
        profileInsights: [
          "Candidate with well-rounded professional profile",
          "Background shows good alignment with position requirements",
          "Strong foundational skills identified",
          "Good potential for role success"
        ]
      }
    }, { status: 200 })
  }
}