import { NextRequest, NextResponse } from 'next/server'
import { daysDb } from '@/lib/json-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const days = await daysDb.getByUser(userId)
    return NextResponse.json(days)
  } catch (error) {
    console.error('Error fetching days:', error)
    return NextResponse.json({ error: 'Failed to fetch days' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, date } = await request.json()
    
    if (!userId || !date) {
      return NextResponse.json({ error: 'userId and date are required' }, { status: 400 })
    }

    const newDay = await daysDb.create(userId, date)
    return NextResponse.json(newDay, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating day:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create day'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dayId = searchParams.get('dayId')
    
    if (!dayId) {
      return NextResponse.json({ error: 'dayId is required' }, { status: 400 })
    }

    await daysDb.delete(dayId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting day:', error)
    return NextResponse.json({ error: 'Failed to delete day' }, { status: 500 })
  }
}