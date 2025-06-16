import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text, language = 'it' } = await req.json()

    console.log("Improving text:", { textLength: text.length, language })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Text is too short for improvement'
      })
    }

    const improvementPrompt = language === 'it' ? `
Migliora questo testo di presentazione professionale mantenendo le informazioni originali ma rendendolo più:
- Specifico e dettagliato
- Professionale e coinvolgente  
- Quantificato dove possibile
- Ben strutturato

TESTO ORIGINALE:
"${text}"

REGOLE:
- Mantieni tutte le informazioni originali
- Aggiungi dettagli tecnici specifici
- Usa un linguaggio professionale
- Organizza meglio la struttura
- Aggiungi metriche/anni dove appropriato
- Massimo 350 parole

TESTO MIGLIORATO:` : `
Improve this professional presentation text keeping the original information but making it more:
- Specific and detailed
- Professional and engaging
- Quantified where possible
- Well structured

ORIGINAL TEXT:
"${text}"

RULES:
- Keep all original information
- Add specific technical details
- Use professional language
- Better organize the structure
- Add metrics/years where appropriate
- Maximum 350 words

IMPROVED TEXT:`

    const { text: improvedText } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: improvementPrompt,
      temperature: 0.4,
      maxTokens: 600,
    })

    console.log("Text improvement completed")

    return NextResponse.json({
      success: true,
      improvedText: improvedText.trim()
    })

  } catch (error) {
    console.error('Error improving text:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to improve text'
    }, { status: 500 })
  }
}