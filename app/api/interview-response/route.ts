import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { question, userProfile, jobTitle, language = 'it' } = await req.json()

    console.log("Generating interview response for:", { question, jobTitle, language })

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Use original question for immediate response
    const originalQuestion = question.trim()
    console.log("Processing question:", originalQuestion)

    // Generate immediate response with original question
    const responsePrompt = language === 'it' ? 
      `Candidato esperto per ${jobTitle}. Background: ${userProfile}\n\nDomanda: "${originalQuestion}"\n\nRisposta professionale (2-3 frasi):` : 
      `Expert candidate for ${jobTitle}. Background: ${userProfile}\n\nQuestion: "${originalQuestion}"\n\nProfessional answer (2-3 sentences):`

    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      prompt: responsePrompt,
      temperature: 0.6,
      maxTokens: 150,
    })

    // Parallel smart correction analysis for tech terms
    const smartCorrectionPromise = (async () => {
      try {
        const correctionPrompt = language === 'it' ? 
          `Correggi automaticamente errori di trascrizione vocale in questa domanda: "${originalQuestion}"\n\nSostituisci parole che sembrano errori con termini tecnici corretti per un ${jobTitle}:\n- angola → Angular\n- react → React\n- c sciarpa → C#\n- java script → JavaScript\n- python → Python\n- nodo → Node\n- ecc.\n\nSe non ci sono errori da correggere, rispondi "NESSUNA_CORREZIONE".\nSe correggi qualcosa, rispondi SOLO con la domanda corretta.` :
          `Auto-correct voice transcription errors in this question: "${originalQuestion}"\n\nReplace words that seem like errors with correct tech terms for a ${jobTitle}:\n- angola → Angular\n- react → React\n- c sharp → C#\n- java script → JavaScript\n- python → Python\n- node → Node\n- etc.\n\nIf no corrections needed, respond "NO_CORRECTION".\nIf you correct something, respond ONLY with the corrected question.`

        const correctionResult = await streamText({
          model: openai('gpt-3.5-turbo'),
          prompt: correctionPrompt,
          temperature: 0.1,
          maxTokens: 80,
        })
        
        let correction = ''
        for await (const delta of correctionResult.textStream) {
          correction += delta
        }
        
        const trimmedCorrection = correction.trim()
        return (trimmedCorrection === "NESSUNA_CORREZIONE" || trimmedCorrection === "NO_CORRECTION") ? null : trimmedCorrection
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

          // Stream the immediate AI response
          for await (const delta of result.textStream) {
            const chunk = {
              type: 'delta',
              content: delta
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          }

          // Check smart correction result
          const correctedQuestion = await smartCorrectionPromise
          
          if (correctedQuestion) {
            // Add small separator and generate improved response
            const separator = {
              type: 'delta',
              content: '\n\n'
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(separator)}\n\n`))

            // Generate better response with corrected question automatically
            const betterPrompt = language === 'it' ? 
              `Candidato esperto per ${jobTitle}. Background: ${userProfile}\n\nDomanda: "${correctedQuestion}"\n\nRisposta professionale (2-3 frasi):` : 
              `Expert candidate for ${jobTitle}. Background: ${userProfile}\n\nQuestion: "${correctedQuestion}"\n\nProfessional answer (2-3 sentences):`

            const betterResult = await streamText({
              model: openai('gpt-3.5-turbo'),
              prompt: betterPrompt,
              temperature: 0.6,
              maxTokens: 150,
            })

            // Stream the corrected response directly
            for await (const delta of betterResult.textStream) {
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
            message: 'Errore nella generazione della risposta'
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
    
    // Parse request data for fallback
    const requestBody = await req.json().catch(() => ({}))
    const fallbackLanguage = requestBody.language || 'it'
    const fallbackQuestion = requestBody.question || 'Domanda non disponibile'
    
    // Fallback response for errors
    const fallbackResponse = fallbackLanguage === 'it' ? 
      "Grazie per la domanda. Basandomi sulla mia esperienza e competenze, ritengo di poter contribuire significativamente a questa posizione e all'azienda." :
      "Thank you for the question. Based on my experience and skills, I believe I can contribute significantly to this position and the company."

    // Create streaming fallback response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        try {
          // Send metadata
          const metadata = {
            type: 'metadata',
            question: fallbackQuestion
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`))

          // Send response as chunks
          const words = fallbackResponse.split(' ')
          words.forEach((word, index) => {
            const chunk = {
              type: 'delta',
              content: index === 0 ? word : ` ${word}`
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          })

          // Send completion
          const completion = { type: 'done' }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`))
          
        } catch (error) {
          const errorChunk = {
            type: 'error',
            message: 'Errore nella generazione della risposta'
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
  }
}