import { NextRequest, NextResponse } from 'next/server'
import { workoutsDb } from '@/lib/redis-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId') || 'user-default' // default user
    
    if (action === 'list-by-month') {
      // Получаем все тренировки пользователя
      const allWorkouts = await workoutsDb.getByUser(userId)
      
      // Группируем по месяцам
      const workoutsByMonth: { [key: string]: Array<{
        id: string;
        created_at: string;
        day_id: string;
        exercises_count: number;
      }> } = {}
      
      allWorkouts.forEach(workout => {
        const date = new Date(workout.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!workoutsByMonth[monthKey]) {
          workoutsByMonth[monthKey] = []
        }
        workoutsByMonth[monthKey].push({
          id: workout.id,
          created_at: workout.created_at,
          day_id: workout.day_id,
          exercises_count: workout.exercises?.length || 0
        })
      })
      
      console.log('📊 Workouts by month:', workoutsByMonth)
      return NextResponse.json(workoutsByMonth)
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in admin workouts:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const months = searchParams.get('months')?.split(',') || []
    const userId = searchParams.get('userId') || 'user-default'
    
    if (months.length === 0) {
      return NextResponse.json({ error: 'No months specified' }, { status: 400 })
    }
    
    console.log('🗑️ Deleting workouts for months:', months, 'for user:', userId)
    
    // Получаем все тренировки пользователя
    const allWorkouts = await workoutsDb.getByUser(userId)
    
    // Находим ID тренировок для удаления
    const workoutsToDelete: string[] = []
    
    allWorkouts.forEach(workout => {
      const date = new Date(workout.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (months.includes(monthKey)) {
        workoutsToDelete.push(workout.id)
      }
    })
    
    console.log('🗑️ Found workouts to delete:', workoutsToDelete.length)
    
    // Удаляем каждую тренировку
    for (const workoutId of workoutsToDelete) {
      await workoutsDb.delete(workoutId)
      console.log('🗑️ Deleted workout:', workoutId)
    }
    
    return NextResponse.json({ 
      success: true, 
      deleted_count: workoutsToDelete.length,
      deleted_months: months 
    })
    
  } catch (error) {
    console.error('Error deleting workouts:', error)
    return NextResponse.json({ error: 'Failed to delete workouts' }, { status: 500 })
  }
}