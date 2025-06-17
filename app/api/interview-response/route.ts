// app/api/interview-response/route.ts - INTELLIGENT CONTEXTUAL RESPONSE SYSTEM

import { streamText, generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
// import { candidateProfileManager } from '@/lib/candidateProfileManager' - Using simplified approach

console.log('Intelligent interview response API initialized');

export async function POST(req: NextRequest) {
  try {
    const { question, userProfile, jobTitle, language = 'en', documentAnalyses = [] } = await req.json()
    const originalQuestion = question?.trim() || 'Question not available'

    console.log("Generating intelligent contextual interview response:", { 
      question: originalQuestion.substring(0, 50) + '...', 
      jobTitle, 
      language,
      documentAnalysesCount: documentAnalyses.length,
      hasUserProfile: !!userProfile
    })

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured - using enhanced fallback response')
      return generateEnhancedFallbackResponse(originalQuestion, userProfile || '', jobTitle || 'Position', language, documentAnalyses)
    }
    console.log("Processing question with AI intelligence:", originalQuestion.substring(0, 100) + '...')

    // Enhanced question analysis with AI intelligence
    const questionAnalysis = await analyzeQuestionIntelligently(originalQuestion, jobTitle, documentAnalyses)
    console.log("Intelligent question analysis:", questionAnalysis)

    // Build comprehensive intelligent context using smart summarization
    const enhancedContext = await buildIntelligentContext(userProfile || '', documentAnalyses || [], jobTitle || 'Position', questionAnalysis)
    
    // Generate contextually intelligent response prompt
    const responsePrompt = buildIntelligentResponsePrompt(originalQuestion, enhancedContext, questionAnalysis, language || 'en', jobTitle || 'Position')

    // Generate intelligent response with enhanced AI model
    const result = await streamText({
      model: openai('gpt-4o-mini'), // Using more capable model for intelligent responses
      prompt: responsePrompt,
      temperature: 0.3, // Lower temperature for more consistent, professional responses
      maxTokens: 500, // Increased for detailed intelligent responses
    })

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send enhanced metadata with intelligence insights
          const metadata = {
            type: 'metadata',
            question: originalQuestion,
            questionType: questionAnalysis.type,
            difficulty: questionAnalysis.difficulty,
            confidenceScore: questionAnalysis.confidenceScore,
            contextualFactors: questionAnalysis.contextualFactors,
            personalizedElements: questionAnalysis.personalizedElements
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

          console.log("Intelligent contextual response completed:", {
            language,
            questionType: questionAnalysis.type,
            confidenceScore: questionAnalysis.confidenceScore
          });

          // Send completion with insights
          const completion = { 
            type: 'done',
            responseInsights: {
              questionCategory: questionAnalysis.type,
              confidenceScore: questionAnalysis.confidenceScore,
              personalizedElements: questionAnalysis.personalizedElements.length,
              strengthsHighlighted: questionAnalysis.strengthsUsed.length
            }
          }
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
    console.error('Error generating intelligent interview response:', error)

    // Generate enhanced fallback response with proper variable access
    const { question, userProfile, jobTitle, language = 'en', documentAnalyses = [] } = await req.json().catch(() => ({}))
    const originalQuestion = question?.trim() || 'Question not available'
    
    return generateEnhancedFallbackResponse(
      originalQuestion,
      userProfile || '',
      jobTitle || 'this position', 
      language,
      documentAnalyses
    )
  }
}

// Intelligent question analysis using AI
async function analyzeQuestionIntelligently(question: string, jobTitle: string, documentAnalyses: any[]) {
  console.log('Performing intelligent question analysis with AI');
  
  const lowerQuestion = question.toLowerCase();
  
  // Initialize analysis object
  let questionType = 'general';
  let difficulty = 'medium';
  let contextualFactors: string[] = [];
  let personalizedElements: string[] = [];
  let strengthsUsed: string[] = [];
  let confidenceScore = 70; // Base confidence
  
  // Technical question detection with AI intelligence
  if (lowerQuestion.includes('code') || lowerQuestion.includes('algorithm') || 
      lowerQuestion.includes('programming') || lowerQuestion.includes('technical') ||
      lowerQuestion.includes('architecture') || lowerQuestion.includes('database') ||
      lowerQuestion.includes('framework') || lowerQuestion.includes('api') ||
      lowerQuestion.includes('design pattern') || lowerQuestion.includes('how do you implement') ||
      lowerQuestion.includes('what is the difference between') || lowerQuestion.includes('explain')) {
    questionType = 'technical';
    difficulty = 'hard';
    contextualFactors.push('Requires technical expertise and implementation knowledge');
    
    // Look for relevant technical skills in documents
    const technicalSkills = documentAnalyses.flatMap(doc => 
      doc.extractedSkills?.filter((skill: string) => 
        skill.toLowerCase().includes('javascript') || 
        skill.toLowerCase().includes('python') ||
        skill.toLowerCase().includes('java') ||
        skill.toLowerCase().includes('react') ||
        skill.toLowerCase().includes('node') ||
        skill.toLowerCase().includes('sql') ||
        skill.toLowerCase().includes('aws') ||
        skill.toLowerCase().includes('docker')
      ) || []
    );
    
    if (technicalSkills.length > 0) {
      personalizedElements.push(`Technical expertise: ${technicalSkills.slice(0, 4).join(', ')}`);
      strengthsUsed.push('Documented technical skills from CV');
      confidenceScore += 20;
    }
  }
  
  // Behavioral/Experience question detection
  else if (lowerQuestion.includes('tell me about a time') || 
           lowerQuestion.includes('describe a situation') ||
           lowerQuestion.includes('give me an example') ||
           lowerQuestion.includes('how did you handle') ||
           lowerQuestion.includes('your experience with') ||
           lowerQuestion.includes('when you had to') ||
           lowerQuestion.includes('leadership') ||
           lowerQuestion.includes('teamwork') ||
           lowerQuestion.includes('conflict') ||
           lowerQuestion.includes('challenge')) {
    questionType = 'behavioral';
    difficulty = 'medium';
    contextualFactors.push('Requires specific experience examples using STAR method');
    
    // Look for relevant experience examples
    const workExperience = documentAnalyses.flatMap(doc => doc.experienceDetails?.workHistory || []);
    if (workExperience.length > 0) {
      const recentExperience = workExperience.slice(0, 2);
      personalizedElements.push(`Recent experience: ${recentExperience.map(exp => `${exp.position} at ${exp.company}`).join(', ')}`);
      strengthsUsed.push('Real work experience with documented achievements');
      confidenceScore += 25;
      
      // Check for leadership experience
      const hasLeadership = workExperience.some(exp => 
        exp.position?.toLowerCase().includes('lead') || 
        exp.position?.toLowerCase().includes('manager') ||
        exp.position?.toLowerCase().includes('senior') ||
        exp.responsibilities?.some((resp: string) => resp.toLowerCase().includes('manage') || resp.toLowerCase().includes('lead'))
      );
      
      if (hasLeadership && (lowerQuestion.includes('leadership') || lowerQuestion.includes('manage'))) {
        personalizedElements.push('Leadership experience documented in career history');
        confidenceScore += 10;
      }
    }
  }
  
  // Personal/motivational questions
  else if (lowerQuestion.includes('why') || 
           lowerQuestion.includes('motivation') ||
           lowerQuestion.includes('passion') ||
           lowerQuestion.includes('interested') ||
           lowerQuestion.includes('career goals') ||
           lowerQuestion.includes('why do you want') ||
           lowerQuestion.includes('what attracts you')) {
    questionType = 'personal';
    difficulty = 'easy';
    contextualFactors.push('Requires authentic personal motivation and career alignment');
    strengthsUsed.push('Career progression narrative and personal values');
    confidenceScore += 15;
  }
  
  // Company-specific questions
  else if (lowerQuestion.includes('company') || 
           lowerQuestion.includes('organization') ||
           lowerQuestion.includes('why us') ||
           lowerQuestion.includes('our mission') ||
           lowerQuestion.includes('why this company') ||
           lowerQuestion.includes('what do you know about us')) {
    questionType = 'company-specific';
    difficulty = 'medium';
    contextualFactors.push('Requires company research and value alignment');
    strengthsUsed.push('Industry knowledge and research capabilities');
  }
  
  // Situational/hypothetical questions
  else if (lowerQuestion.includes('what would you do if') ||
           lowerQuestion.includes('how would you handle') ||
           lowerQuestion.includes('suppose you had to') ||
           lowerQuestion.includes('imagine you are') ||
           lowerQuestion.includes('if you were faced with')) {
    questionType = 'situational';
    difficulty = 'medium';
    contextualFactors.push('Requires problem-solving approach based on experience');
    
    // Connect to relevant experience
    const relevantExperience = documentAnalyses.flatMap(doc => doc.experienceDetails?.workHistory || [])
      .filter(exp => exp.responsibilities?.length > 0);
    
    if (relevantExperience.length > 0) {
      personalizedElements.push('Can draw from documented problem-solving experience');
      strengthsUsed.push('Practical experience in similar situations');
      confidenceScore += 15;
    }
  }

  // Salary/compensation questions
  else if (lowerQuestion.includes('salary') ||
           lowerQuestion.includes('compensation') ||
           lowerQuestion.includes('expectations') && lowerQuestion.includes('salary')) {
    questionType = 'compensation';
    difficulty = 'medium';
    contextualFactors.push('Requires market knowledge and negotiation skills');
  }

  // Calculate final confidence score based on available context
  if (documentAnalyses.length > 0) confidenceScore += 10;
  if (personalizedElements.length > 1) confidenceScore += 10;
  if (strengthsUsed.length > 1) confidenceScore += 5;
  
  // Cap at 100
  confidenceScore = Math.min(confidenceScore, 100);

  return {
    type: questionType,
    difficulty,
    confidenceScore,
    contextualFactors,
    personalizedElements,
    strengthsUsed,
    category: questionType,
    requiresExamples: questionType === 'behavioral' || questionType === 'situational',
    requiresTechnicalKnowledge: questionType === 'technical',
    requiresPersonalReflection: questionType === 'personal' || questionType === 'company-specific'
  };
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

// Enhanced fallback response generator for when OpenAI is not available
function generateEnhancedFallbackResponse(question: string, userProfile: string, jobTitle: string, language: string, documentAnalyses: any[]) {
  console.log('Generating enhanced fallback response without AI dependency');
  
  // Analyze question type without AI
  const questionType = getQuestionTypeFromKeywords(question);
  
  // Build experience context from documents
  let experienceContext = '';
  if (documentAnalyses.length > 0) {
    const firstDoc = documentAnalyses[0];
    if (firstDoc.experienceDetails?.workHistory && firstDoc.experienceDetails.workHistory.length > 0) {
      const recentRole = firstDoc.experienceDetails.workHistory[0];
      experienceContext = `Drawing from my experience as ${recentRole.position} at ${recentRole.company}, `;
    } else if (firstDoc.experienceDetails?.totalYears) {
      experienceContext = `With ${firstDoc.experienceDetails.totalYears} of professional experience, `;
    }
  }
  
  // Generate contextual response based on question type
  let response = '';
  
  switch (questionType) {
    case 'technical':
      response = language === 'it' 
        ? `${experienceContext}ho esperienza con diverse tecnologie e framework. La mia esperienza professionale mi ha permesso di sviluppare competenze tecniche solide e di rimanere aggiornato sulle migliori pratiche del settore. Sono sempre entusiasta di applicare queste conoscenze per contribuire al successo del team.`
        : `${experienceContext}I have experience with various technologies and frameworks. My professional background has allowed me to develop solid technical skills and stay current with industry best practices. I'm always excited to apply this knowledge to contribute to the team's success.`;
      break;
      
    case 'behavioral':
      response = language === 'it'
        ? `${experienceContext}ho affrontato diverse sfide professionali che mi hanno permesso di crescere e sviluppare le mie competenze. Credo nell'importanza del lavoro di squadra, della comunicazione efficace e dell'apprendimento continuo. Ogni esperienza mi ha insegnato qualcosa di prezioso che porto con me.`
        : `${experienceContext}I've faced various professional challenges that have allowed me to grow and develop my skills. I believe in the importance of teamwork, effective communication, and continuous learning. Each experience has taught me something valuable that I carry forward.`;
      break;
      
    case 'personal':
      response = language === 'it'
        ? `Sono motivato dalla possibilità di crescere professionalmente e contribuire a progetti significativi. ${experienceContext}ho sviluppato una passione per questo campo e sono entusiasta dell'opportunità di applicare le mie competenze in ${jobTitle}. Credo che questa posizione sia perfettamente allineata con i miei obiettivi di carriera.`
        : `I'm motivated by the opportunity to grow professionally and contribute to meaningful projects. ${experienceContext}I've developed a passion for this field and I'm excited about the opportunity to apply my skills in ${jobTitle}. I believe this position aligns perfectly with my career goals.`;
      break;
      
    case 'company-specific':
      response = language === 'it'
        ? `Sono molto interessato a questa azienda per la sua reputazione nel settore e i valori che rappresenta. ${experienceContext}ritengo di poter portare valore significativo al team. Sono entusiasta della possibilità di contribuire alla crescita e al successo dell'organizzazione.`
        : `I'm very interested in this company because of its reputation in the industry and the values it represents. ${experienceContext}I believe I can bring significant value to the team. I'm excited about the opportunity to contribute to the organization's growth and success.`;
      break;
      
    default:
      response = language === 'it'
        ? `Grazie per la domanda. ${experienceContext}ho sviluppato competenze solide che ritengo siano rilevanti per la posizione di ${jobTitle}. Sono entusiasta dell'opportunità di discutere come posso contribuire al successo del team e dell'azienda.`
        : `Thank you for the question. ${experienceContext}I've developed solid skills that I believe are relevant for the ${jobTitle} position. I'm excited about the opportunity to discuss how I can contribute to the team and company's success.`;
  }
  
  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      try {
        // Send metadata
        const metadata = {
          type: 'metadata',
          question: question,
          fallbackMode: true,
          language: language
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));
        
        // Stream response word by word for natural effect
        const words = response.split(' ');
        words.forEach((word, index) => {
          const chunk = {
            type: 'delta',
            content: index === 0 ? word : ` ${word}`
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        });
        
        // Send completion
        const completion = { 
          type: 'done',
          fallbackMode: true 
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`));
        
      } catch (error) {
        const errorChunk = {
          type: 'error',
          message: 'Error generating fallback response'
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// Helper function to determine question type from keywords
function getQuestionTypeFromKeywords(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('technical') || lowerQuestion.includes('technology') || 
      lowerQuestion.includes('programming') || lowerQuestion.includes('framework') ||
      lowerQuestion.includes('algorithm') || lowerQuestion.includes('code')) {
    return 'technical';
  }
  
  if (lowerQuestion.includes('tell me about') || lowerQuestion.includes('describe a time') ||
      lowerQuestion.includes('example') || lowerQuestion.includes('experience') ||
      lowerQuestion.includes('challenge') || lowerQuestion.includes('conflict')) {
    return 'behavioral';
  }
  
  if (lowerQuestion.includes('why') || lowerQuestion.includes('motivation') ||
      lowerQuestion.includes('interested') || lowerQuestion.includes('passion')) {
    return 'personal';
  }
  
  if (lowerQuestion.includes('company') || lowerQuestion.includes('organization') ||
      lowerQuestion.includes('why us') || lowerQuestion.includes('why here')) {
    return 'company-specific';
  }
  
  return 'general';
}

// Build intelligent context using smart summarization
async function buildIntelligentContext(
  userProfile: string, 
  documentAnalyses: any[], 
  jobTitle: string, 
  questionAnalysis: any
): Promise<string> {
  console.log('Building intelligent context with smart summarization...')
  
  // Try to get intelligent summary from localStorage (created during upload)
  let intelligentSummary = null
  try {
    if (typeof localStorage !== 'undefined') {
      const storedSummary = localStorage.getItem('intelligentSummary')
      if (storedSummary) {
        intelligentSummary = JSON.parse(storedSummary)
        console.log('Using existing intelligent summary for context')
      }
    }
  } catch (error) {
    console.log('No intelligent summary available, using document analyses')
  }
  
  if (intelligentSummary) {
    // Use the intelligent summary for richer context
    return buildContextFromIntelligentSummary(intelligentSummary, questionAnalysis, jobTitle)
  } else {
    // Fallback to document analyses
    return buildContextFromDocumentAnalyses(userProfile, documentAnalyses, jobTitle, questionAnalysis)
  }
}

function buildContextFromIntelligentSummary(summary: any, questionAnalysis: any, jobTitle: string): string {
  let context = `CANDIDATE INTELLIGENT PROFILE:\n`
  
  // Professional summary
  if (summary.professionalSummary) {
    context += `PROFESSIONAL OVERVIEW: ${summary.professionalSummary.overview}\n`
    context += `CAREER LEVEL: ${summary.professionalSummary.careerLevel}\n`
    context += `KEY STRENGTHS: ${summary.professionalSummary.keyStrengths.join(', ')}\n`
    context += `INDUSTRY EXPERTISE: ${summary.professionalSummary.industryExpertise.join(', ')}\n\n`
  }
  
  // Work experience with chronological context
  if (summary.workExperience) {
    context += `WORK EXPERIENCE:\n`
    context += `TOTAL EXPERIENCE: ${summary.workExperience.totalYears}\n`
    
    if (summary.workExperience.currentRole) {
      const current = summary.workExperience.currentRole
      context += `CURRENT ROLE: ${current.title} at ${current.company} (${current.duration})\n`
      context += `CURRENT HIGHLIGHTS: ${current.highlights.join(', ')}\n`
    }
    
    context += `CAREER HIGHLIGHTS: ${summary.workExperience.careerHighlights.join(', ')}\n`
    context += `INDUSTRY PROGRESSION: ${summary.workExperience.industryProgression}\n\n`
  }
  
  // Technical profile - especially relevant for technical questions
  if (summary.technicalProfile && questionAnalysis.type === 'technical') {
    context += `TECHNICAL EXPERTISE:\n`
    context += `CORE TECHNOLOGIES: ${summary.technicalProfile.coreTechnologies.join(', ')}\n`
    context += `FRAMEWORKS: ${summary.technicalProfile.frameworks.join(', ')}\n`
    context += `TOOLS: ${summary.technicalProfile.tools.join(', ')}\n`
    context += `METHODOLOGIES: ${summary.technicalProfile.methodologies.join(', ')}\n\n`
  }
  
  // Achievements - especially for behavioral questions
  if (summary.achievements && questionAnalysis.type === 'behavioral') {
    context += `DOCUMENTED ACHIEVEMENTS:\n`
    if (summary.achievements.quantifiable.length > 0) {
      context += `QUANTIFIABLE: ${summary.achievements.quantifiable.join(', ')}\n`
    }
    if (summary.achievements.leadership.length > 0) {
      context += `LEADERSHIP: ${summary.achievements.leadership.join(', ')}\n`
    }
    if (summary.achievements.technical.length > 0) {
      context += `TECHNICAL: ${summary.achievements.technical.join(', ')}\n`
    }
    context += '\n'
  }
  
  // Interview-ready context for specific responses
  if (summary.interviewContext) {
    if (questionAnalysis.type === 'technical' && summary.interviewContext.technicalResponses) {
      context += `TECHNICAL TALKING POINTS:\n`
      context += `PROJECT EXAMPLES: ${summary.interviewContext.technicalResponses.projectExamples.join(', ')}\n`
      context += `PROBLEM SOLVING: ${summary.interviewContext.technicalResponses.problemSolving.join(', ')}\n\n`
    }
    
    if (questionAnalysis.type === 'behavioral' && summary.interviewContext.behavioralExamples) {
      context += `BEHAVIORAL EXAMPLES:\n`
      context += `LEADERSHIP: ${summary.interviewContext.behavioralExamples.leadership.join(', ')}\n`
      context += `TEAMWORK: ${summary.interviewContext.behavioralExamples.teamwork.join(', ')}\n`
      context += `INITIATIVE: ${summary.interviewContext.behavioralExamples.initiative.join(', ')}\n\n`
    }
  }
  
  // Contextual insights for natural responses
  if (summary.contextualInsights) {
    context += `COMMUNICATION & APPROACH:\n`
    context += `COMMUNICATION STYLE: ${summary.contextualInsights.communicationStyle}\n`
    context += `PROBLEM SOLVING: ${summary.contextualInsights.problemSolvingApproach}\n`
    if (summary.contextualInsights.leadershipStyle) {
      context += `LEADERSHIP STYLE: ${summary.contextualInsights.leadershipStyle}\n`
    }
    context += `COLLABORATION: ${summary.contextualInsights.collaborationPreferences}\n\n`
  }
  
  context += `POSITION APPLYING FOR: ${jobTitle}\n`
  context += `QUESTION TYPE: ${questionAnalysis.type} (${questionAnalysis.difficulty} difficulty)\n`
  context += `CONFIDENCE FACTORS: ${questionAnalysis.personalizedElements.join(', ')}\n`
  
  return context
}

function buildContextFromDocumentAnalyses(
  userProfile: string, 
  documentAnalyses: any[], 
  jobTitle: string, 
  questionAnalysis: any
): string {
  let context = `CANDIDATE BACKGROUND FOR ${jobTitle.toUpperCase()} POSITION:\n\n`
  
  // Add user profile context
  if (userProfile && userProfile.trim()) {
    context += `BACKGROUND CONTEXT:\n${userProfile}\n\n`
  }
  
  // Extract and organize document information
  if (documentAnalyses.length > 0) {
    context += `PROFESSIONAL EXPERIENCE ANALYSIS:\n`
    
    documentAnalyses.forEach((doc, index) => {
      if (doc.experienceDetails?.workHistory && doc.experienceDetails.workHistory.length > 0) {
        context += `\nDOCUMENT ${index + 1} - WORK HISTORY (${doc.documentType}):\n`
        
        // Add chronological work experience
        doc.experienceDetails.workHistory.forEach((job: any, jobIndex: number) => {
          context += `${jobIndex + 1}. ${job.position} at ${job.company} (${job.startDate} - ${job.endDate})\n`
          context += `   Duration: ${job.duration}\n`
          if (job.responsibilities && job.responsibilities.length > 0) {
            context += `   Key Responsibilities: ${job.responsibilities.slice(0, 3).join(', ')}\n`
          }
          if (job.technologies && job.technologies.length > 0) {
            context += `   Technologies: ${job.technologies.join(', ')}\n`
          }
          if (job.achievements && job.achievements.length > 0) {
            context += `   Achievements: ${job.achievements.join(', ')}\n`
          }
        })
        
        context += `Total Experience: ${doc.experienceDetails.totalYears}\n`
        context += `Career Level: ${doc.experienceDetails.careerLevel}\n`
      }
      
      // Add skills for technical questions
      if (doc.extractedSkills && doc.extractedSkills.length > 0) {
        context += `\nTECHNICAL SKILLS: ${doc.extractedSkills.join(', ')}\n`
      }
      
      // Add achievements for behavioral questions  
      if (doc.keyAchievements && doc.keyAchievements.length > 0) {
        context += `KEY ACHIEVEMENTS: ${doc.keyAchievements.join(', ')}\n`
      }
    })
  }
  
  context += `\nQUESTION ANALYSIS:\n`
  context += `Type: ${questionAnalysis.type}\n`
  context += `Difficulty: ${questionAnalysis.difficulty}\n`
  context += `Confidence Score: ${questionAnalysis.confidenceScore}%\n`
  context += `Personalized Elements: ${questionAnalysis.personalizedElements.join(', ')}\n`
  
  return context
}

function buildIntelligentResponsePrompt(
  question: string, 
  context: string, 
  questionAnalysis: any, 
  language: string, 
  jobTitle: string
): string {
  const languageInstruction = language === 'en'
    ? 'Respond in English.'
    : `Respond in ${getLanguageName(language)}. Use natural, fluent ${getLanguageName(language)} throughout your response.`

  let specificInstructions = ''
  
  // Customize instructions based on question type and available context
  switch (questionAnalysis.type) {
    case 'technical':
      specificInstructions = `
TECHNICAL QUESTION APPROACH:
- Use your documented technical skills and real project experience
- Reference specific technologies and frameworks from your background
- If you have experience with the technology being asked about, mention the specific role/company where you used it
- Provide clear explanations that demonstrate both theoretical knowledge and practical application
- Show depth of understanding while being concise and professional
- Connect technical knowledge to business value when possible`
      break
      
    case 'behavioral':
      specificInstructions = `
BEHAVIORAL QUESTION APPROACH:
- Use the STAR method (Situation, Task, Action, Result) with your documented experience
- Reference specific companies, roles, and timeframes from your chronological work history
- Use actual achievements and responsibilities from your documented background
- Show growth and learning through your career progression
- Be specific about your role and contributions in examples
- Connect past experiences to future potential in this role`
      break
      
    case 'personal':
      specificInstructions = `
PERSONAL/MOTIVATIONAL QUESTION APPROACH:
- Connect your career progression and documented experiences to your motivation
- Show authenticity by referencing your actual professional journey
- Demonstrate alignment between your background and the role/company
- Express genuine enthusiasm while being professional
- Use your documented achievements to support your motivations`
      break
      
    default:
      specificInstructions = `
GENERAL QUESTION APPROACH:
- Draw from your documented professional background
- Be confident and specific using your actual experience
- Show enthusiasm for the role and company
- Demonstrate your value proposition clearly`
  }
  
  return `You are a professional candidate being interviewed for the position of ${jobTitle}.

${context}

CRITICAL INSTRUCTIONS FOR AUTHENTIC RESPONSES:
- Respond DIRECTLY as the candidate - no quotes, no meta-commentary, no "as a candidate" phrases
- ${languageInstruction}
- Use ONLY the information provided in your documented background above
- Be authentic, confident, and professional
- Reference specific companies, roles, technologies, and achievements from your actual background
- When discussing experience, maintain chronological accuracy (most recent first)
- Keep responses substantive but concise (3-4 sentences maximum)
- Show enthusiasm and genuine interest in the position

${specificInstructions}

RESPONSE REQUIREMENTS:
- Use natural, conversational tone like a real professional
- Ground all examples in your documented experience
- Be specific about companies, technologies, and achievements when relevant
- Show how your background aligns with this role
- Demonstrate growth mindset and continuous learning
- ${languageInstruction}

QUESTION: ${question}

Your professional response:`
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