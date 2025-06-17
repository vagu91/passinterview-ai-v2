import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'AI service not configured'
      }, { status: 500 })
    }

    const files = await req.formData()
    const fileArray = files.getAll('files') as File[]
    const targetLanguage = files.get('targetLanguage') as string || 'en'

    console.log(`Enhanced CV extraction starting: ${fileArray.length} files, target language: ${targetLanguage}`)

    if (!fileArray || fileArray.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided for analysis'
      }, { status: 400 })
    }

    // Process all files with advanced CV extraction
    const analyses = await Promise.all(
      fileArray.map(async (file, index) => {
        console.log(`Processing file ${index + 1}/${fileArray.length}: ${file.name}`)

        try {
          // Enhanced text extraction
          let extractedText = ''
          let extractionMethod = 'unknown'

          if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            extractedText = await file.text()
            extractionMethod = 'plain_text'
          } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer()
            extractedText = await extractTextFromBinary(arrayBuffer)
            extractionMethod = 'pdf_binary'
          } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            const arrayBuffer = await file.arrayBuffer()
            
            // Try Mammoth first for best results
            try {
              const mammoth = (await import('mammoth')).default
              const buffer = Buffer.from(arrayBuffer)
              const result = await mammoth.extractRawText({ buffer })
              if (result.value && result.value.length > 20) {
                extractedText = result.value
                extractionMethod = 'mammoth_docx'
              }
            } catch (mammothError) {
              // Fallback to XML extraction
              extractedText = await extractTextFromDocx(arrayBuffer)
              extractionMethod = 'docx_xml_fallback'
            }
          }

          if (!extractedText || extractedText.length < 50) {
            return {
              documentType: 'unknown',
              summary: `Could not extract sufficient text from ${file.name}`,
              extractedSkills: [],
              keyAchievements: [],
              experienceDetails: {
                totalYears: "Unknown",
                workHistory: []
              },
              extractionMethod,
              error: true
            }
          }

          console.log(`Text extracted from ${file.name}: ${extractedText.length} characters`)

          // FAST CV analysis - extract key work experience only
          const advancedPrompt = `You are a CV analyzer. Extract the MAIN work experiences quickly:

TEXT: ${extractedText.slice(0, 2000)}

EXTRACT QUICKLY:

JSON format:
{
  "documentType": "CV/Resume",
  "summary": "Brief professional summary",
  "extractedSkills": ["Main technologies found"],
  "keyAchievements": ["Key achievements"],
  "experienceDetails": {
    "totalYears": "Years of experience",
    "companies": ["Company names"],
    "workHistory": [
      {
        "position": "Job title",
        "company": "Company name", 
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY or Present",
        "duration": "Duration",
        "technologies": ["Tech used"],
        "responsibilities": ["Main tasks"]
      }
    ]
  },
  "contactInfo": {
    "email": "Email",
    "phone": "Phone"
  }
}`

          const { text: analysis } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: advancedPrompt,
            temperature: 0.1,
            maxTokens: 800, // Dramatically reduced for speed
          })

          // Parse and clean the response
          let result
          try {
            let cleanedAnalysis = analysis.trim()
            cleanedAnalysis = cleanedAnalysis
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/, '')
              .replace(/\s*```$/i, '')

            const jsonMatch = cleanedAnalysis.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              cleanedAnalysis = jsonMatch[0]
            }

            result = JSON.parse(cleanedAnalysis)
            result.extractionMethod = extractionMethod
            result.charactersExtracted = extractedText.length

            console.log(`CV analysis completed for ${file.name}:`, {
              workHistoryEntries: result.experienceDetails?.workHistory?.length || 0,
              skillsFound: result.extractedSkills?.length || 0,
              totalExperience: result.experienceDetails?.totalYears || 'N/A'
            })

          } catch (parseError) {
            console.error(`JSON parsing failed for ${file.name}:`, parseError)
            throw parseError
          }

          return result

        } catch (error) {
          console.error(`Error processing ${file.name}:`, error)
          return {
            documentType: 'error',
            summary: `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            extractedSkills: [],
            keyAchievements: [],
            experienceDetails: {
              totalYears: "Error",
              workHistory: []
            },
            extractionMethod: 'error',
            error: true
          }
        }
      })
    )

    console.log("All CV documents analyzed:", analyses.map(a => ({
      type: a.documentType,
      workExperiences: a.experienceDetails?.workHistory?.length || 0,
      skills: a.extractedSkills?.length || 0,
      success: !a.error
    })))

    return NextResponse.json({
      success: true,
      analyses: analyses,
      summary: {
        totalFiles: analyses.length,
        successfulExtractions: analyses.filter(a => !a.error).length,
        failedExtractions: analyses.filter(a => a.error).length,
        totalWorkExperiences: analyses.reduce((sum, a) => sum + (a.experienceDetails?.workHistory?.length || 0), 0),
        totalSkillsExtracted: analyses.reduce((sum, a) => sum + (a.extractedSkills?.length || 0), 0)
      }
    })

  } catch (error) {
    console.error('Error in enhanced CV analysis:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}

// Binary text extraction helper
async function extractTextFromBinary(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer)
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const rawText = decoder.decode(uint8Array)

    // Extract readable text patterns
    const readableChunks: string[] = []

    // Extract words and sentences
    const words = rawText.match(/[A-Za-z0-9À-ÿ][A-Za-z0-9À-ÿ\s.,;:!?()\/\-]{3,}/g)
    if (words) {
      words.forEach(word => {
        const cleaned = word.trim()
        if (cleaned.length >= 4 && /[A-Za-z]{2,}/.test(cleaned)) {
          readableChunks.push(cleaned)
        }
      })
    }

    // Extract emails, phone numbers, dates
    const emails = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
    if (emails) readableChunks.push(...emails)

    const phones = rawText.match(/[\+]?[0-9\s\-\(\)]{10,}/g)
    if (phones) {
      phones.forEach(phone => {
        const cleanPhone = phone.replace(/[^\d\+]/g, '')
        if (cleanPhone.length >= 8 && cleanPhone.length <= 15) {
          readableChunks.push(phone.trim())
        }
      })
    }

    const dates = rawText.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g)
    if (dates) readableChunks.push(...dates)

    // Remove duplicates and clean
    const uniqueChunks = Array.from(new Set(readableChunks))
      .filter(chunk => {
        const trimmed = chunk.trim()
        return trimmed.length >= 2 && trimmed.length <= 100 && /[A-Za-z]/.test(trimmed)
      })

    const extractedText = uniqueChunks
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    console.log(`Binary extraction: ${uniqueChunks.length} segments, ${extractedText.length} chars`)
    return extractedText

  } catch (error) {
    console.error('Binary text extraction error:', error)
    throw error
  }
}

// DOCX XML extraction helper
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer)
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const fullText = decoder.decode(uint8Array)

    const textMatches: string[] = []

    // Extract XML text nodes
    const wtMatches = fullText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)
    if (wtMatches) {
      wtMatches.forEach(match => {
        const textContent = match.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1')
        if (textContent && textContent.length > 1) {
          textMatches.push(textContent)
        }
      })
    }

    let extractedText = textMatches
      .filter(text => text.length > 2)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Clean HTML entities
    extractedText = extractedText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")

    console.log(`DOCX XML extraction: ${extractedText.length} characters`)
    return extractedText

  } catch (error) {
    console.error('DOCX XML extraction error:', error)
    throw error
  }
}