import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log('Webhook event received:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        console.log('Payment successful:', session.id)
        
        // Here you would typically:
        // 1. Update user's points in database
        // 2. Send confirmation email
        // 3. Log the transaction
        
        const { planId, userId } = session.metadata || {}
        
        if (planId && userId) {
          // Update user points based on plan
          const pointsToAdd = getPointsForPlan(planId)
          console.log(`Adding ${pointsToAdd} points to user ${userId}`)
          
          // In a real app, you'd update your database here
          // await updateUserPoints(userId, pointsToAdd)
        }
        
        break

      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object
        console.log('Payment failed:', paymentIntent.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}

function getPointsForPlan(planId: string): number {
  const pointsMap = {
    starter: 500,
    professional: 2000,
    enterprise: 10000
  }
  return pointsMap[planId as keyof typeof pointsMap] || 0
}