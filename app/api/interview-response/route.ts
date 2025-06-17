import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { question, userProfile, jobTitle, language = 'en', documentAnalyses = [] } = await req.json()

    console.log("Generating real data interview response for:", { question, jobTitle, language })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const originalQuestion = question.trim()
    console.log("Processing question:", originalQuestion)

    // Analyze question type to determine response approach
    const questionType = analyzeQuestionType(originalQuestion)
    console.log("Question type detected:", questionType)

    // Build real data context in English
    let context = `CANDIDATE PROFILE: ${userProfile}\n\n`

    // Filter and process only valid document analyses with real data
    const validAnalyses = documentAnalyses.filter((doc: any) => 
      doc && !doc.error && (
        (doc.experienceDetails?.workHistory && doc.experienceDetails.workHistory.length > 0) ||
        (doc.extractedSkills && doc.extractedSkills.length > 0) ||
        (doc.keyAchievements && doc.keyAchievements.length > 0)
      )
    )

    if (validAnalyses && validAnalyses.length > 0) {
      context += "REAL CAREER DATA AND PROFESSIONAL EXPERIENCE:\n"
      
      validAnalyses.forEach((doc: any, index: number) => {
        if (doc && doc.summary) {
          context += `- Document ${index + 1}: ${doc.summary}\n`

          // Add real work history only if it exists
          if (doc.experienceDetails?.workHistory && doc.experienceDetails.workHistory.length > 0) {
            context += `\nREAL WORK HISTORY (Most Recent First):\n`
            doc.experienceDetails.workHistory.forEach((job: any, jobIndex: number) => {
              if (job.company || job.position) {
                context += `${jobIndex + 1}. ${job.position || 'Role'} at ${job.company || 'Company'}`
                if (job.startDate || job.endDate) {
                  context += ` (${job.startDate || 'Start'} - ${job.endDate || 'End'})`
                }
                context += '\n'
                
                if (job.responsibilities && job.responsibilities.length > 0) {
                  context += `   Responsibilities: ${job.responsibilities.slice(0, 3).join(', ')}\n`
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
              }
            })
          }

          // Add real extracted skills with context
          if (doc.extractedSkills && doc.extractedSkills.length > 0) {
            context += `REAL TECHNICAL SKILLS: ${doc.extractedSkills.join(', ')}\n`
          }

          // Add real total experience if available
          if (doc.experienceDetails?.totalYears) {
            context += `TOTAL PROFESSIONAL EXPERIENCE: ${doc.experienceDetails.totalYears}\n`
          }

          // Add real industries and functional areas
          if (doc.experienceDetails?.industries && doc.experienceDetails.industries.length > 0) {
            context += `INDUSTRIES WORKED IN: ${doc.experienceDetails.industries.join(', ')}\n`
          }

          if (doc.experienceDetails?.functionalAreas && doc.experienceDetails.functionalAreas.length > 0) {
            context += `FUNCTIONAL AREAS: ${doc.experienceDetails.functionalAreas.join(', ')}\n`
          }

          // Add real key achievements
          if (doc.keyAchievements && doc.keyAchievements.length > 0) {
            context += `REAL KEY ACHIEVEMENTS: ${doc.keyAchievements.join(', ')}\n`
          }

          // Add real education if available
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
      context += "\nCRITICAL: Use the above REAL career data when answering experience-based questions. Reference actual company names, job titles, timeframes, and achievements from the documented career history.\n"
    } else {
      context += "NOTE: No detailed career data available. Provide general professional responses based on job context.\n"
    }

    // Create enhanced prompt that generates DIRECTLY in target language with real data focus
    const responsePrompt = createRealDataPromptByType(originalQuestion, context, jobTitle, questionType, language, validAnalyses.length > 0)

    // Single AI generation in target language with real data integration
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      prompt: responsePrompt,
      temperature: 0.7,
      maxTokens: 350,
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

          console.log("Real data response completed in language:", language)

          // Send completion signal
          const completion = { type: 'done' }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`))

        } catch (error) {
          console.error('Streaming error:', error)
          const errorChunk = {
            type: 'error',
            message: 'Error generating real data response'
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
    console.error('Error generating real data interview response:', error)

    // Generate fallback response with real data focus
    return generateRealDataFallbackResponse(req)
  }
}

// Enhanced function to analyze question type
function analyzeQuestionType(question: string): 'technical' | 'experience' | 'general' | 'behavioral' | 'situational' {
  const technicalKeywords = ['how', 'what is', 'explain', 'difference between', 'framework', 'language', 'tool', 'technology', 'algorithm', 'design pattern']
  const experienceKeywords = ['tell me about', 'describe a time', 'give me an example', 'your experience', 'project you worked', 'previous role', 'at your last job', 'in your career']
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

// Enhanced function to create real data prompt that generates DIRECTLY in target language
function createRealDataPromptByType(question: string, context: string, jobTitle: string, questionType: string, language: string, hasRealData: boolean): string {
  const languageInstruction = language === 'en'
    ? 'Respond in English.'
    : `Respond in ${getLanguageName(language)}. Use natural, fluent ${getLanguageName(language)} throughout your response.`

  const dataSourceInstruction = hasRealData
    ? "You have access to REAL career data extracted from documents. Use this authentic information when answering."
    : "You have limited career data available. Provide professional responses based on the job context."

  return `You are a professional candidate being interviewed for the position of ${jobTitle}.

${context}

CRITICAL INSTRUCTIONS:
- Respond DIRECTLY as the candidate - no quotes, no meta-commentary
- ${languageInstruction}
- ${dataSourceInstruction}
- Analyze the question type and respond appropriately:

FOR TECHNICAL QUESTIONS (asking about specific tools, technologies, frameworks, concepts):
- Provide technical explanations focusing on what the technology/tool is
- Include key features, benefits, use cases, and technical details
- ${hasRealData ? "If you have used this technology in your documented work experience, mention the specific role and company" : "Draw on general professional knowledge"}
- Demonstrate your technical knowledge and understanding
- Be informative and educational in your response
- Length: 3-4 sentences with good technical depth

FOR EXPERIENCE QUESTIONS (explicitly asking for personal examples, past projects, how you did something):
${hasRealData ? `- YOU MUST use specific information from your REAL WORK HISTORY above
- Extract concrete details: company names, job titles, timeframes, responsibilities, technologies, achievements
- Use REAL information from the provided career data - do NOT make up generic examples
- Include specific details like: "At [actual company name] as [actual job title] from [actual timeframe]", "In the [specific project/role]", "Using [actual technologies mentioned]"
- Reference actual experiences, roles, and achievements from your documented work history
- If no specific information is available in your work history for the question, be honest and focus on transferable skills from your documented experience
- Always structure responses chronologically when discussing multiple experiences (most recent first)` : `- Be honest that you don't have detailed career documentation available
- Provide general professional responses based on the job context
- Focus on the skills and experience relevant to the ${jobTitle} position
- Avoid making up specific company names or detailed scenarios`}
- Length: 3-4 sentences with concrete details

FOR BEHAVIORAL QUESTIONS (how you handle situations, your approach, strengths/weaknesses):
${hasRealData ? `- Draw examples from your documented work history and career progression
- Use your actual career progression to demonstrate growth and learning
- Reference specific roles and companies from your career experience
- Show how your approach evolved through different positions` : `- Provide thoughtful responses based on professional best practices
- Reference general professional experience relevant to ${jobTitle}
- Focus on skills and approaches that would be valuable in the target role`}
- Length: 3-4 sentences connecting behavior to professional examples

FOR SITUATIONAL QUESTIONS (hypothetical scenarios, "what would you do if"):
${hasRealData ? `- Base your approach on lessons learned from your documented work experience
- Reference similar situations you've handled in your actual roles
- Draw on your career progression to show problem-solving evolution
- Connect hypothetical scenarios to real experience when possible` : `- Provide thoughtful approaches based on professional best practices
- Reference general problem-solving methodologies
- Show understanding of the ${jobTitle} role requirements`}
- Length: 3-4 sentences grounding hypothetical in professional experience

FOR GENERAL QUESTIONS:
- Provide thoughtful, professional responses that align with your background
- Show enthusiasm for the role and company
- Demonstrate your personality and communication skills while referencing your career journey
- Length: 2-3 sentences, concise but complete

REAL DATA INTEGRATION:
${hasRealData ? `- When discussing experience, always use actual company names, job titles, and timeframes from your work history
- Reference specific technologies, achievements, and responsibilities from documented roles
- Show career progression and growth through real career narrative
- Connect past experiences to current role requirements using authentic examples` : `- Acknowledge when specific career details aren't available
- Focus on professional principles and approaches relevant to ${jobTitle}
- Provide value through thoughtful analysis and professional insights`}

GENERAL APPROACH:
- Be natural and conversational like a real person
- Provide substantive, detailed responses using your ${hasRealData ? 'actual career data' : 'professional knowledge'}
- Show both knowledge and practical application
- ${languageInstruction}

QUESTION: ${question}

Your response:`
}

// Function to generate fallback response with real data focus
async function generateRealDataFallbackResponse(req: NextRequest) {
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

    // Extract basic real info if available
    let experienceContext = ""
    let hasRealData = false
    
    if (documentAnalyses.length > 0) {
      const validDoc = documentAnalyses.find((doc: any) => doc && !doc.error)
      if (validDoc) {
        if (validDoc.experienceDetails?.workHistory && validDoc.experienceDetails.workHistory.length > 0) {
          const recentRole = validDoc.experienceDetails.workHistory[0]
          if (recentRole.company && recentRole.position) {
            experienceContext = `Drawing from my experience as ${recentRole.position} at ${recentRole.company}, `
            hasRealData = true
          }
        } else if (validDoc.experienceDetails?.totalYears) {
          experienceContext = `With ${validDoc.experienceDetails.totalYears} of professional experience, `
          hasRealData = true
        } else if (validDoc.extractedSkills && validDoc.extractedSkills.length > 0) {
          experienceContext = `Based on my background in ${validDoc.extractedSkills.slice(0, 2).join(' and ')}, `
          hasRealData = true
        }
      }
    }

    // Generate fallback directly in target language with real data context
    const fallbackPrompt = `Generate a professional interview response for a candidate applying for ${jobTitle}. 
    
Question: "${fallbackQuestion}"
    
${experienceContext ? `Context: ${experienceContext}` : ''}
${hasRealData ? 'Use this real career information in your response.' : 'Provide a general professional response.'}

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
    console.error('Real data fallback generation failed:', fallbackError)

    // Last resort professional response
    const requestBody = await req.json().catch(() => ({}))
    const minimalResponse = "Thank you for the question. Based on my professional background and experience, I believe I can contribute effectively to this position and help achieve the team's objectives."

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