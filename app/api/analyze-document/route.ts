// app/api/analyze-document/route.ts - ENHANCED VERSION WITH CHRONOLOGICAL EXPERIENCE EXTRACTION

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const targetLanguage = formData.get('language') as string || 'en'

    console.log("Enhanced analysis with chronological experience extraction:", {
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

    // Process all files with enhanced chronological extraction
    const analyses = await Promise.all(
      files.map(async (file, index) => {
        console.log(`Processing file ${index + 1}/${files.length}: ${file.name}`)

        // Determine document type using AI
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

          // PDF FILES
          else if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
            try {
              const arrayBuffer = await file.arrayBuffer()
              console.log(`Processing PDF file: ${file.name}, size: ${arrayBuffer.byteLength} bytes`)

              const extractedText = await extractTextFromBinary(arrayBuffer)
              if (extractedText && extractedText.length > 100) {
                fileText = extractedText
                charactersExtracted = extractedText.length
                extractionMethod = 'pdf_binary'
                console.log(`PDF binary extraction: ${charactersExtracted} characters extracted`)
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
            extractionError = `Unsupported file format: ${file.type || 'unknown'}. Supported formats: PDF, DOCX, TXT`
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
              summary: `ERROR: Cannot extract text from ${file.name}. ${extractionError}`,
              keyInsights: [
                `❌ Text extraction failed for ${file.name}`,
                `📄 File type: ${file.type || 'unknown'} (${(file.size / 1024).toFixed(1)} KB)`,
                `🔧 Reason: ${extractionError}`,
                extractionMethod === 'unsupported'
                  ? "💡 Solution: Upload a supported file format (PDF, DOCX, TXT)"
                  : "💡 Solution: Check file integrity and try again"
              ],
              extractedSkills: [],
              experienceDetails: {
                totalYears: "Analysis not available",
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
                email: "not extracted",
                phone: "not extracted",
                location: "not extracted"
              },
              documentQuality: {
                textExtractionSuccess: false,
                analyzableContent: false,
                recommendedAction: extractionMethod === 'unsupported'
                  ? "Upload a supported file format (PDF, DOCX, TXT)"
                  : "Check file integrity and try again"
              },
              charactersExtracted: 0,
              extractionMethod: extractionMethod,
              extractionError: extractionError,
              error: true
            }
          }

          // Continue with enhanced AI chronological analysis
          console.log(`Sending content to AI for enhanced chronological analysis: ${file.name} (${charactersExtracted} chars)`)

          // ENHANCED ANALYSIS PROMPT WITH CHRONOLOGICAL FOCUS
          const analysisPrompt = `You are an expert CV and document analyzer specializing in chronological work experience extraction. Analyze this document thoroughly and extract ALL professional experience in proper chronological order.

DOCUMENT INFORMATION:
- Filename: ${file.name}
- Type: ${docType}
- Size: ${(file.size / 1024).toFixed(1)} KB
- Extraction Method: ${extractionMethod}
- Characters Extracted: ${charactersExtracted}

DOCUMENT CONTENT:
${fileText || 'NO READABLE CONTENT AVAILABLE'}

CRITICAL INSTRUCTIONS FOR WORK EXPERIENCE EXTRACTION:
1. Extract ALL work experiences, internships, projects, and professional roles
2. Order them in REVERSE CHRONOLOGICAL ORDER (most recent first)
3. For each experience, determine:
   - Company name (exact name as written)
   - Job title/position (exact title as written)
   - Start date (month/year format, estimate if unclear)
   - End date (month/year or "Present" if current)
   - Duration calculation in years and months
   - Key responsibilities (bullet points from CV)
   - Technologies, tools, frameworks mentioned for that role
   - Industry sector (e.g., "Technology", "Finance", "Healthcare", "Consulting")
   - Company size category ("Startup", "SME", "Enterprise", "Fortune 500")

4. Calculate total years of experience by summing all professional roles
5. Identify career progression patterns and seniority levels
6. Extract industry expertise and domain knowledge
7. Categorize roles by function (e.g., "Software Development", "Project Management", "Sales")

COMPREHENSIVE OUTPUT FORMAT - Respond with this EXACT JSON format (NO MARKDOWN, NO CODE BLOCKS):
{
  "documentType": "${docType}",
  "extractionQuality": "${extractionMethod}",
  "summary": "Detailed professional summary based on chronological analysis of work experience",
  "keyInsights": [
    "Key insight about career progression and experience level",
    "Notable professional trajectory or industry expertise",
    "Assessment of seniority level and leadership experience"
  ],
  "extractedSkills": [
    "List of ALL technical skills, programming languages, frameworks, and tools found"
  ],
  "experienceDetails": {
    "totalYears": "X years Y months (calculated from all roles)",
    "careerLevel": "Junior/Mid-level/Senior/Executive based on experience and roles",
    "industries": ["Primary industry sectors worked in"],
    "functionalAreas": ["Job function categories like Development, Management, Sales"],
    "roles": ["All job titles found in chronological order"],
    "companies": ["All company names found in chronological order"],
    "workHistory": [
      {
        "company": "Most Recent Company Name",
        "position": "Most Recent Job Title",
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY or Present",
        "duration": "X years Y months",
        "industry": "Industry sector",
        "companySize": "Startup/SME/Enterprise/Fortune 500",
        "responsibilities": ["Key responsibility 1", "Key responsibility 2", "Key responsibility 3"],
        "technologies": ["Technology 1", "Technology 2", "Framework 1"],
        "achievements": ["Quantifiable achievement if mentioned"],
        "keywords": ["Important keywords from this role description"]
      }
    ]
  },
  "careerProgression": {
    "seniorityTrend": "Increasing/Stable/Lateral",
    "industryFocus": "Specialist in X industry or Generalist across industries",
    "functionalGrowth": "Description of how role responsibilities evolved",
    "leadershipExperience": "Evidence of team management or leadership roles"
  },
  "keyAchievements": [
    "Specific quantifiable achievements and accomplishments mentioned"
  ],
  "education": {
    "degrees": ["Educational qualifications found with years if available"],
    "institutions": ["Educational institutions and dates"],
    "certifications": ["Professional certifications with validity dates if mentioned"]
  },
  "contactInfo": {
    "email": "email found or 'not extracted'",
    "phone": "phone found or 'not extracted'",
    "location": "location/city found or 'not extracted'",
    "linkedin": "linkedin profile if found or 'not extracted'",
    "portfolio": "portfolio/website if found or 'not extracted'"
  },
  "documentQuality": {
    "textExtractionSuccess": true,
    "analyzableContent": true,
    "chronologicalDataQuality": "Excellent/Good/Fair/Poor based on date clarity",
    "experienceDataCompleteness": "Percentage estimate of how complete the work history extraction is",
    "recommendedAction": "Analysis completed successfully"
  }
}

CRITICAL REQUIREMENTS:
1. Return PURE JSON only, no markdown formatting, no code blocks, no additional text
2. Order ALL work experience from most recent to oldest in workHistory array
3. Extract exact dates when available, make reasonable estimates when unclear
4. Include ALL technologies/tools mentioned for each specific role
5. Calculate accurate total experience by summing all professional roles
6. Provide realistic industry categorization and company size assessment
7. Focus on CHRONOLOGICAL ACCURACY and COMPLETE EXPERIENCE EXTRACTION`

          const { text: analysis } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: analysisPrompt,
            temperature: 0.1,
            maxTokens: 2000, // Increased for detailed chronological data
          })

          console.log(`Enhanced chronological AI analysis completed for ${file.name}`)

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

            console.log(`Enhanced chronological analysis successful for ${file.name}:`, {
              extractionMethod,
              charactersExtracted,
              workHistoryEntries: result.experienceDetails?.workHistory?.length || 0,
              totalExperience: result.experienceDetails?.totalYears || 'Not calculated',
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
            summary: `CRITICAL ERROR: Cannot process ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
            keyInsights: [
              '❌ Critical error during file processing',
              '🔧 File might be corrupted or in unsupported format',
              '💡 Contact support if error persists'
            ],
            extractedSkills: [],
            experienceDetails: {
              totalYears: "Error in processing",
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
              email: "not extracted",
              phone: "not extracted",
              location: "not extracted"
            },
            documentQuality: {
              textExtractionSuccess: false,
              analyzableContent: false,
              recommendedAction: "Error in processing - try with a different file"
            },
            charactersExtracted: 0,
            extractionMethod: 'error',
            error: true
          }
        }
      })
    )

    console.log("All documents analyzed with enhanced chronological extraction:", analyses.map(a => ({
      type: a.documentType,
      extraction: a.extractionMethod,
      chars: a.charactersExtracted,
      experiences: a.experienceDetails?.workHistory?.length || 0,
      totalExp: a.experienceDetails?.totalYears || 'N/A',
      success: !a.error
    })))

    return NextResponse.json({
      success: true,
      analyses: analyses,
      summary: {
        totalFiles: analyses.length,
        successfulExtractions: analyses.filter(a => !a.error && a.charactersExtracted > 0).length,
        failedExtractions: analyses.filter(a => a.error).length,
        totalWorkExperiences: analyses.reduce((sum, a) => sum + (a.experienceDetails?.workHistory?.length || 0), 0),
        totalSkillsExtracted: analyses.reduce((sum, a) => sum + (a.extractedSkills?.length || 0), 0)
      }
    })

  } catch (error) {
    console.error('Critical error in enhanced chronological document analysis API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze document',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}

// Helper function for binary text extraction (existing implementation)
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
        if (cleaned.length >= 4 && /[A-Za-z]{2,}/.test(cleaned)) {
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

    // Strategy 3: Extract phone numbers
    const phones = rawText.match(/[\+]?[0-9\s\-\(\)]{10,}/g)
    if (phones) {
      phones.forEach(phone => {
        const cleanPhone = phone.replace(/[^\d\+]/g, '')
        if (cleanPhone.length >= 8 && cleanPhone.length <= 15) {
          readableChunks.push(phone.trim())
        }
      })
    }

    // Strategy 4: Extract dates
    const dates = rawText.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g)
    if (dates) {
      readableChunks.push(...dates)
    }

    // Strategy 5: Look for URLs
    const urls = rawText.match(/https?:\/\/[^\s]+/g)
    if (urls) {
      readableChunks.push(...urls)
    }

    // Remove duplicates and filter
    const uniqueChunks = Array.from(new Set(readableChunks))
      .filter(chunk => {
        const trimmed = chunk.trim()
        return trimmed.length >= 2 &&
          trimmed.length <= 100 &&
          !/^[^a-zA-Z]*$/.test(trimmed) &&
          !/[\x00-\x1F\x7F-\xFF]{3,}/.test(trimmed)
      })

    let extractedText = uniqueChunks
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    console.log(`Binary text extraction: found ${uniqueChunks.length} valid text segments`)
    console.log(`Total extracted length: ${extractedText.length} characters`)

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
    console.log(`Translating enhanced chronological analysis to ${targetLanguage}`)

    const translatePrompt = `Translate this enhanced CV analysis from English to ${getLanguageName(targetLanguage)}. 
    
Keep the JSON structure exactly the same, only translate the text content values. Do not translate:
- Field names/keys 
- Boolean values
- Numbers
- Email addresses
- Technical terms commonly used in English
- Company names
- Technology names

JSON to translate:
${JSON.stringify(analysis, null, 2)}

Respond with the translated JSON maintaining the exact same structure.`

    const { text: translatedText } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: translatePrompt,
      temperature: 0.1,
      maxTokens: 2500,
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

// Fallback DOCX text extraction function (existing implementation)
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer)

    if (uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
      throw new Error('Not a valid ZIP/DOCX file')
    }

    const decoder = new TextDecoder('utf-8', { fatal: false })
    const fullText = decoder.decode(uint8Array)

    const textMatches: string[] = []

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