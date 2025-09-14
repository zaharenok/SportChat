import { NextResponse } from 'next/server'
import { workoutsDb, redisDb, Workout } from '@/lib/redis-db'

export async function POST() {
  try {
    console.log('🧪 MANUAL TEST: Creating test workout...')
    
    // Создаем тестовую тренировку вручную
    const testExercises = [
      { name: 'подъемы ног', weight: 0, sets: 1, reps: 30 },
      { name: 'отжимания', weight: 0, sets: 3, reps: 15 }
    ]
    
    const testWorkout = await workoutsDb.create(
      'manual-test-user',
      'manual-test-day', 
      'manual-test-message',
      testExercises
    )
    
    console.log('✅ MANUAL TEST: Test workout created:', testWorkout)
    
    // Проверяем что тренировка сохранилась
    const allWorkouts = await redisDb.readArray<Workout>('workouts')
    const userWorkouts = await workoutsDb.getByUser('manual-test-user')
    
    return NextResponse.json({
      success: true,
      test_workout: testWorkout,
      total_workouts: allWorkouts.length,
      user_workouts: userWorkouts.length,
      user_workouts_data: userWorkouts,
      message: 'Manual workout test completed successfully!'
    })
  } catch (error) {
    console.error('❌ MANUAL TEST: Failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🔍 CHECK: Reading all workouts...')
    
    const allWorkouts = await redisDb.readArray<Workout>('workouts')
    const manualTestWorkouts = allWorkouts.filter(w => w.user_id === 'manual-test-user')
    
    return NextResponse.json({
      success: true,
      total_workouts: allWorkouts.length,
      manual_test_workouts: manualTestWorkouts.length,
      all_workouts: allWorkouts,
      message: 'Workouts data retrieved successfully!'
    })
  } catch (error) {
    console.error('❌ CHECK: Failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}