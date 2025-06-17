import { NextRequest, NextResponse } from 'next/server'

console.log('Configuration check API initialized');

export async function POST(req: NextRequest) {
  try {
    const hasOpenAI = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
    
    console.log('Configuration check:', {
      hasOpenAI,
      keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
    })
    
    return NextResponse.json({
      hasOpenAI,
      timestamp: new Date().toISOString(),
      message: hasOpenAI ? 'AI features available' : 'AI features require configuration'
    })
    
  } catch (error) {
    console.error('Config check error:', error)
    
    return NextResponse.json({
      hasOpenAI: false,
      error: 'Configuration check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}