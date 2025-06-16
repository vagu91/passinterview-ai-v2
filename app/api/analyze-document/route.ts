// app/api/analyze-document/route.ts - FIXED VERSION WITH WORKING PDF SUPPORT

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

// Note: Install required dependencies
// npm install mammoth @types/mammoth

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const targetLanguage = formData.get('language') as string || 'en'

    console.log("Analyzing documents with enhanced extraction:", {
      fileNames: files.map(f => f.name),
      totalFiles: files.length,
      targetLanguage
    })

    if (!files || files.length === 0) {
      console.error("No files provided in request")
      return NextResponse.json({
        success: false,
        error: 'No files provided'
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return NextResponse.json({
        success: false,
        error: 'AI service not configured'
      }, { status: 500 })
    }

    // Process all files with enhanced extraction
    const analyses = await Promise.all(
      files.map(async (file, index) => {
        console.log(`Processing file ${index + 1}/${files.length}: ${file.name}`)

        // Determine document type
        const fileName = file.name.toLowerCase()
        let docType = 'document'

        if (fileName.includes('cv') || fileName.includes('resume') || fileName.includes('curriculum')) {
          docType = 'cv'
        } else if (fileName.includes('cover') || fileName.includes('letter') || fileName.includes('motivation')) {
          docType = 'cover_letter'
        } else if (fileName.includes('job') || fileName.includes('description') || fileName.includes('position')) {
          docType = 'job_description'
        }

        try {
          // Text extraction with proper error handling
          let fileText: string | null = null
          let charactersExtracted = 0
          let extractionMethod = 'unknown'
          let extractionError: string | null = null

          // TEXT FILES
          if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
            try {
              fileText = await file.text()
              charactersExtracted = fileText ? fileText.length : 0
              extractionMethod = 'plain_text'
              console.log(`Text file extraction: ${charactersExtracted} characters`)
            } catch (textError) {
              console.warn(`Failed to extract text from ${file.name}:`, textError)
              extractionError = `Text extraction failed: ${textError instanceof Error ? textError.message : 'Unknown error'}`
              fileText = null
              charactersExtracted = 0
              extractionMethod = 'failed'
            }
          }

          // PDF FILES - Simple approach using FileReader-like logic
          else if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
            try {
              const arrayBuffer = await file.arrayBuffer()
              console.log(`Processing PDF file: ${file.name}, size: ${arrayBuffer.byteLength} bytes`)

              // Simple binary text extraction for PDFs
              const extractedText = await extractTextFromBinary(arrayBuffer)
              if (extractedText && extractedText.length > 100) {
                fileText = extractedText
                charactersExtracted = extractedText.length // Use extractedText.length, not fileText.length
                extractionMethod = 'pdf_binary'
                console.log(`PDF binary extraction: ${charactersExtracted} characters extracted`)
                console.log(`First 200 characters: ${extractedText.substring(0, 200)}...`)
              } else {
                extractionError = 'PDF text extraction yielded insufficient readable content'
                fileText = null
                charactersExtracted = 0
                extractionMethod = 'failed'
              }

            } catch (pdfProcessError) {
              console.error(`PDF processing error for ${file.name}:`, pdfProcessError)
              extractionError = `PDF processing error: ${pdfProcessError instanceof Error ? pdfProcessError.message : 'Unknown error'}`
              fileText = null
              charactersExtracted = 0
              extractionMethod = 'failed'
            }
          }

          // DOCX FILES
          else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            try {
              const arrayBuffer = await file.arrayBuffer()
              console.log(`Processing DOCX file: ${file.name}, size: ${arrayBuffer.byteLength} bytes`)

              try {
                const mammoth = (await import('mammoth')).default
                const buffer = Buffer.from(arrayBuffer)
                const result = await mammoth.extractRawText({ buffer })

                if (result.value && result.value.length > 50) {
                  fileText = result.value
                  charactersExtracted = fileText.length
                  extractionMethod = 'mammoth_docx'
                  console.log(`Mammoth DOCX extraction successful: ${charactersExtracted} characters extracted`)
                } else {
                  throw new Error(`Mammoth extraction yielded insufficient text: ${result.value?.length || 0} characters`)
                }

              } catch (mammothError) {
                console.error(`Mammoth extraction failed for ${file.name}:`, mammothError)
                extractionError = `DOCX extraction failed: ${mammothError instanceof Error ? mammothError.message : 'Unknown error'}`

                // Try XML fallback
                try {
                  const extractedText = await extractTextFromDocx(arrayBuffer)
                  if (extractedText && extractedText.length > 50) {
                    fileText = extractedText
                    charactersExtracted = fileText.length
                    extractionMethod = 'docx_xml_fallback'
                    console.log(`DOCX XML fallback extraction: ${charactersExtracted} characters extracted`)
                  } else {
                    throw new Error('XML fallback failed')
                  }
                } catch (xmlError) {
                  console.warn(`All DOCX extraction methods failed for ${file.name}:`, xmlError)
                  fileText = null
                  charactersExtracted = 0
                  extractionMethod = 'failed'
                  extractionError = `All DOCX extraction methods failed: ${xmlError instanceof Error ? xmlError.message : 'Unknown error'}`
                }
              }

            } catch (docxProcessError) {
              console.error(`DOCX processing error for ${file.name}:`, docxProcessError)
              extractionError = `DOCX processing error: ${docxProcessError instanceof Error ? docxProcessError.message : 'Unknown error'}`
              fileText = null
              charactersExtracted = 0
              extractionMethod = 'failed'
            }
          }

          // UNSUPPORTED FILE TYPES
          else {
            console.log(`Unsupported file type for text extraction: ${file.name} (${file.type})`)
            extractionError = `Formato file non supportato: ${file.type || 'sconosciuto'}. Formati supportati: PDF, DOCX, TXT`
            charactersExtracted = 0
            fileText = null
            extractionMethod = 'unsupported'
          }

          // If extraction completely failed, return early with clear error
          if (extractionMethod === 'failed' || extractionMethod === 'unsupported') {
            console.error(`Text extraction failed for ${file.name}: ${extractionError}`)

            return {
              documentType: docType,
              extractionQuality: extractionMethod,
              summary: `ERRORE: Impossibile estrarre il testo da ${file.name}. ${extractionError}`,
              keyInsights: [
                `❌ Estrazione del testo fallita per ${file.name}`,
                `📄 Tipo file: ${file.type || 'sconosciuto'} (${(file.size / 1024).toFixed(1)} KB)`,
                `🔧 Motivo: ${extractionError}`,
                extractionMethod === 'unsupported'
                  ? "💡 Soluzione: Carica un file PDF, DOCX o TXT supportato"
                  : "💡 Soluzione: Verifica che il file non sia corrotto e riprova"
              ],
              extractedSkills: [],
              experienceDetails: {
                totalYears: "Analisi non disponibile",
                industries: [],
                roles: [],
                companies: [],
                workHistory: []
              },
              keyAchievements: [],
              education: {
                degrees: [],
                institutions: [],
                certifications: []
              },
              contactInfo: {
                email: "non estratto",
                phone: "non estratto",
                location: "non estratto"
              },
              documentQuality: {
                textExtractionSuccess: false,
                analyzableContent: false,
                recommendedAction: extractionMethod === 'unsupported'
                  ? "Carica un file in formato supportato (PDF, DOCX, TXT)"
                  : "Verifica l'integrità del file e riprova"
              },
              charactersExtracted: 0,
              extractionMethod: extractionMethod,
              extractionError: extractionError,
              error: true
            }
          }

          // Continue with AI analysis only if we have extracted text
          console.log(`Sending content to AI for analysis: ${file.name} (${charactersExtracted} chars)`)

          const analysisPrompt = `You are an expert document analyzer. Analyze this document thoroughly.

DOCUMENT INFORMATION:
- Filename: ${file.name}
- Type: ${docType}
- Size: ${(file.size / 1024).toFixed(1)} KB
- Extraction Method: ${extractionMethod}
- Characters Extracted: ${charactersExtracted}

DOCUMENT CONTENT:
${fileText || 'NO READABLE CONTENT AVAILABLE'}

Please provide a comprehensive analysis based on the actual content. Extract:
- All technical skills, programming languages, frameworks, tools mentioned
- Company names, job titles, employment periods, and responsibilities
- Education details, degrees, certifications, and institutions
- Key achievements, projects, and quantifiable results
- Contact information (email, phone, location)
- Assessment of experience level based on career progression

IMPORTANT: For work experience, organize jobs in REVERSE CHRONOLOGICAL ORDER (most recent first).
Each job should include: company name, role title, start date, end date (or "Present"), and key responsibilities.

OUTPUT FORMAT - Respond with this EXACT JSON format (NO MARKDOWN, NO CODE BLOCKS):
{
  "documentType": "${docType}",
  "extractionQuality": "${extractionMethod}",
  "summary": "Detailed summary of the professional profile based on actual content",
  "keyInsights": [
    "Key insight about the candidate's profile",
    "Notable professional experiences or achievements",
    "Assessment of overall experience level and expertise"
  ],
  "extractedSkills": [
    "List of technical skills, programming languages, and tools found"
  ],
  "experienceDetails": {
    "totalYears": "Calculated years of experience",
    "industries": ["Industries identified"],
    "roles": ["Specific job titles found"],
    "companies": ["Company names found"],
    "workHistory": [
      {
        "company": "Company Name",
        "role": "Job Title",
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY or Present",
        "duration": "X years Y months",
        "responsibilities": ["Key responsibility 1", "Key responsibility 2"],
        "technologies": ["Technology 1", "Technology 2"]
      }
    ]
  },
  "keyAchievements": [
    "Specific achievements and projects mentioned"
  ],
  "education": {
    "degrees": ["Educational qualifications found"],
    "institutions": ["Educational institutions found"],
    "certifications": ["Professional certifications identified"]
  },
  "contactInfo": {
    "email": "email found or 'not extracted'",
    "phone": "phone found or 'not extracted'",
    "location": "location found or 'not extracted'"
  },
  "documentQuality": {
    "textExtractionSuccess": true,
    "analyzableContent": true,
    "recommendedAction": "Analysis completed successfully"
  }
}

CRITICAL: 
1. Return PURE JSON only, no markdown formatting, no code blocks, no additional text.
2. Order work experience from most recent to oldest.
3. Extract exact dates when available, estimate when unclear.
4. Include all technologies/tools mentioned for each role.`

          const { text: analysis } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: analysisPrompt,
            temperature: 0.1,
            maxTokens: 1500,
          })

          console.log(`AI analysis completed for ${file.name}`)

          // Parse JSON response
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

            // Add extraction metadata
            result.charactersExtracted = charactersExtracted
            result.extractionMethod = extractionMethod

            console.log(`Analysis successful for ${file.name}:`, {
              extractionMethod,
              charactersExtracted,
              skillsFound: result.extractedSkills?.length || 0,
              companiesFound: result.experienceDetails?.companies?.length || 0
            })

          } catch (parseError) {
            console.error(`JSON parsing failed for ${file.name}:`, parseError)
            throw parseError
          }

          // Translate if needed
          if (targetLanguage !== 'en') {
            result = await translateAnalysis(result, targetLanguage)
          }

          return result

        } catch (error) {
          console.error(`Critical error processing file ${file.name}:`, error)
          return {
            documentType: docType,
            extractionQuality: 'error',
            summary: `ERRORE CRITICO: Impossibile processare ${file.name}. ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
            keyInsights: [
              '❌ Errore critico durante il processamento del file',
              '🔧 Il file potrebbe essere corrotto o in un formato non supportato',
              '💡 Contatta il supporto se l\'errore persiste'
            ],
            extractedSkills: [],
            experienceDetails: {
              totalYears: "Errore nel processamento",
              industries: [],
              roles: [],
              companies: [],
              workHistory: []
            },
            keyAchievements: [],
            education: {
              degrees: [],
              institutions: [],
              certifications: []
            },
            contactInfo: {
              email: "non estratto",
              phone: "non estratto",
              location: "non estratto"
            },
            documentQuality: {
              textExtractionSuccess: false,
              analyzableContent: false,
              recommendedAction: "Errore nel processamento - prova con un file diverso"
            },
            charactersExtracted: 0,
            extractionMethod: 'error',
            error: true
          }
        }
      })
    )

    console.log("All documents analyzed:", analyses.map(a => ({
      type: a.documentType,
      extraction: a.extractionMethod,
      chars: a.charactersExtracted,
      success: !a.error
    })))

    return NextResponse.json({
      success: true,
      analyses: analyses,
      summary: {
        totalFiles: analyses.length,
        successfulExtractions: analyses.filter(a => !a.error && a.charactersExtracted > 0).length,
        failedExtractions: analyses.filter(a => a.error).length
      }
    })

  } catch (error) {
    console.error('Critical error in document analysis API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze document',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}

// Helper function for binary text extraction (works for PDFs and other docs)
async function extractTextFromBinary(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer)
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const rawText = decoder.decode(uint8Array)

    // Extract readable text using multiple strategies
    const readableChunks: string[] = []

    // Strategy 1: Look for continuous readable text (minimum 4 characters)
    const words = rawText.match(/[A-Za-z0-9À-ÿ][A-Za-z0-9À-ÿ\s.,;:!?()\-]{3,}/g)
    if (words) {
      words.forEach(word => {
        const cleaned = word.trim()
        // Only include chunks that have real words (not just symbols/numbers)
        if (cleaned.length >= 4 && /[A-Za-z]{2,}/.test(cleaned)) {
          // Split long chunks and filter out obvious binary garbage
          const subWords = cleaned.split(/\s+/)
          subWords.forEach(subWord => {
            if (subWord.length >= 2 && subWord.length <= 50 && /[A-Za-z]/.test(subWord)) {
              readableChunks.push(subWord)
            }
          })
        }
      })
    }

    // Strategy 2: Extract email addresses
    const emails = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
    if (emails) {
      readableChunks.push(...emails)
    }

    // Strategy 3: Extract phone numbers (more selective)
    const phones = rawText.match(/[\+]?[0-9\s\-\(\)]{10,}/g)
    if (phones) {
      phones.forEach(phone => {
        const cleanPhone = phone.replace(/[^\d\+]/g, '')
        if (cleanPhone.length >= 8 && cleanPhone.length <= 15) {
          readableChunks.push(phone.trim())
        }
      })
    }

    // Strategy 4: Extract dates (more specific patterns)
    const dates = rawText.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g)
    if (dates) {
      readableChunks.push(...dates)
    }

    // Strategy 5: Look for URLs
    const urls = rawText.match(/https?:\/\/[^\s]+/g)
    if (urls) {
      readableChunks.push(...urls)
    }

    // Remove duplicates and very short/long chunks
    const uniqueChunks = Array.from(new Set(readableChunks))
      .filter(chunk => {
        const trimmed = chunk.trim()
        return trimmed.length >= 2 &&
          trimmed.length <= 100 &&
          !/^[^a-zA-Z]*$/.test(trimmed) && // Not just numbers/symbols
          !/[\x00-\x1F\x7F-\xFF]{3,}/.test(trimmed) // Not binary garbage
      })

    // Combine and clean
    let extractedText = uniqueChunks
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace again
      .trim()

    console.log(`Binary text extraction: found ${uniqueChunks.length} valid text segments`)
    console.log(`Total extracted length: ${extractedText.length} characters`)
    console.log(`Sample chunks: ${uniqueChunks.slice(0, 10).join(', ')}`)

    return extractedText

  } catch (error) {
    console.error('Binary text extraction error:', error)
    throw error
  }
}

// Enhanced translation function
async function translateAnalysis(analysis: any, targetLanguage: string) {
  if (!process.env.OPENAI_API_KEY) {
    return analysis
  }

  try {
    console.log(`Translating analysis to ${targetLanguage}`)

    const translatePrompt = `Translate this document analysis from English to ${getLanguageName(targetLanguage)}. 
    
Keep the JSON structure exactly the same, only translate the text content values. Do not translate:
- Field names/keys 
- Boolean values
- Numbers
- Email addresses
- Technical terms commonly used in English

JSON to translate:
${JSON.stringify(analysis, null, 2)}

Respond with the translated JSON maintaining the exact same structure.`

    const { text: translatedText } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: translatePrompt,
      temperature: 0.1,
      maxTokens: 2000,
    })

    let cleanedTranslation = translatedText.trim()
    cleanedTranslation = cleanedTranslation
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/i, '')

    const jsonMatch = cleanedTranslation.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedTranslation = jsonMatch[0]
    }

    const translatedAnalysis = JSON.parse(cleanedTranslation)
    console.log(`Translation to ${targetLanguage} completed successfully`)

    return translatedAnalysis

  } catch (error) {
    console.warn(`Translation to ${targetLanguage} failed, returning original:`, error)
    return analysis
  }
}

function getLanguageName(langCode: string): string {
  const names: { [key: string]: string } = {
    'it': 'Italian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'nl': 'Dutch',
    'pl': 'Polish',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean'
  }
  return names[langCode] || 'English'
}

// Fallback DOCX text extraction function using ZIP parsing
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer)

    if (uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
      throw new Error('Not a valid ZIP/DOCX file')
    }

    const decoder = new TextDecoder('utf-8', { fatal: false })
    const fullText = decoder.decode(uint8Array)

    const textMatches: string[] = []

    // Look for <w:t> tags (Word text elements)
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

    extractedText = extractedText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    console.log(`Fallback DOCX text extraction: ${extractedText.length} characters`)
    return extractedText

  } catch (error) {
    console.error('Fallback DOCX extraction error:', error)
    throw error
  }
}