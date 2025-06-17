// app/api/interview-response/route.ts - ENHANCED VERSION WITH CHRONOLOGICAL EXPERIENCE INTEGRATION

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { question, userProfile, jobTitle, language = 'en', documentAnalyses = [] } = await req.json()

    console.log("Generating enhanced chronological interview response for:", { question, jobTitle, language })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const originalQuestion = question.trim()
    console.log("Processing question:", originalQuestion)

    // Analyze question type to determine response approach
    const questionType = analyzeQuestionType(originalQuestion)
    console.log("Question type detected:", questionType)

    // Build comprehensive chronological context in English
    let context = `CANDIDATE PROFILE: ${userProfile}\n\n`

    if (documentAnalyses && documentAnalyses.length > 0) {
      context += "CHRONOLOGICAL WORK EXPERIENCE AND CAREER DATA:\n"
      documentAnalyses.forEach((doc: any, index: number) => {
        if (doc && doc.summary) {
          context += `- Document ${index + 1}: ${doc.summary}\n`

          // Add chronological work history
          if (doc.experienceDetails?.workHistory && doc.experienceDetails.workHistory.length > 0) {
            context += `\nCHRONOLOGICAL WORK HISTORY (Most Recent First):\n`
            doc.experienceDetails.workHistory.forEach((job: any, jobIndex: number) => {
              context += `${jobIndex + 1}. ${job.position} at ${job.company} (${job.startDate} - ${job.endDate})\n`
              if (job.responsibilities && job.responsibilities.length > 0) {
                context += `   Responsibilities: ${job.responsibilities.join(', ')}\n`
              }
              if (job.technologies && job.technologies.length > 0) {
                context += `   Technologies: ${job.technologies.join(', ')}\n`
              }
              if (job.achievements && job.achievements.length > 0) {
                context += `   Achievements: ${job.achievements.join(', ')}\n`
              }
              if (job.industry) {
                context += `   Industry: ${job.industry}\n`
              }
              context += '\n'
            })
          }

          // Add career progression insights
          if (doc.careerProgression) {
            context += `CAREER PROGRESSION ANALYSIS:\n`
            context += `- Seniority Trend: ${doc.careerProgression.seniorityTrend || 'Not analyzed'}\n`
            context += `- Industry Focus: ${doc.careerProgression.industryFocus || 'Not analyzed'}\n`
            context += `- Leadership Experience: ${doc.careerProgression.leadershipExperience || 'Not analyzed'}\n\n`
          }

          // Add extracted skills with context
          if (doc.extractedSkills && doc.extractedSkills.length > 0) {
            context += `TECHNICAL SKILLS EXTRACTED: ${doc.extractedSkills.join(', ')}\n`
          }

          // Add total experience
          if (doc.experienceDetails?.totalYears) {
            context += `TOTAL PROFESSIONAL EXPERIENCE: ${doc.experienceDetails.totalYears}\n`
          }

          // Add industries and functional areas
          if (doc.experienceDetails?.industries && doc.experienceDetails.industries.length > 0) {
            context += `INDUSTRIES WORKED IN: ${doc.experienceDetails.industries.join(', ')}\n`
          }

          if (doc.experienceDetails?.functionalAreas && doc.experienceDetails.functionalAreas.length > 0) {
            context += `FUNCTIONAL AREAS: ${doc.experienceDetails.functionalAreas.join(', ')}\n`
          }

          // Add key achievements
          if (doc.keyAchievements && doc.keyAchievements.length > 0) {
            context += `KEY ACHIEVEMENTS: ${doc.keyAchievements.join(', ')}\n`
          }

          // Add education
          if (doc.education) {
            if (doc.education.degrees && doc.education.degrees.length > 0) {
              context += `EDUCATION: ${doc.education.degrees.join(', ')}\n`
            }
            if (doc.education.certifications && doc.education.certifications.length > 0) {
              context += `CERTIFICATIONS: ${doc.education.certifications.join(', ')}\n`
            }
          }

          context += "\n"
        }
      })
      context += "\nIMPORTANT: Use the above REAL chronological work experience data when answering experience-based questions. Reference actual company names, job titles, timeframes, and achievements from the candidate's documented career history.\n"
    }

    // Create enhanced prompt that generates DIRECTLY in target language with chronological focus
    const responsePrompt = createChronologicalPromptByType(originalQuestion, context, jobTitle, questionType, language)

    // Single AI generation in target language with chronological integration
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      prompt: responsePrompt,
      temperature: 0.7,
      maxTokens: 350, // Increased for detailed chronological responses
    })

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          const metadata = {
            type: 'metadata',
            question: originalQuestion
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`))

          // Stream the AI response directly
          for await (const delta of result.textStream) {
            const chunk = {
              type: 'delta',
              content: delta
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          }

          console.log("Chronological response completed in language:", language)

          // Send completion signal
          const completion = { type: 'done' }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`))

        } catch (error) {
          console.error('Streaming error:', error)
          const errorChunk = {
            type: 'error',
            message: 'Error generating chronological response'
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Error generating enhanced chronological interview response:', error)

    // Generate AI-powered fallback response with chronological focus
    return generateChronologicalFallbackResponse(req)
  }
}

