import { NextRequest, NextResponse } from 'next/server'
import { goalsDb } from '@/lib/redis-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const goals = await goalsDb.getByUser(userId)
    return NextResponse.json(goals)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, description, targetValue, currentValue = 0, unit, category = 'fitness', dueDate } = await request.json()
    
    if (!userId || !title || !targetValue) {
      return NextResponse.json({ 
        error: 'userId, title, and targetValue are required' 
      }, { status: 400 })
    }

    const newGoal = await goalsDb.create(userId, {
      title,
      description,
      targetValue,
      currentValue,
      unit,
      category,
      dueDate
    })
    return NextResponse.json(newGoal, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🎯 API: Received goal update request:', body)
    
    const { goalId, title, description, targetValue, currentValue, unit, category, dueDate, isCompleted } = body
    
    if (!goalId) {
      console.log('❌ API: goalId is missing')
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 })
    }

    console.log('🎯 API: Updating goal with data:', {
      goalId,
      currentValue,
      isCompleted
    })

    const updatedGoal = await goalsDb.update(goalId, {
      title,
      description,
      targetValue,
      currentValue,
      unit,
      category,
      dueDate,
      isCompleted
    })
    
    console.log('✅ API: Goal updated successfully:', updatedGoal)
    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error('❌ API: Error updating goal:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get('goalId')
    
    if (!goalId) {
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 })
    }

    await goalsDb.delete(goalId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}