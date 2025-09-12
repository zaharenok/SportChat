import { NextRequest, NextResponse } from 'next/server'
import { chatDb } from '@/lib/json-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dayId = searchParams.get('dayId')
    
    if (!dayId) {
      return NextResponse.json({ error: 'dayId is required' }, { status: 400 })
    }

    const messages = await chatDb.getByDay(dayId)
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, dayId, message, isUser } = await request.json()
    
    if (!userId || !dayId || !message || typeof isUser !== 'boolean') {
      return NextResponse.json({ 
        error: 'userId, dayId, message, and isUser are required' 
      }, { status: 400 })
    }

    const newMessage = await chatDb.create(userId, dayId, message, isUser)
    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error('Error creating chat message:', error)
    return NextResponse.json({ error: 'Failed to create chat message' }, { status: 500 })
  }
}