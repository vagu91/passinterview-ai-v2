// app/api/interview-response/route.ts - FINAL VERSION WITH ENGLISH BASE

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

    // Create specialized prompt based on question type - ALWAYS IN ENGLISH
    const responsePrompt = createPromptByType(originalQuestion, context, jobTitle, questionType)

    // Generate response in English first
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      prompt: responsePrompt,
      temperature: 0.7,
      maxTokens: 300,
    })

    // Smart correction for voice transcription errors
    const smartCorrectionPromise = (async () => {
      try {
        const correctionPrompt = `Auto-correct voice transcription errors in this question: "${originalQuestion}"

Replace words that seem like voice recognition errors with correct technical terms for a ${jobTitle}:
- angola → Angular
- react → React  
- c sharp → C#
- java script → JavaScript
- python → Python
- node → Node
- docker → Docker
- kubernetes → Kubernetes
- git → Git
- github → GitHub
- api → API
- sequel → SQL
- no sequel → NoSQL
- aws → AWS
- azure → Azure

If no corrections needed, respond "NO_CORRECTION".
If you correct something, respond ONLY with the corrected question.`

        const correctionResult = await streamText({
          model: openai('gpt-3.5-turbo'),
          prompt: correctionPrompt,
          temperature: 0.1,
          maxTokens: 100,
        })

        let correction = ''
        for await (const delta of correctionResult.textStream) {
          correction += delta
        }

        const trimmedCorrection = correction.trim()
        return (trimmedCorrection === "NO_CORRECTION") ? null : trimmedCorrection
      } catch (error) {
        console.log("Smart correction failed:", error)
        return null
      }
    })()

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

          // Collect the English response
          let englishResponse = ''

          // Stream the AI response
          for await (const delta of result.textStream) {
            englishResponse += delta
            const chunk = {
              type: 'delta',
              content: delta
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          }

          // Check smart correction
          const correctedQuestion = await smartCorrectionPromise

          if (correctedQuestion && correctedQuestion !== originalQuestion) {
            console.log("Question corrected:", originalQuestion, "→", correctedQuestion)

            // Generate better response with corrected question - replace the original
            const betterPrompt = createPromptByType(correctedQuestion, context, jobTitle, 'general')

            const betterResult = await streamText({
              model: openai('gpt-3.5-turbo'),
              prompt: betterPrompt,
              temperature: 0.7,
              maxTokens: 300,
            })

            // Clear previous response and show corrected version
            const clearSignal = {
              type: 'clear'
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(clearSignal)}\n\n`))

            // Collect and stream the better response
            englishResponse = ''
            for await (const delta of betterResult.textStream) {
              englishResponse += delta
              const chunk = {
                type: 'delta',
                content: delta
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
            }
          }

          // Translate if needed
          if (language !== 'en' && englishResponse.length > 50) {
            console.log("Translating response to:", language)

            const translationPrompt = `Translate this interview response from English to ${getLanguageName(language)}. 

CRITICAL INSTRUCTIONS:
- Keep the same conversational tone and confidence level
- Maintain all specific details (company names, numbers, dates, project names, technologies)
- Preserve technical terms appropriately for the target language
- Keep the response length similar to the original
- Sound natural in the target language

Original English response:
"${englishResponse}"

Respond ONLY with the translation, no additional text:`

            const translationResult = await streamText({
              model: openai('gpt-3.5-turbo'),
              prompt: translationPrompt,
              temperature: 0.2,
              maxTokens: 250,
            })

            // Clear previous content and show translation
            const clearAndReplace = {
              type: 'clear'
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(clearAndReplace)}\n\n`))

            // Stream the translation
            for await (const delta of translationResult.textStream) {
              const chunk = {
                type: 'delta',
                content: delta
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
            }
          }

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

// Function to create unified intelligent prompt - ALWAYS IN ENGLISH
function createPromptByType(question: string, context: string, jobTitle: string, questionType: string): string {
  return `You are a professional candidate being interviewed for the position of ${jobTitle}.

${context}

CRITICAL INSTRUCTIONS:
- Respond DIRECTLY as the candidate - no quotes, no meta-commentary
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
- All responses must be in English (will be translated later if needed)

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

    // Generate AI fallback in English
    const fallbackPrompt = `Generate a professional interview response for a candidate applying for ${jobTitle}. 
    
Question: "${fallbackQuestion}"
    
Create a confident, professional response that demonstrates competency and interest in the role.
Keep it concise (2-3 sentences) and professional.
Respond in English only.`

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

    // Translate if needed
    if (fallbackLanguage !== 'en' && fallbackResponse.length > 20) {
      const translationPrompt = `Translate this professional interview response to ${getLanguageName(fallbackLanguage)}:

"${fallbackResponse}"

Respond only with the translation:`

      const translationResult = await streamText({
        model: openai('gpt-3.5-turbo'),
        prompt: translationPrompt,
        temperature: 0.2,
        maxTokens: 100,
      })

      let translatedResponse = ''
      for await (const delta of translationResult.textStream) {
        translatedResponse += delta
      }

      fallbackResponse = translatedResponse.trim()
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

    // Minimal hardcoded fallback as last resort
    const requestBody = await req.json().catch(() => ({}))
    const finalLanguage = requestBody.language || 'en'

    const minimalResponse = finalLanguage === 'en' ?
      "Thank you for the question. Based on my experience and skills, I believe I can contribute significantly to this position and the company." :
      "Grazie per la domanda. Basandomi sulla mia esperienza e competenze, ritengo di poter contribuire significativamente a questa posizione e all'azienda."

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