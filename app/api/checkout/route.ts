import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { planId, planName, price } = await req.json()

    console.log("Creating checkout session for:", { planId, planName, price })

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `PassInterview.AI - ${planName}`,
              description: getPlanDescription(planId),
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/pricing?success=true&plan=${planId}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        planId,
        planName,
        userId: (session.user as any).id || session.user.email,
      },
      customer_email: session.user.email || '',
    })

    console.log("Checkout session created:", checkoutSession.id)

    return NextResponse.json({ sessionId: checkoutSession.id })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

function getPlanDescription(planId: string): string {
  const descriptions = {
    starter: 'Piano Starter - 500 punti per le tue interviste AI',
    professional: 'Piano Professional - 2000 punti + funzionalità avanzate', 
    enterprise: 'Piano Enterprise - Punti illimitati + supporto prioritario'
  }
  return descriptions[planId as keyof typeof descriptions] || 'Piano PassInterview.AI'
}