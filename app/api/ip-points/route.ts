import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// In-memory storage for IP points (in production, use a database)
const ipPointsStore = new Map<string, { points: number, lastUpdated: Date }>()

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : 
                     headersList.get('x-real-ip') || 
                     '127.0.0.1'

    console.log('Getting points for IP:', clientIp)

    // Get or initialize points for this IP
    let ipData = ipPointsStore.get(clientIp)
    if (!ipData) {
      ipData = { points: 30, lastUpdated: new Date() }
      ipPointsStore.set(clientIp, ipData)
      console.log('New IP, initialized with 30 points:', clientIp)
    }

    return NextResponse.json({ 
      points: ipData.points,
      ip: clientIp 
    })

  } catch (error) {
    console.error('Error getting IP points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : 
                     headersList.get('x-real-ip') || 
                     '127.0.0.1'

    const { action, points } = await request.json()
    
    console.log('IP points action:', action, 'points:', points, 'for IP:', clientIp)

    let ipData = ipPointsStore.get(clientIp)
    if (!ipData) {
      ipData = { points: 30, lastUpdated: new Date() }
      ipPointsStore.set(clientIp, ipData)
    }

    if (action === 'deduct') {
      ipData.points = Math.max(0, ipData.points - points)
      ipData.lastUpdated = new Date()
      ipPointsStore.set(clientIp, ipData)
      console.log('Deducted', points, 'points for IP:', clientIp, 'new balance:', ipData.points)
    } else if (action === 'add') {
      ipData.points += points
      ipData.lastUpdated = new Date()
      ipPointsStore.set(clientIp, ipData)
      console.log('Added', points, 'points for IP:', clientIp, 'new balance:', ipData.points)
    }

    return NextResponse.json({ 
      points: ipData.points,
      ip: clientIp 
    })

  } catch (error) {
    console.error('Error updating IP points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}