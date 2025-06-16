import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const language = formData.get('language') as string || 'it'

    console.log("Processing speech-to-text:", {
      language,
      audioSize: audioFile?.size,
      audioType: audioFile?.type
    })

    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio file provided'
      }, { status: 400 })
    }

    // Check file size (OpenAI limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'Audio file too large (max 25MB)'
      }, { status: 400 })
    }

    // Check if file has content
    if (audioFile.size < 1000) {
      console.log("Audio file too small, skipping transcription")
      return NextResponse.json({
        success: true,
        text: "" // Empty text for very small files
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Create a properly named file for OpenAI
    const fileExtension = getFileExtension(audioFile.type)
    const renamedFile = new File([audioFile], `audio.${fileExtension}`, {
      type: audioFile.type
    })

    // Use OpenAI Whisper API for speech-to-text
    const transcriptionFormData = new FormData()
    transcriptionFormData.append('file', renamedFile)
    transcriptionFormData.append('model', 'whisper-1')
    transcriptionFormData.append('response_format', 'verbose_json')
    transcriptionFormData.append('temperature', '0.1')
    
    // Only set language if not auto
    if (language !== 'auto') {
      transcriptionFormData.append('language', language)
    }

    console.log("Sending request to OpenAI Whisper API...")

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: transcriptionFormData,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("OpenAI API error:", response.status, errorBody)
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    console.log("Speech-to-text result:", {
      text: result.text,
      language: result.language,
      duration: result.duration
    })

    // Only return non-empty transcriptions
    const text = result.text?.trim() || ""
    
    if (text.length < 3) {
      console.log("Transcription too short, ignoring")
      return NextResponse.json({
        success: true,
        text: ""
      })
    }

    return NextResponse.json({
      success: true,
      text: text,
      language: result.language,
      duration: result.duration,
      confidence: result.segments ? 
        result.segments.reduce((acc: number, seg: any) => acc + (seg.avg_logprob || 0), 0) / result.segments.length : 
        null
    })

  } catch (error: any) {
    console.error('Error in speech-to-text:', error)
    
    // Don't use fallback demo for real audio processing errors
    return NextResponse.json({
      success: false,
      error: error.message || 'Speech recognition failed',
      text: ""
    }, { status: 500 })
  }
}

// Helper function to get file extension from MIME type
function getFileExtension(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp4': 'mp4',
    'audio/wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg'
  }
  
  return mimeToExt[mimeType] || 'webm'
}