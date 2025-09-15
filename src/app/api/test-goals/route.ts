import { NextRequest, NextResponse } from 'next/server'
import { goalsApi, Goal } from '@/lib/client-api'

export async function POST(request: NextRequest) {
  try {
    const { userId, goalId, increment } = await request.json()
    
    console.log('🧪 TEST: Testing goal update:', { userId, goalId, increment })
    
    // Получаем все цели пользователя
    const goals = await goalsApi.getAll(userId)
    console.log('🧪 TEST: User goals:', goals.map((g: Goal) => ({ id: g.id, title: g.title, current: g.current_value })))
    
    // Находим цель
    const goal = goals.find((g: Goal) => g.id === goalId)
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    
    console.log('🧪 TEST: Found goal:', { title: goal.title, current: goal.current_value, target: goal.target_value })
    
    // Обновляем цель
    const newValue = goal.current_value + increment
    console.log('🧪 TEST: Updating goal from', goal.current_value, 'to', newValue)
    
    const updatedGoal = await goalsApi.update(goalId, {
      currentValue: newValue,
      isCompleted: newValue >= goal.target_value
    })
    
    console.log('🧪 TEST: Goal updated successfully:', updatedGoal)
    
    return NextResponse.json({
      success: true,
      goal: updatedGoal,
      oldValue: goal.current_value,
      newValue: newValue
    })
    
  } catch (error) {
    console.error('🧪 TEST: Error:', error)
    return NextResponse.json({ error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    
    const goals = await goalsApi.getAll(userId)
    
    return NextResponse.json({
      goals: goals.map((g: Goal) => ({
        id: g.id,
        title: g.title,
        current_value: g.current_value,
        target_value: g.target_value
      }))
    })
    
  } catch (error) {
    console.error('🧪 TEST: Error getting goals:', error)
    return NextResponse.json({ error: 'Failed to get goals' }, { status: 500 })
  }
}