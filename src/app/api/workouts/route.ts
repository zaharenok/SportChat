import { NextRequest, NextResponse } from 'next/server'
import { workoutsDb } from '@/lib/redis-db'
// Exercise type imported but used for type checking in function parameters

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dayId = searchParams.get('dayId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    let workouts
    if (dayId) {
      workouts = await workoutsDb.getByDay(dayId)
    } else {
      workouts = await workoutsDb.getByUser(userId)
    }

    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, dayId, chatMessageId, exercises } = await request.json()
    
    if (!userId || !dayId || !chatMessageId || !exercises) {
      return NextResponse.json({ 
        error: 'userId, dayId, chatMessageId, and exercises are required' 
      }, { status: 400 })
    }

    const newWorkout = await workoutsDb.create(userId, dayId, chatMessageId, exercises)
    return NextResponse.json(newWorkout, { status: 201 })
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workoutId = searchParams.get('workoutId')
    
    if (!workoutId) {
      return NextResponse.json({ error: 'workoutId is required' }, { status: 400 })
    }

    await workoutsDb.delete(workoutId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 })
  }
}