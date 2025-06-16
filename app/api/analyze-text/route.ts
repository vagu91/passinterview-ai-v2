import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text, language = 'it' } = await req.json()

    console.log("Analyzing text:", { textLength: text.length, language })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Text is too short for analysis'
      })
    }

    const analysisPrompt = language === 'it' ? `
Analizza questo testo di presentazione professionale e fornisci:

TESTO DA ANALIZZARE:
"${text}"

Fornisci la risposta in questo formato JSON:
{
  "score": [numero da 1 a 100],
  "confidence": [percentuale come numero],
  "suggestions": [
    "suggerimento 1",
    "suggerimento 2", 
    "suggerimento 3"
  ],
  "strengths": [
    "punto di forza 1",
    "punto di forza 2"
  ]
}

CRITERI DI VALUTAZIONE:
- Chiarezza e struttura
- Competenze tecniche specifiche  
- Esperienza quantificabile
- Linguaggio professionale
- Completezza informazioni

Se il testo è ottimo (score >90), metti suggestions: []
Rispondi SOLO con il JSON, niente altro.` : `
Analyze this professional presentation text and provide:

TEXT TO ANALYZE:
"${text}"

Provide response in this JSON format:
{
  "score": [number from 1 to 100],
  "confidence": [percentage as number],
  "suggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3"
  ],
  "strengths": [
    "strength 1", 
    "strength 2"
  ]
}

EVALUATION CRITERIA:
- Clarity and structure
- Specific technical skills
- Quantifiable experience
- Professional language
- Information completeness

If text is excellent (score >90), set suggestions: []
Respond ONLY with JSON, nothing else.`

    const { text: analysis } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: analysisPrompt,
      temperature: 0.3,
      maxTokens: 500,
    })

    // Parse JSON response
    let result
    try {
      result = JSON.parse(analysis)
    } catch (e) {
      // Fallback parsing if AI doesn't return pure JSON
      const scoreMatch = analysis.match(/"score":\s*(\d+)/)
      const confidenceMatch = analysis.match(/"confidence":\s*(\d+)/)
      
      result = {
        score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
        confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 85,
        suggestions: ["Consider adding more specific technical details", "Include quantifiable achievements"],
        strengths: ["Clear communication", "Relevant experience"]
      }
    }

    console.log("Text analysis result:", result)

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Error analyzing text:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze text',
      fallback: {
        score: 70,
        confidence: 80,
        suggestions: ["Add more specific details about your experience", "Include technical skills and tools"],
        strengths: ["Professional presentation", "Relevant background"]
      }
    }, { status: 500 })
  }
}