import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const configStatus = {
      openaiConfigured: !!(process.env.OPENAI_API_KEY && 
        !process.env.OPENAI_API_KEY.includes('dummy') && 
        !process.env.OPENAI_API_KEY.includes('your_') &&
        process.env.OPENAI_API_KEY.startsWith('sk-')),
      nextauthConfigured: !!(process.env.NEXTAUTH_SECRET && 
        !process.env.NEXTAUTH_SECRET.includes('your_') &&
        process.env.NEXTAUTH_SECRET.length >= 32),
      stripeConfigured: !!(process.env.STRIPE_SECRET_KEY && 
        !process.env.STRIPE_SECRET_KEY.includes('your_')),
      environment: process.env.NODE_ENV || 'development'
    }

    const isFullyConfigured = configStatus.openaiConfigured && configStatus.nextauthConfigured

    return NextResponse.json({
      success: true,
      configured: isFullyConfigured,
      details: configStatus,
      message: isFullyConfigured 
        ? "All essential services are properly configured"
        : "Some services need configuration - check the details",
      recommendations: [
        !configStatus.openaiConfigured && "Configure OpenAI API key for AI features",
        !configStatus.nextauthConfigured && "Generate and set NextAuth secret for authentication",
        !configStatus.stripeConfigured && "Configure Stripe keys for payment features (optional)"
      ].filter(Boolean)
    })

  } catch (error) {
    console.error('Configuration check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check configuration',
      configured: false
    }, { status: 500 })
  }
}