// Enhanced function to analyze question type
function analyzeQuestionType(question: string): 'technical' | 'experience' | 'general' | 'behavioral' | 'situational' {
  const technicalKeywords = ['how', 'what is', 'explain', 'difference between', 'framework', 'language', 'tool', 'technology', 'algorithm', 'design pattern']
  const experienceKeywords = ['tell me about', 'describe a time', 'give me an example', 'your experience', 'project you worked', 'previous role', 'at your last job']
  const behavioralKeywords = ['how do you handle', 'describe your approach', 'how would you deal', 'what motivates you', 'your strengths', 'your weaknesses']
  const situationalKeywords = ['if you were', 'suppose you had to', 'imagine you are', 'what would you do if', 'how would you solve']

  const lowerQuestion = question.toLowerCase()

  if (experienceKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'experience'
  } else if (behavioralKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'behavioral'
  } else if (situationalKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'situational'
  } else if (technicalKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'technical'
  }

  return 'general'
}

// Enhanced function to create chronological prompt that generates DIRECTLY in target language
function createChronologicalPromptByType(question: string, context: string, jobTitle: string, questionType: string, language: string): string {
  const languageInstruction = language === 'en'
    ? 'Respond in English.'
    : `Respond in ${getLanguageName(language)}. Use natural, fluent ${getLanguageName(language)} throughout your response.`

  return `You are a professional candidate being interviewed for the position of ${jobTitle}.

${context}

CRITICAL INSTRUCTIONS:
- Respond DIRECTLY as the candidate - no quotes, no meta-commentary
- ${languageInstruction}
- Analyze the question type and respond appropriately:

FOR TECHNICAL QUESTIONS (asking about specific tools, technologies, frameworks, concepts):
- Provide technical explanations focusing on what the technology/tool is
- Include key features, benefits, use cases, and technical details
- If you have used this technology in your documented work experience, mention the specific role and company
- Demonstrate your technical knowledge and understanding from real experience
- Be informative and educational in your response
- Length: 3-4 sentences with good technical depth

FOR EXPERIENCE QUESTIONS (explicitly asking for personal examples, past projects, how you did something):
- YOU MUST use specific information from your CHRONOLOGICAL WORK HISTORY above
- Extract concrete details: company names, job titles, timeframes, responsibilities, technologies, achievements
- Use REAL information from the provided chronological career data - do NOT make up generic examples
- Include specific details like: "At [actual company name] as [actual job title] from [actual timeframe]", "In the [specific project/role]", "Using [actual technologies mentioned]"
- Reference actual experiences, roles, and achievements from your documented work history in chronological context
- If no specific information is available in your work history for the question, be honest and focus on transferable skills from your documented experience
- Always structure responses chronologically when discussing multiple experiences (most recent first)
- Length: 3-4 sentences with concrete details from your actual chronological work history

FOR BEHAVIORAL QUESTIONS (how you handle situations, your approach, strengths/weaknesses):
- Draw examples from your documented work history and career progression
- Use your actual career progression to demonstrate growth and learning
- Reference specific roles and companies from your chronological experience
- Show how your approach evolved through different positions
- Length: 3-4 sentences connecting behavior to real career examples

FOR SITUATIONAL QUESTIONS (hypothetical scenarios, "what would you do if"):
- Base your approach on lessons learned from your documented work experience
- Reference similar situations you've handled in your actual roles
- Draw on your chronological career progression to show problem-solving evolution
- Connect hypothetical scenarios to real experience when possible
- Length: 3-4 sentences grounding hypothetical in real experience

FOR GENERAL QUESTIONS:
- Provide thoughtful, professional responses that align with your documented background
- Show enthusiasm for the role and company
- Demonstrate your personality and communication skills while referencing your career journey
- Length: 2-3 sentences, concise but complete

CHRONOLOGICAL EXPERIENCE INTEGRATION:
- When discussing experience, always order from most recent to oldest
- Use actual company names, job titles, and timeframes from your work history
- Reference specific technologies, achievements, and responsibilities from documented roles
- Show career progression and growth through chronological narrative
- Connect past experiences to current role requirements

GENERAL APPROACH:
- Be natural and conversational like a real person
- Provide substantive, detailed responses using your actual career data
- Show both knowledge and practical application from real work experience
- ${languageInstruction}

QUESTION: ${question}

Your response:`
}

