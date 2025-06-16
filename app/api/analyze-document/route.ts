// app/api/analyze-document/route.ts - ENHANCED VERSION WITH PROPER DOCX SUPPORT

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

// Note: You'll need to install mammoth for DOCX support
// npm install mammoth @types/mammoth

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const targetLanguage = formData.get('language') as string || 'en'

    console.log("Analyzing documents with enhanced DOCX extraction:", {
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

        try {
          // Determine document type
          const fileName = file.name.toLowerCase()
          let documentType = 'document'

          if (fileName.includes('cv') || fileName.includes('resume') || fileName.includes('curriculum')) {
            documentType = 'cv'
          } else if (fileName.includes('cover') || fileName.includes('letter') || fileName.includes('motivation')) {
            documentType = 'cover_letter'
          } else if (fileName.includes('job') || fileName.includes('description') || fileName.includes('position')) {
            documentType = 'job_description'
          }

          // ENHANCED text extraction with proper DOCX support
          let fileText: string | null = null
          let charactersExtracted = 0
          let extractionMethod = 'unknown'

          if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
            try {
              fileText = await file.text()
              charactersExtracted = fileText ? fileText.length : 0
              extractionMethod = 'plain_text'
              console.log(`Text file extraction: ${charactersExtracted} characters`)
            } catch (textError) {
              console.warn(`Failed to extract text from ${file.name}:`, textError)
              fileText = null
              charactersExtracted = 0
              extractionMethod = 'failed'
            }
          } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            try {
              // Enhanced DOCX extraction using mammoth
              const arrayBuffer = await file.arrayBuffer()
              console.log(`Processing DOCX file: ${file.name}, size: ${arrayBuffer.byteLength} bytes`)

              try {
                // Debug: Test mammoth import first
                console.log('Attempting to import mammoth...')
                const mammoth = (await import('mammoth')).default
                console.log('Mammoth imported successfully:', typeof mammoth)

                // Convert ArrayBuffer to Buffer for mammoth
                const buffer = Buffer.from(arrayBuffer)
                console.log('Converted to Buffer, size:', buffer.length)

                console.log('Calling mammoth.extractRawText...')
                const result = await mammoth.extractRawText({ buffer })
                console.log('Mammoth result:', {
                  textLength: result.value?.length || 0,
                  hasMessages: result.messages?.length || 0,
                  firstChars: result.value?.substring(0, 200) || 'No text'
                })

                if (result.value && result.value.length > 50) {
                  fileText = result.value
                  charactersExtracted = fileText.length
                  extractionMethod = 'mammoth_docx'
                  console.log(`Mammoth DOCX extraction successful: ${charactersExtracted} characters extracted`)

                  if (result.messages && result.messages.length > 0) {
                    console.log('Mammoth extraction messages:', result.messages.map(m => m.message))
                  }
                } else {
                  throw new Error(`Mammoth extraction yielded insufficient text: ${result.value?.length || 0} characters`)
                }

              } catch (mammothError) {
                console.error(`Mammoth extraction failed for ${file.name}:`, mammothError)

                // Fallback to XML extraction if mammoth fails
                const extractedText = await extractTextFromDocx(arrayBuffer)

                if (extractedText && extractedText.length > 50) {
                  fileText = extractedText
                  charactersExtracted = fileText.length
                  extractionMethod = 'docx_xml_fallback'
                  console.log(`DOCX XML fallback extraction: ${charactersExtracted} characters extracted`)
                } else {
                  throw new Error('All DOCX extraction methods failed')
                }
              }

            } catch (docxError) {
              console.warn(`All DOCX extraction failed for ${file.name}:`, docxError)

              // Fallback: try to extract what we can
              try {
                const arrayBuffer = await file.arrayBuffer()
                const uint8Array = new Uint8Array(arrayBuffer)

                // Simple text search in binary data as last resort
                const decoder = new TextDecoder('utf-8', { fatal: false })
                const rawText = decoder.decode(uint8Array)

                // Extract readable parts (basic heuristic)
                const readableText = rawText
                  .split('')
                  .filter(char => {
                    const code = char.charCodeAt(0)
                    return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9
                  })
                  .join('')
                  .replace(/\s+/g, ' ')
                  .trim()

                if (readableText.length > 50) {
                  fileText = readableText
                  charactersExtracted = readableText.length
                  extractionMethod = 'binary_fallback'
                  console.log(`Binary fallback extraction: ${charactersExtracted} characters`)
                } else {
                  throw new Error('No readable text found in binary data')
                }

              } catch (fallbackError) {
                console.warn(`Binary fallback also failed for ${file.name}:`, fallbackError)

                // Final fallback - provide structure-based analysis
                fileText = `DOCX File: ${file.name}
Size: ${(file.size / 1024).toFixed(1)} KB
Type: ${documentType}
Status: Unable to extract text content
Note: This appears to be a ${documentType} document based on filename analysis`

                charactersExtracted = fileText.length
                extractionMethod = 'structure_only'
              }
            }
          } else {
            console.log(`Unsupported file type for text extraction: ${file.name}`)
            charactersExtracted = 0
            fileText = null
            extractionMethod = 'unsupported'
          }

          // Enhanced AI analysis prompt
          const analysisPrompt = `You are an expert document analyzer. Analyze this document thoroughly.

DOCUMENT INFORMATION:
- Filename: ${file.name}
- Type: ${documentType}
- Size: ${(file.size / 1024).toFixed(1)} KB
- Extraction Method: ${extractionMethod}
- Characters Extracted: ${charactersExtracted}

DOCUMENT CONTENT:
${fileText || 'NO READABLE CONTENT AVAILABLE'}

ANALYSIS INSTRUCTIONS:
${fileText && charactersExtracted > 100 ? `
The extracted text is available and appears readable. Please provide a comprehensive analysis based on the actual content:
- Extract all technical skills, programming languages, frameworks, tools mentioned
- Identify company names, job titles, employment periods, and responsibilities
- Find education details, degrees, certifications, and institutions
- Identify key achievements, projects, and quantifiable results
- Assess experience level based on career progression and complexity of roles
` : `
The text extraction was limited or failed. Based on the filename "${file.name}" and document type "${documentType}":
- This appears to be a professional CV/Resume document
- Provide a realistic analysis of what would typically be found in such a document
- Clearly indicate that the analysis is based on document characteristics rather than content
- Focus on typical professional elements for this type of document
`}

OUTPUT FORMAT:
Respond with this EXACT JSON format (NO MARKDOWN, NO CODE BLOCKS):
{
  "documentType": "${documentType}",
  "extractionQuality": "${extractionMethod}",
  "summary": "Detailed summary of the analysis - indicate if based on actual content or document structure inference",
  "keyInsights": [
    "Key insight about content quality and extraction success",
    "Information about what was successfully analyzed",
    "Assessment of professional level and document quality"
  ],
  "extractedSkills": [
    "List of technical skills found or typically expected in this type of document"
  ],
  "experienceDetails": {
    "totalYears": "Specific experience level found or reasonable estimate",
    "industries": ["Industries identified or typical for this role type"],
    "roles": ["Specific job titles found or typical roles"],
    "companies": ["Company names found or indicate if inferred"]
  },
  "keyAchievements": [
    "Specific achievements found or typical professional accomplishments"
  ],
  "education": {
    "degrees": ["Educational qualifications found or typical"],
    "institutions": ["Educational institutions found"],
    "certifications": ["Professional certifications identified"]
  },
  "contactInfo": {
    "email": "email found or 'not extracted'",
    "phone": "phone found or 'not extracted'",
    "location": "location found or 'not extracted'"
  },
  "documentQuality": {
    "textExtractionSuccess": ${charactersExtracted > 100 ? 'true' : 'false'},
    "analyzableContent": ${charactersExtracted > 200 ? 'true' : 'false'},
    "recommendedAction": "Recommendation for improving analysis if needed"
  }
}

CRITICAL: Return PURE JSON only, no markdown formatting, no code blocks, no additional text.`

          let result

          try {
            console.log(`Sending content to AI for analysis: ${file.name} (${charactersExtracted} chars)`)

            const { text: analysis } = await generateText({
              model: openai('gpt-4o-mini'),
              prompt: analysisPrompt,
              temperature: 0.1,
              maxTokens: 1500,
            })

            console.log(`AI analysis completed for ${file.name}`)

            // Enhanced JSON parsing with better error handling
            try {
              let cleanedAnalysis = analysis.trim()

              // Remove any markdown formatting
              cleanedAnalysis = cleanedAnalysis
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/, '')
                .replace(/\s*```$/i, '')
                .replace(/^\s*```\s*$/gm, '')

              // Extract JSON object
              const jsonMatch = cleanedAnalysis.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                cleanedAnalysis = jsonMatch[0];
              }

              result = JSON.parse(cleanedAnalysis)

              // Ensure all required fields exist with defaults
              result.extractedSkills = result.extractedSkills || []
              result.keyAchievements = result.keyAchievements || []
              result.keyInsights = result.keyInsights || []

              if (!result.experienceDetails) {
                result.experienceDetails = {
                  totalYears: "Not specified",
                  industries: [],
                  roles: [],
                  companies: []
                }
              }

              if (!result.education) {
                result.education = {
                  degrees: [],
                  institutions: [],
                  certifications: []
                }
              }

              if (!result.contactInfo) {
                result.contactInfo = {
                  email: "not extracted",
                  phone: "not extracted",
                  location: "not extracted"
                }
              }

              if (!result.documentQuality) {
                result.documentQuality = {
                  textExtractionSuccess: charactersExtracted > 100,
                  analyzableContent: charactersExtracted > 200,
                  recommendedAction: charactersExtracted < 100 ?
                    "Consider uploading a different format or checking file integrity" :
                    "Document successfully analyzed"
                }
              }

              // Add extraction metadata
              result.charactersExtracted = charactersExtracted
              result.extractionMethod = extractionMethod

              console.log(`Analysis successful for ${file.name}:`, {
                extractionMethod,
                charactersExtracted,
                skillsFound: result.extractedSkills.length,
                companiesFound: result.experienceDetails.companies.length,
                textExtractionSuccess: result.documentQuality.textExtractionSuccess
              })

            } catch (parseError) {
              console.error(`JSON parsing failed for ${file.name}:`, parseError)
              console.log(`Raw AI response: "${analysis}"`)
              throw parseError
            }

          } catch (aiError) {
            console.error(`AI analysis failed for ${file.name}:`, aiError)

            // Comprehensive fallback response
            result = {
              documentType: documentType,
              extractionQuality: extractionMethod,
              summary: `File ${file.name} uploaded successfully. ${charactersExtracted} characters extracted using ${extractionMethod} method. AI analysis encountered an error.`,
              keyInsights: [
                `File processing: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
                `Text extraction: ${charactersExtracted} characters using ${extractionMethod}`,
                `AI analysis failed - technical error occurred`
              ],
              extractedSkills: [],
              experienceDetails: {
                totalYears: "Analysis failed",
                industries: [],
                roles: [],
                companies: []
              },
              keyAchievements: [],
              education: {
                degrees: [],
                institutions: [],
                certifications: []
              },
              contactInfo: {
                email: "not extracted",
                phone: "not extracted",
                location: "not extracted"
              },
              documentQuality: {
                textExtractionSuccess: charactersExtracted > 100,
                analyzableContent: false,
                recommendedAction: "AI analysis failed - please try again or contact support"
              },
              charactersExtracted: charactersExtracted,
              extractionMethod: extractionMethod,
              error: true
            }
          }

          // Translate if needed
          if (targetLanguage !== 'en') {
            result = await translateAnalysis(result, targetLanguage)
          }

          console.log(`File ${file.name} processing completed successfully`)
          return result

        } catch (error) {
          console.error(`Critical error processing file ${file.name}:`, error)
          return {
            documentType: 'unknown',
            extractionQuality: 'failed',
            summary: `Critical error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            keyInsights: [
              'File processing failed completely',
              'This may indicate a corrupted file or unsupported format',
              'Contact support if this error persists'
            ],
            extractedSkills: [],
            experienceDetails: {
              totalYears: "Processing failed",
              industries: [],
              roles: [],
              companies: []
            },
            keyAchievements: [],
            education: {
              degrees: [],
              institutions: [],
              certifications: []
            },
            contactInfo: {
              email: "not extracted",
              phone: "not extracted",
              location: "not extracted"
            },
            documentQuality: {
              textExtractionSuccess: false,
              analyzableContent: false,
              recommendedAction: "File processing failed - try a different file format"
            },
            charactersExtracted: 0,
            extractionMethod: 'failed',
            error: true
          }
        }
      })
    )

    console.log("All documents analyzed:", analyses.map(a => ({
      type: a.documentType,
      extraction: a.extractionMethod,
      chars: a.charactersExtracted,
      skillsCount: a.extractedSkills?.length || 0,
      companiesCount: a.experienceDetails?.companies?.length || 0,
      success: !a.error,
      textExtracted: a.documentQuality?.textExtractionSuccess || false
    })))

    return NextResponse.json({
      success: true,
      analyses: analyses,
      summary: {
        totalFiles: analyses.length,
        successfulExtractions: analyses.filter(a => a.documentQuality?.textExtractionSuccess).length,
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

// Enhanced translation function
async function translateAnalysis(analysis: any, targetLanguage: string) {
  if (!process.env.OPENAI_API_KEY) {
    return analysis
  }

  try {
    console.log(`Translating analysis to ${targetLanguage}`)

    const translatePrompt = `Translate this document analysis from English to ${getLanguageName(targetLanguage)}. 
    
IMPORTANT: Keep the JSON structure exactly the same, only translate the text content values. Do not translate:
- Field names/keys 
- Boolean values
- Numbers
- Email addresses
- Technical terms that are commonly used in English in professional contexts

JSON to translate:
${JSON.stringify(analysis, null, 2)}

Respond with the translated JSON maintaining the exact same structure.`

    const { text: translatedText } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: translatePrompt,
      temperature: 0.1,
      maxTokens: 2000,
    })

    // Parse translated response
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

    // Look for the ZIP file signature
    if (uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
      throw new Error('Not a valid ZIP/DOCX file')
    }

    const decoder = new TextDecoder('utf-8', { fatal: false })
    const fullText = decoder.decode(uint8Array)

    // Look for XML text content patterns common in DOCX files
    const textMatches: string[] = []

    // Pattern 1: Look for <w:t> tags (Word text elements)
    const wtMatches = fullText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)
    if (wtMatches) {
      wtMatches.forEach(match => {
        const textContent = match.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1')
        if (textContent && textContent.length > 1) {
          textMatches.push(textContent)
        }
      })
    }

    // Pattern 2: Look for text between XML tags
    const xmlTextMatches = fullText.match(/>([A-Za-z0-9\s\.,;:!?\-@()]+)</g)
    if (xmlTextMatches) {
      xmlTextMatches.forEach(match => {
        const textContent = match.replace(/^>([^<]+)<$/, '$1').trim()
        if (textContent && textContent.length > 2 && /[A-Za-z]/.test(textContent)) {
          textMatches.push(textContent)
        }
      })
    }

    // Combine and clean extracted text
    let extractedText = textMatches
      .filter(text => text.length > 2)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Remove common XML artifacts
    extractedText = extractedText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    console.log(`Fallback DOCX text extraction: found ${textMatches.length} text segments, ${extractedText.length} characters total`)

    return extractedText

  } catch (error) {
    console.error('Fallback DOCX extraction error:', error)
    throw error
  }
}