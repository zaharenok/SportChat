import { NextRequest, NextResponse } from 'next/server'
import { workoutsDb } from '@/lib/redis-db'
// Exercise type imported but used for type checking in function parameters

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dayId = searchParams.get('dayId')
    
    console.log('📖 API: Fetching workouts for:', { userId, dayId })
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    let workouts
    if (dayId) {
      workouts = await workoutsDb.getByDay(dayId)
      console.log('📖 API: Found workouts by day:', workouts?.length || 0)
    } else {
      workouts = await workoutsDb.getByUser(userId)
      console.log('📖 API: Found workouts by user:', workouts?.length || 0)
    }

    console.log('📖 API: Returning workouts:', workouts)
    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, dayId, chatMessageId, exercises } = await request.json()
    
    console.log('🏋️ API: Creating workout with data:', {
      userId,
      dayId, 
      chatMessageId,
      exercises: exercises?.length ? exercises : 'NO EXERCISES',
      exerciseDetails: exercises
    })
    
    if (!userId || !dayId || !chatMessageId || !exercises) {
      console.error('❌ API: Missing required fields:', { userId: !!userId, dayId: !!dayId, chatMessageId: !!chatMessageId, exercises: !!exercises })
      return NextResponse.json({ 
        error: 'userId, dayId, chatMessageId, and exercises are required' 
      }, { status: 400 })
    }

    const newWorkout = await workoutsDb.create(userId, dayId, chatMessageId, exercises)
    console.log('✅ API: Workout created successfully:', newWorkout)
    return NextResponse.json(newWorkout, { status: 201 })
  } catch (error) {
    console.error('❌ API: Error creating workout:', error)
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { workoutId, exercises } = await request.json()
    
    console.log('✏️ API: Updating workout with data:', {
      workoutId,
      exercises: exercises?.length ? exercises : 'NO EXERCISES',
      exerciseDetails: exercises
    })
    
    if (!workoutId || !exercises) {
      console.error('❌ API: Missing required fields:', { workoutId: !!workoutId, exercises: !!exercises })
      return NextResponse.json({ 
        error: 'workoutId and exercises are required' 
      }, { status: 400 })
    }

    const updatedWorkout = await workoutsDb.update(workoutId, { exercises })
    console.log('✅ API: Workout updated successfully:', updatedWorkout)
    return NextResponse.json(updatedWorkout)
  } catch (error) {
    console.error('❌ API: Error updating workout:', error)
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 })
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