// Function to generate AI-powered fallback response with chronological focus
async function generateChronologicalFallbackResponse(req: NextRequest) {
  try {
    const requestBody = await req.json().catch(() => ({}))
    const fallbackLanguage = requestBody.language || 'en'
    const fallbackQuestion = requestBody.question || 'Question not available'
    const jobTitle = requestBody.jobTitle || 'this position'
    const documentAnalyses = requestBody.documentAnalyses || []

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No API key for fallback')
    }

    const languageInstruction = fallbackLanguage === 'en'
      ? 'Respond in English.'
      : `Respond in ${getLanguageName(fallbackLanguage)}.`

    // Extract basic chronological info if available
    let experienceContext = ""
    if (documentAnalyses.length > 0) {
      const firstDoc = documentAnalyses[0]
      if (firstDoc.experienceDetails?.workHistory && firstDoc.experienceDetails.workHistory.length > 0) {
        const recentRole = firstDoc.experienceDetails.workHistory[0]
        experienceContext = `Drawing from experience as ${recentRole.position} at ${recentRole.company}, `
      } else if (firstDoc.experienceDetails?.totalYears) {
        experienceContext = `With ${firstDoc.experienceDetails.totalYears} of professional experience, `
      }
    }

    // Generate fallback directly in target language with chronological context
    const fallbackPrompt = `Generate a professional interview response for a candidate applying for ${jobTitle}. 
    
Question: "${fallbackQuestion}"
    
${experienceContext ? `Context: ${experienceContext}` : ''}

Create a confident, professional response that demonstrates competency and interest in the role.
Keep it concise (2-3 sentences) and professional.
${languageInstruction}`

    const fallbackResult = await streamText({
      model: openai('gpt-3.5-turbo'),
      prompt: fallbackPrompt,
      temperature: 0.5,
      maxTokens: 150,
    })

    let fallbackResponse = ''
    for await (const delta of fallbackResult.textStream) {
      fallbackResponse += delta
    }

    // Return fallback streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        try {
          const metadata = {
            type: 'metadata',
            question: fallbackQuestion
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`))

          const words = fallbackResponse.split(' ')
          words.forEach((word, index) => {
            const chunk = {
              type: 'delta',
              content: index === 0 ? word : ` ${word}`
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          })

          const completion = { type: 'done' }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`))

        } catch (error) {
          const errorChunk = {
            type: 'error',
            message: 'Error generating response'
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (fallbackError) {
    console.error('Chronological fallback generation failed:', fallbackError)

    // Last resort hardcoded response with professional context
    const requestBody = await req.json().catch(() => ({}))
    const minimalResponse = "Thank you for the question. Based on my professional experience and career progression, I believe I can contribute effectively to this position and help the team achieve its objectives."

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        try {
          const metadata = {
            type: 'metadata',
            question: requestBody.question || 'Question not available'
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`))

          const words = minimalResponse.split(' ')
          words.forEach((word, index) => {
            const chunk = {
              type: 'delta',
              content: index === 0 ? word : ` ${word}`
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          })

          const completion = { type: 'done' }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`))

        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
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