// app/api/interview-response/route.ts - SINGLE RESPONSE FIXED VERSION

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { question, userProfile, jobTitle, language = 'en', documentAnalyses = [] } = await req.json()

    console.log("Generating interview response for:", { question, jobTitle, language })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const originalQuestion = question.trim()
    console.log("Processing question:", originalQuestion)

    // Analyze question type to determine response approach
    const questionType = analyzeQuestionType(originalQuestion)
    console.log("Question type detected:", questionType)

    // Build comprehensive context in English
    let context = `CANDIDATE PROFILE: ${userProfile}\n\n`

    if (documentAnalyses && documentAnalyses.length > 0) {
      context += "ANALYZED DOCUMENTS:\n"
      documentAnalyses.forEach((doc: any, index: number) => {
        if (doc && doc.summary) {
          context += `- Document ${index + 1}: ${doc.summary}\n`
          if (doc.keyInsights) {
            context += `  Key Insights: ${doc.keyInsights.join(', ')}\n`
          }
          if (doc.extractedSkills && doc.extractedSkills.length > 0) {
            context += `  Skills: ${doc.extractedSkills.join(', ')}\n`
          }
          if (doc.experienceDetails) {
            context += `  Experience: ${doc.experienceDetails.totalYears}\n`
            if (doc.experienceDetails.companies && doc.experienceDetails.companies.length > 0) {
              context += `  Companies: ${doc.experienceDetails.companies.join(', ')}\n`
            }
          }
          if (doc.keyAchievements && doc.keyAchievements.length > 0) {
            context += `  Achievements: ${doc.keyAchievements.join(', ')}\n`
          }
        }
      })
      context += "\n"
    }

    // FIXED: Create prompt that generates DIRECTLY in target language
    const responsePrompt = createPromptByType(originalQuestion, context, jobTitle, questionType, language)

    // FIXED: Single AI generation in target language
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      prompt: responsePrompt,
      temperature: 0.7,
      maxTokens: 300,
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

          // FIXED: Stream the SINGLE AI response directly
          for await (const delta of result.textStream) {
            const chunk = {
              type: 'delta',
              content: delta
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          }

          console.log("Single response completed in language:", language)

          // Send completion signal
          const completion = { type: 'done' }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`))

        } catch (error) {
          console.error('Streaming error:', error)
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

  } catch (error) {
    console.error('Error generating interview response:', error)

    // Generate AI-powered fallback response
    return generateFallbackResponse(req)
  }
}

// Function to analyze question type using AI
function analyzeQuestionType(question: string): 'technical' | 'experience' | 'general' {
  // Simple heuristic for now - could be enhanced with AI analysis
  const technicalKeywords = ['how', 'what is', 'explain', 'difference between', 'framework', 'language', 'tool', 'technology']
  const experienceKeywords = ['tell me about', 'describe a time', 'give me an example', 'your experience', 'project you worked']

  const lowerQuestion = question.toLowerCase()

  if (experienceKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'experience'
  } else if (technicalKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'technical'
  }

  return 'general'
}

// FIXED: Function to create prompt that generates DIRECTLY in target language
function createPromptByType(question: string, context: string, jobTitle: string, questionType: string, language: string): string {
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
- Demonstrate your technical knowledge and understanding
- Be informative and educational in your response
- Length: 3-4 sentences with good technical depth

FOR EXPERIENCE QUESTIONS (explicitly asking for personal examples, past projects, how you did something):
- YOU MUST use specific information from your CANDIDATE PROFILE and ANALYZED DOCUMENTS above
- Extract concrete details: company names, project names, technologies, timeframes, team sizes, results
- Use REAL information from the provided profile - do NOT make up generic examples
- Include specific details like: "At [actual company name]", "In the [specific project name]", "Using [actual technologies mentioned]"
- Reference actual experiences, roles, and achievements from your documented background
- If no specific information is available in your profile for the question, be honest and focus on transferable skills
- Length: 3-4 sentences with concrete details from your actual background

FOR GENERAL QUESTIONS:
- Provide thoughtful, professional responses that align with your background
- Show enthusiasm for the role and company
- Demonstrate your personality and communication skills
- Length: 2-3 sentences, concise but complete

GENERAL APPROACH:
- Be natural and conversational like a real person
- Provide substantive, detailed responses
- Show both knowledge and practical application where appropriate
- ${languageInstruction}

QUESTION: ${question}

Your response:`
}

// Function to generate AI-powered fallback response
async function generateFallbackResponse(req: NextRequest) {
  try {
    const requestBody = await req.json().catch(() => ({}))
    const fallbackLanguage = requestBody.language || 'en'
    const fallbackQuestion = requestBody.question || 'Question not available'
    const jobTitle = requestBody.jobTitle || 'this position'

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No API key for fallback')
    }

    const languageInstruction = fallbackLanguage === 'en'
      ? 'Respond in English.'
      : `Respond in ${getLanguageName(fallbackLanguage)}.`

    // FIXED: Generate fallback directly in target language
    const fallbackPrompt = `Generate a professional interview response for a candidate applying for ${jobTitle}. 
    
Question: "${fallbackQuestion}"
    
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
    console.error('Fallback generation failed:', fallbackError)

    // FIXED: Last resort hardcoded response in English only
    const requestBody = await req.json().catch(() => ({}))
    const minimalResponse = "Thank you for the question. Based on my experience and skills, I believe I can contribute significantly to this position and the company."

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